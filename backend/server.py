import json
import random
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
import io
import json
import os
import random
import subprocess

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from gtts import gTTS
from openai import OpenAI
from pydantic import BaseModel

conversation_memory = []

# -----------------------------
# Load environment
# -----------------------------

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = None

def get_client():
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in environment")
    global client
    if not client:
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
    return client

MODEL = "llama-3.3-70b-versatile"


# -----------------------------
# Load scenarios
# -----------------------------

with open("scenarios.json") as f:
    SCENARIOS = json.load(f)


# -----------------------------
# FastAPI setup
# -----------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Request format
# -----------------------------

class ConversationRequest(BaseModel):
    scenario: str
    user_text: str
    history: list[dict] = []

class SpeakRequest(BaseModel):
    text: str


# -----------------------------
# Health route
# -----------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# -----------------------------
# Conversation route
# -----------------------------

@app.post("/conversation")
def conversation(req: ConversationRequest):

    scenario = SCENARIOS.get(req.scenario)

    if not scenario:
        return {"error": "unknown scenario"}

    situation = random.choice(scenario["situations"])

    system_prompt = f"""
You are helping a Rohingya refugee practice spoken English.

The learner:
- may speak broken English
- may use fragments
- may be nervous

Your rules:
- respond naturally to what they mean
- never say they are wrong
- if needed, suggest a clearer sentence they could say
- keep sentences short and simple (1-2 sentences max)
- if the input appears to be Rohingya or completely broken, infer their English intent first and respond to that intent in English.

Scenario:
{situation}

You are playing the role of: {scenario["role"]}

You must output in valid JSON format matching this schema:
{{
  "understood": boolean, // false only if the speech is completely unintelligible
  "was_clear": boolean, // false if they were understood but the English was broken or could be significantly improved
  "character_response": string, // Your in-character response to the user's intent
  "correction": string | null, // A suggested clearer phrase for the user to try, or null if was_clear is true
  "session_end": boolean // true if this is the final wrap-up after about 4 exchanges
}}
"""
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(req.history)
    messages.append({"role": "user", "content": req.user_text})

    response = get_client().chat.completions.create(
        model=MODEL,
        messages=messages,
        response_format={"type": "json_object"}
    )

    text = response.choices[0].message.content

    try:
        parsed = json.loads(text)
        return parsed
    except json.JSONDecodeError:
        return {
            "understood": True,
            "was_clear": True,
            "character_response": "I see. Let's keep going.",
            "correction": None,
            "session_end": False
        }

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):

    audio_bytes = await file.read()

    response = get_client().audio.transcriptions.create(
        file=("speech.wav", audio_bytes),
        model="whisper-large-v3"
    )

    return {"text": response.text}

@app.post("/voice-conversation")
async def voice_conversation(file: UploadFile = File(...), scenario: str = "grocery"):

    audio_bytes = await file.read()

    # speech → text
    stt = get_client().audio.transcriptions.create(
        file=("speech.wav", audio_bytes),
        model="whisper-large-v3"
    )

    user_text = stt.text

    scenario_data = SCENARIOS.get(scenario)

    situation = random.choice(scenario_data["situations"])

    system_prompt = f"""
You are helping a Rohingya refugee practice spoken English.

They may speak broken English.

Respond naturally and suggest a clearer sentence if needed.

Scenario:
{situation}

You are playing: {scenario_data["role"]}

Format:

AI_REPLY: ...
SUGGESTED_PHRASE: ...
"""

    response = get_client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ]
    )

    return {
        "user_text": user_text,
        "response": response.choices[0].message.content
    }

# -----------------------------
# Speak route
# -----------------------------

@app.post("/speak")
def speak(req: SpeakRequest):
    tts = gTTS(text=req.text, lang='en')
    mp3_fp = io.BytesIO()
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)
    
    return StreamingResponse(mp3_fp, media_type="audio/mpeg")

@app.post("/voice-chat")
async def voice_chat(file: UploadFile = File(...), scenario: str = "grocery"):

    # 1. save audio
    input_path = "input.wav"
    with open(input_path, "wb") as f:
        f.write(await file.read())

    # 2. speech → text
    with open(input_path, "rb") as audio:
        transcription = get_client().audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio
        )

    user_text = transcription.text

    # 3. load scenario
    scenario_data = SCENARIOS.get(scenario)

    if scenario_data is None:
        return {"error": "unknown scenario"}

    situation = random.choice(scenario_data["situations"])
    role = scenario_data["role"]

    starter = {
    "grocery": "Hello! How can I help you today?",
    "doctor": "Hello, what seems to be the problem?",
    "bus": "Where are you going today?",
    "school": "Hello! How can I help you with school registration?"
    }.get(scenario, "Hello! How can I help you?")

    # 4. generate response
    
    messages = [
        {
            "role": "system",
            "content": f"""
    You are helping a beginner practice spoken English through conversation.

    Scenario: {situation}

    The conversation begins with you saying:
    "{starter}"
    You are a: {role}

    The learner may speak in broken English.

    Rules:
    - respond naturally to what they mean
    - use very simple English
    - keep responses short (1 sentence)

    After your reply, suggest a clearer sentence the learner could say.

    Format exactly like this:

    Response: <your reply>

    Try saying: "<corrected sentence>"
    """
        }
    ]

    messages.extend(conversation_memory)

    messages.append({"role": "user", "content": user_text})

    response = get_client().chat.completions.create(
        model=MODEL,
        max_tokens=40,
        temperature=0.7,
        messages=messages
    )

    reply_text = response.choices[0].message.content.strip()

    conversation_memory.append({"role": "user", "content": user_text})
    conversation_memory.append({"role": "assistant", "content": reply_text})
    conversation_memory[:] = conversation_memory[-10:]

    print("USER:", user_text)
    print("AI:", reply_text)

    # 5. text → speech
    output_file = "reply.mp3"

    tts = gTTS(text=reply_text, lang="en", slow=False)
    tts.save(output_file)
    # 5. return audio
    return FileResponse(output_file, media_type="audio/mpeg")
