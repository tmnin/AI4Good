---

# PRD: Kotha — Conversation Loop

**Scope:** MVP conversation loop only. 5-hour hackathon build.

---

## Overview

The conversation loop is the core of Kotha. A user selects a scenario, the AI plays a character (e.g. bus driver, doctor), and they exchange spoken turns. The AI responds naturally, gently corrects unclear English, and guides the user to repeat better phrasing before continuing. Each session is 3–4 turns long. The experience is **audio-only** — no transcript is shown to the user.

---

## What's Built (Backend)

**File:** `server.py` — FastAPI server using Groq (`llama-3.3-70b-versatile`) via the OpenAI-compatible client.

### Active Endpoint: `POST /voice-chat`

The primary conversation endpoint. Handles the full pipeline in one call:

```
Audio file → Whisper STT → LLM → gTTS → MP3 audio response
```

**Query param:** `?scenario=grocery` (default)

**Returns:** `audio/mpeg` stream (AI spoken response)

**What it does:**
- Saves uploaded audio to `input.wav`, transcribes via Whisper (`whisper-large-v3`)
- Looks up the scenario from `scenarios.json`
- Locks the situation for a session via `active_sessions[scenario]` so the same situation is used across turns
- Tracks turn count per scenario (`active_sessions[scenario]["turns"]`)
- Flags `is_final_turn` when turns ≥ 3
- Sends system prompt + `conversation_memory` (last 10 messages) + user text to Groq
- Converts LLM reply to speech via gTTS, returns as MP3
- Clears session after 4 turns (`del active_sessions[scenario]`)
- Logs transcript to server console for debugging only (`print("USER:", ...)`)

### Other Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Serves `mic.html` over HTTP |
| `GET /health` | Health check — returns `{"status": "ok"}` |
| `POST /conversation` | Text-only conversation (JSON in/out, no audio) |
| `POST /transcribe` | STT only — returns `{"text": "..."}` |
| `POST /voice-conversation` | Audio in, returns `{"user_text": ..., "response": ...}` |
| `POST /speak` | TTS only — takes `{"text": "..."}`, returns audio stream |

> **Note:** `/voice-chat` is the active endpoint. `/transcribe`, `/voice-conversation`, and `/conversation` are legacy/unused in the current frontend.

---

## Session Management

**`active_sessions`** (in-memory dict, keyed by scenario name):
```python
active_sessions[scenario] = {
    "situation": "...",  # locked at start of session
    "turns": 0           # incremented each call
}
```
- Session is created on first call for a scenario
- Situation is fixed for the duration of the session (consistent context)
- `is_final_turn = turns >= 3` is passed to the LLM prompt
- Session is deleted when `turns >= 4`

**`conversation_memory`** (global list, last 10 messages):
- Appended each turn: user message + AI reply (raw text)
- Trimmed to 10 entries: `conversation_memory[:] = conversation_memory[-10:]`

---

## LLM Prompt (Current)

The system prompt sent to Groq instructs the model to respond in **plain text** with this format:

```
Response: <reply + optional follow-up question>

Correction: "<grammar correction>" OR null
```

Rules encoded in the prompt:
- Respond naturally in character (1 short sentence)
- Ask a simple follow-up question to continue the conversation
- Only give a correction if the learner's sentence has a grammar mistake
- If already correct, do NOT repeat it
- Keep responses very short and simple
- If input is Rohingya or broken English, infer English intent and respond to that
- `Final turn: True/False` is passed in the prompt to signal wrap-up

**Note:** `response_format={"type": "json_object"}` is **not** used — the prompt targets plain text output.

---

## Scenarios (`scenarios.json`)

Four scenarios, each with a role and 3 situation strings:

| Scenario | Role | Situations |
|---|---|---|
| `grocery` | grocery store worker | Finding items, halal meat/fish, ingredients |
| `doctor` | clinic receptionist | Sick child, seeing a doctor, pharmacy location |
| `bus` | bus driver | Which bus, fare cost, where to get off |
| `school` | school office staff | Child registration, classroom location, school hours |

---

