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
active_sessions = {}

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
    allow_origins=["*"],
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

@app.get("/")
def serve_mic():
    return FileResponse("mic.html")

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
  "understood": boolean,
  "was_clear": boolean,
  "character_response": string,
  "correction": string | null,
  "session_end": boolean
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

# -----------------------------
# Voice conversation
# -----------------------------

@app.post("/voice-chat")
async def voice_chat(file: UploadFile = File(...), scenario: str = "food"):

    audio_bytes = await file.read()

    transcription = get_client().audio.transcriptions.create(
        file=("speech.webm", audio_bytes),
        model="whisper-large-v3"
    )

    user_text = transcription.text

    scenario_data = SCENARIOS.get(scenario)

    if scenario_data is None:
        return {"error": "unknown scenario"}

    if scenario not in active_sessions:
        active_sessions[scenario] = {
            "situation": random.choice(scenario_data["situations"]),
            "turns": 0
        }

    situation = active_sessions[scenario]["situation"]
    role = scenario_data["role"]
    active_sessions[scenario]["turns"] += 1

    starter = {
        "food": "Hello! How can I help you today?",
        "doctor": "Hello, what seems to be the problem?",
        "bus": "Where are you going today?",
        "school": "Hello! How can I help you with school registration?"
    }.get(scenario, "Hello! How can I help you?")

    messages = [
        {
            "role": "system",
            "content": f"""
You are helping a beginner practice spoken English through conversation.

Scenario: {situation}

The conversation begins with you saying:
"{starter}"

You are a: {role}

Rules:
- Respond naturally in character first (1 short sentence).
- Ask a simple follow-up question if appropriate.
- Only give grammar correction if necessary.

Format exactly like:

Response: <reply>

Correction: "<grammar correction>" OR null
"""
        }
    ]

    messages.extend(conversation_memory)
    messages.append({"role": "user", "content": user_text})

    response = get_client().chat.completions.create(
        model=MODEL,
        temperature=0.7,
        messages=messages
    )

    reply_raw = response.choices[0].message.content.strip()

    # extract only the spoken response
    if "Response:" in reply_raw:
        reply_text = reply_raw.split("Response:")[1].split("Correction:")[0].strip()
    else:
        reply_text = reply_raw

    # keep correction internally but don't speak it
    correction = None
    if "Correction:" in reply_raw:
        correction = reply_raw.split("Correction:")[1].strip()
    conversation_memory.append({"role": "user", "content": user_text})
    conversation_memory.append({"role": "assistant", "content": reply_text})
    conversation_memory[:] = conversation_memory[-10:]

    audio_buffer = io.BytesIO()

    tts = gTTS(text=reply_text, lang="en", slow=False)
    tts.write_to_fp(audio_buffer)

    audio_buffer.seek(0)

    return {
        "reply": reply_text,
        "correction": correction,
        "audio": audio_buffer.getvalue().hex()
    }