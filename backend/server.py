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

# -----------------------------
# Load environment
# -----------------------------

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1"
)

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

    response = client.chat.completions.create(
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

    response = client.audio.transcriptions.create(
        file=("speech.wav", audio_bytes),
        model="whisper-large-v3"
    )

    return {"text": response.text}

@app.post("/voice-conversation")
async def voice_conversation(file: UploadFile = File(...), scenario: str = "grocery"):

    audio_bytes = await file.read()

    # speech → text
    stt = client.audio.transcriptions.create(
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

    response = client.chat.completions.create(
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
async def voice_chat(file: UploadFile = File(...)):

    # 1. save uploaded audio
    input_path = "input.wav"
    with open(input_path, "wb") as f:
        f.write(await file.read())

    # 2. transcribe audio
    with open(input_path, "rb") as audio:
        transcription = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio
        )

    user_text = transcription.text

    # 3. send to LLM
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=40,
        temperature=0.7,
        messages=[
            {
                "role": "system",
                "content": "You are having a short conversation to help someone practice English. Respond in ONE short sentence only."
            },
            {"role": "user", "content": user_text}
        ]
    )

    reply_text = response.choices[0].message.content
    print("USER:", user_text)
    print("AI:", reply_text)

    # 4. convert reply to speech
    output_file = "reply.mp3"

    reply_text = reply_text.strip()

    if len(reply_text) > 200:
        reply_text = reply_text[:200]

    tts = gTTS(text=reply_text, lang="en", slow=False)
    tts.save(output_file)
    # 5. return audio
    return FileResponse(output_file, media_type="audio/mpeg")