## Frontend (`mic.html`)

Served at `http://127.0.0.1:8000/` — must be opened via HTTP, not `file://` (browser blocks mic on `file://`).

**Audio-only experience** — no text shown to the user.

Flow:
1. User picks a scenario
2. Clicks **Start** → mic records via `MediaRecorder`
3. Clicks **Stop** → audio blob sent to `POST /voice-chat?scenario=...`
4. Response MP3 played back immediately via `Audio` API

---

## Conversation States

```
SCENARIO_INTRO → AI_TURN → USER_TURN → PROCESSING → [CORRECTION_LOOP] → AI_TURN → ... → SESSION_END
```

### 1. `SCENARIO_INTRO`
- AI speaks an opening line that sets the scene in character.
- Hardcoded starter lines per scenario:
  - grocery: *"Hello! How can I help you today?"*
  - doctor: *"Hello, what seems to be the problem?"*
  - bus: *"Where are you going today?"*
  - school: *"Hello! How can I help you with school registration?"*

### 2. `USER_TURN`
- Mic activates. User speaks in English or Rohingya.
- STT (Whisper) transcribes speech.

### 3. `PROCESSING`
- Audio sent to `/voice-chat`. LLM processes.
- If input was Rohingya: prompt instructs LLM to infer English intent first.

### 4. `AI_RESPONSE`
- AI responds in character (plain text → gTTS → MP3 played back).
- If English was unclear: response includes a correction phrase.
- Correction is spoken as part of the audio reply (not displayed as text).

### 5. `SESSION_END`
- Triggers after 4 turns (`active_sessions` deleted).
- LLM is flagged with `Final turn: True` at turn 3 to prompt a wrap-up.

---

## Error & Edge Cases

| Situation | Behaviour |
|---|---|
| Unknown scenario | Returns `{"error": "unknown scenario"}` |
| LLM returns garbled output | Raw text still sent to gTTS — no crash |
| `active_sessions` key missing on turn 4 check | `del active_sessions[scenario]` — safe if session exists |
| Browser opens `mic.html` via `file://` | Mic blocked by browser — must use `http://127.0.0.1:8000/` |

---

## Live Phrase Assistant (Stretch Feature)

A persistent tab the user can keep open **during a real conversation** (e.g. at a grocery store, doctor's office). When they forget an English word or phrase mid-sentence, they tap the mic, say what they need **in Rohingya**, and the app speaks back the completed English phrase they should say.

### How It Works

1. User is mid-conversation in real life and gets stuck
2. They tap the mic in the Live Phrase Assistant tab
3. They say something in Rohingya (e.g. *"how do I ask where the fish is?"*)
4. Whisper transcribes it; LLM detects it's Rohingya and infers English intent
5. App speaks back a short, ready-to-say English phrase (e.g. *"Can you show me where the fish is?"*)
6. User repeats it to the person they're talking to

### Endpoint

```
POST /phrase-assist
Body: audio file
Returns: audio/mpeg — a single English phrase, spoken aloud
```

### LLM Prompt Behavior
- Detect if input is Rohingya, broken English, or English
- Infer what the user is trying to say or ask
- Return **one short, natural English sentence** the user can repeat right now
- Do not explain, do not correct — just give the phrase

### UI
- Separate tab or page from the scenario practice mode
- Always-available mic button — tap to ask, releases when done
- No text shown — audio response only
- Should feel instant (low latency priority)

---

## Out of Scope (MVP)

- Session history / progress tracking
- Pronunciation scoring
- Rohingya TTS (AI speaks English only)
- Emergency phrases mode
- "Speak in Rohingya" translation mode
- Transcript display (audio-only by design)
- Multi-user sessions (single global `conversation_memory`)

---

## Tech Stack

| Layer | Tool |
|---|---|
| LLM | Groq `llama-3.3-70b-versatile` |
| STT | Groq Whisper (`whisper-large-v3`) |
| TTS | gTTS |
| Backend | FastAPI (`server.py`) |
| Frontend | `mic.html` (plain HTML/JS, served by FastAPI) |