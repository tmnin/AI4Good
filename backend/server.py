import json
import random
import os

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
import io
import subprocess
from fastapi.responses import FileResponse
from gtts import gTTS

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
- keep sentences short and simple

Scenario:
{situation}

You are playing the role of: {scenario["role"]}

Output exactly like this:

AI_REPLY: <your response>
SUGGESTED_PHRASE: <clearer sentence or NONE>
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.user_text}
        ]
    )

    text = response.choices[0].message.content

    return {"response": text}

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

@app.get("/speak")
def speak(text: str):

    output_file = "speech.mp3"

    tts = gTTS(text=text, lang="en")
    tts.save(output_file)

    return FileResponse(output_file, media_type="audio/mpeg")