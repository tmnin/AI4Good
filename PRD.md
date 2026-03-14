---

# PRD: Kotha — Conversation Loop

**Scope:** MVP conversation loop only. 5-hour hackathon build.

---

## Overview

The conversation loop is the core of Kotha. A user selects a scenario, the AI plays a character (e.g. bus driver, doctor), and they exchange spoken turns. The AI responds naturally, gently corrects unclear English, and guides the user to repeat better phrasing before continuing. Each session is 3–4 turns long. The experience is **audio-only** — no transcript is shown to the user.

---

## Feature: Live Phrase Assistant

**Goal:** A "real-time listening" mode that a user can keep active during a real-world conversation. If the user forgets an English word or gets stuck, they can speak in Rohingya or broken English, and the AI immediately provides the natural English sentence they need to say.

**Endpoint:** `POST /phrase-assist`
- **Input:** Audio file (speech in Rohingya or broken English)
- **Output:** `audio/mpeg` stream (The natural English phrase spoken clearly)
- **Prompt Logic:** Precise, natural, and situational English phrases ready for immediate repetition.

---

## What's Built (Backend)

**File:** `server.py` — FastAPI server using Groq (`llama-3.3-70b-versatile`) via the OpenAI-compatible client.

### Active Endpoint: `POST /voice-chat`

The primary conversation endpoint. Handles the full pipeline:

```
Audio file → Whisper STT → LLM → gTTS → JSON {reply, correction, audio (hex)}
```

**Query param:** `?scenario=food` (default)
**Returns:** JSON object containing:
- `reply`: The AI's in-character response.
- `correction`: A suggested clearer phrase (or null).
- `audio`: Hex-encoded MP3 audio of the reply + educational advice + correction.

**Key Features:**
- **Educational Advice**: AI now provides "learning tips" (e.g., explaining why a correction was made) as part of the audio response.
- **Text Cleaning**: Automatic removal of quotation marks and headers ("Response:", "Advice:") before speech synthesis to ensure natural audio.
- **Session Persistence**: Locks situations and tracks turn counts (3-4 turns per session).

### Other Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Serves `mic.html` |
| `GET /phrase` | Serves `phrase.html` (Live Phrase Assistant UI) |
| `POST /phrase-assist` | Instant English help from Rohingya/English audio |
| `POST /conversation` | Text-only JSON interaction (returns `advice` field) |
| `POST /speak` | TTS only — takes text, returns audio stream |

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

Advice: <educational tip> OR null

Correction: <grammar correction> OR null
```

Rules encoded in the prompt:
- Respond naturally in character (1 short sentence)
- Ask a simple follow-up question to continue the conversation
- If a grammar mistake exists, provide a simple piece of advice and then the correction
- If already correct, do NOT repeat it
- Keep responses very short and simple
- Do NOT use quotation marks in the output (to prevent gTTS "quote" issue)
- `Final turn: True/False` is passed in the prompt to signal wrap-up

---

## Scenarios (`scenarios.json`)

The system supports 15 specialized scenarios with custom AI roles and starter lines:

| Category | Scenarios |
|---|---|
| **Everyday** | Food, Bus, Doctor, School, Medicine, Work, House, Bank, Community, Restaurant |
| **Emergency** | 911 Call, Police, Hospital, Shelter |
| **Learning** | Free Conversation |

---

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