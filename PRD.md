---

# PRD: Kotha — Conversation Loop

**Scope:** MVP conversation loop only. 5-hour hackathon build.

---

## Overview

The conversation loop is the core of Kotha. A user selects a scenario, the AI plays a character (e.g. bus driver, doctor), and they exchange spoken turns. The AI responds naturally, gently corrects unclear English, and guides the user to repeat better phrasing before continuing. Each session is 3–5 turns long.

---

## What's Already Built (Backend)

**File:** `server.py` — FastAPI server using Groq (`llama-3.3-70b-versatile`) via the OpenAI-compatible client.

**Endpoint:** `POST /conversation`
```json
Request:  { "scenario": "bus", "user_text": "i want hospital" }
Response: { "response": "AI_REPLY: ...\nSUGGESTED_PHRASE: ..." }
```

**Endpoint:** `GET /health`

**What it does:**
- Loads `scenarios.json` at startup
- Picks a random situation string for the given scenario
- Sends a system prompt + user text to Groq
- Returns raw text with two fields: `AI_REPLY` and `SUGGESTED_PHRASE` (or `NONE`)

**Current gaps to address:**
- Response is a raw string, not structured JSON — frontend needs to parse `AI_REPLY:` and `SUGGESTED_PHRASE:` out of text. Should be migrated to JSON output (see LLM Prompt Contract below)
- No conversation history is passed — each turn is stateless. Multi-turn context needs to be added
- No TTS endpoint yet — audio generation (gTTS) exists but isn't wired up
- `scenarios.json` only has 3 scenarios (grocery, doctor, bus) — needs expanding
- `session_end` signal not yet implemented

---

## Conversation States

The loop moves through these states in order:

```
SCENARIO_INTRO → AI_TURN → USER_TURN → PROCESSING → [CORRECTION_LOOP] → AI_TURN → ... → SESSION_END
```

### 1. `SCENARIO_INTRO`
- AI speaks an opening line that sets the scene in character.
- This is dynamically generated — same scenario should feel different each time.
- Example: *"Hello! I'm the bus driver. Where are you going today?"*
- UI shows the scenario image + pulsing mic. A soft beep plays when it's the user's turn.

### 2. `USER_TURN`
- Mic activates. Pulses to indicate readiness.
- User speaks in English or Rohingya.
- STT (Whisper) transcribes speech.
- If **nothing intelligible** is captured after ~4 seconds: go to `UNCLEAR_SPEECH`.

### 3. `UNCLEAR_SPEECH` (sub-state)
- AI says something encouraging: *"I didn't catch that — could you try again?"*
- Mic re-activates. Max **2 retries**.
- After 2 failed retries: AI gently moves on — *"That's okay, let's keep going."* — and advances the turn counter.

### 4. `PROCESSING`
- Show bouncing dots while the LLM processes.
- If input was Rohingya: the LLM prompt instructs it to infer English intent first, then respond.
- LLM evaluates: did the user communicate their intent clearly enough?

### 5. `AI_RESPONSE` — two paths:

#### Path A — Input was clear enough:
- AI stays in character and responds naturally.
- Show thumbs up emoji briefly before AI speaks.
- Advance turn counter.

#### Path B — Input was unclear but understandable:
- AI **breaks character gently**, gives a correction:
  - *"I understand you! Try saying: 'Can you tell me if this bus goes to the hospital?'"*
- The suggested phrase is displayed as text on screen + spoken aloud by TTS.
- Enter `CORRECTION_LOOP`.

### 6. `CORRECTION_LOOP`
- Mic re-activates. User attempts the suggested phrase.
- LLM evaluates attempt **leniently** — any reasonable attempt passes.
- **Pass:** Thumbs up + AI resumes in character, responding to the corrected phrase. Advance turn counter.
- **Fail:** One more attempt offered — *"Good try! One more time."*
- After second failed attempt: pass automatically, advance turn counter. Never punish.

### 7. `SESSION_END`
- Triggers after **4 completed exchanges**.
- AI wraps up in character: *"Great talking with you! You did really well."*
- UI shows a simple end screen — scenario complete.

---

## LLM Prompt Contract

The current backend returns a raw string. This should be migrated to structured JSON. Update the system prompt to output:

```json
{
  "understood": true,
  "was_clear": false,
  "character_response": "Of course! The next stop is Main Street.",
  "correction": "Can you tell me what the next stop is?",
  "session_end": false
}
```

Rules encoded in the prompt:
- Never say the user is wrong
- If input appears to be Rohingya, infer English intent and respond to that
- Keep all responses to 1–2 sentences
- `correction` is `null` if `was_clear` is `true`
- `session_end` is `true` on the final turn wrap-up

To migrate, replace the current `AI_REPLY` / `SUGGESTED_PHRASE` text format in `server.py` with an explicit JSON-only instruction, and parse `response.choices[0].message.content` as JSON on the backend before returning it to the frontend.

---

## Multi-turn History

The current `/conversation` endpoint is stateless. To support context across turns, the frontend should maintain a `messages` array and send it with each request:

```json
{
  "scenario": "bus",
  "history": [
    { "role": "assistant", "content": "Hello! Where are you going today?" },
    { "role": "user", "content": "hospital" }
  ],
  "user_text": "which bus go there"
}
```

The backend should prepend the system prompt and append `user_text` as the latest user message before sending to Groq.

---

## TTS Wiring

gTTS is available but not yet exposed as an endpoint. A minimal endpoint to add:

```
POST /speak
Body: { "text": "Try saying: Can I have some rice please?" }
Returns: audio/mpeg stream
```

The frontend calls this after every `character_response` and every `correction` to play audio back to the user.

---

## Turn & State Logic (Frontend)

```
turnCount = 0
MAX_TURNS = 4

on user input received:
  → send to /conversation with history + user_text
  → if understood = false AND retries < 2: re-prompt user
  → if was_clear = false: enter CORRECTION_LOOP, call /speak with correction text
  → if was_clear = true OR correction loop passed: call /speak with character_response, turnCount++
  → if turnCount >= MAX_TURNS OR session_end = true: go to SESSION_END
```

---

## Error & Edge Cases

| Situation | Behaviour |
|---|---|
| Total STT failure (2x) | Skip turn, advance counter, AI says "let's keep going" |
| Correction loop failed (2x) | Auto-pass, advance turn, never penalise |
| LLM returns malformed JSON | Fallback: treat as `was_clear: true`, play a generic in-character filler line |
| `/speak` TTS call fails | Skip audio, show text only |
| User taps back mid-session | Return to home, session discarded, no penalty |

---

## Out of Scope (MVP)

- Session history / progress tracking
- Pronunciation scoring
- Rohingya TTS (AI speaks English only)
- Emergency phrases mode
- "Speak in Rohingya" translation mode

---

## Tech Stack

| Layer | Tool |
|---|---|
| LLM | Groq `llama-3.3-70b-versatile` |
| STT | Whisper (or Groq Whisper) |
| TTS | gTTS (already in repo) |
| Backend | FastAPI (`server.py`) |
| Frontend | TBD (teammate) |