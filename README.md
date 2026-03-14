# 🎙️ AI4Good — Rohingya Conversation Coach

A voice-first learning app that helps Rohingya newcomers practice real-life English through guided roleplay scenarios (bus, doctor, grocery, school, and more).

---

## Project Structure

```text
AI4Good/
├── backend/                      ← FastAPI server (speech + conversation APIs)
│   ├── server.py
│   ├── scenarios.json
│   ├── requirements.txt
│   └── .env.example              ← GROQ_API_KEY template
│
├── frontend/                     ← React + Vite + Tailwind app
│   ├── package.json
│   └── src/
│       └── app/
│           ├── App.tsx
│           └── components/
│               ├── dashboard-screen.tsx
│               ├── scenario-screen.tsx
│               ├── help-modal.tsx
│               └── sidebar.tsx
│
└── README.md
```

---

## How to Use

### 1. (Optional) Add your Groq API key

Create `backend/.env`:

```env
GROQ_API_KEY=your_api_key_here
```

> If you only need TTS (`/speak`), the key is not required.

---

### 2. Install dependencies

```bash
# From project root
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

---

### 3. Run both servers

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn server:app --reload
# ✅ Backend running → http://localhost:8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# ✅ Frontend running → http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## How It Works

1. User selects a scenario from the frontend dashboard.
2. User speaks (or types, depending on flow) in Rohingya/English.
3. Frontend sends audio/text to backend endpoints.
4. Backend transcribes speech (Whisper via Groq), generates short roleplay replies (LLM), and returns guidance.
5. Backend converts selected text into audio with `gTTS`.
6. Frontend plays returned MP3 audio for phrase playback and practice.

---


## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS |
| Backend | FastAPI, Uvicorn |
| LLM/STT | Groq API (OpenAI-compatible SDK), Whisper (`whisper-large-v3`) |
| TTS | gTTS |

---

## Main API Endpoints

### Health

```http
GET /health
```

Response:

```json
{
	"status": "ok"
}
```

### Text-to-Speech (TTS)

```http
POST /speak
Content-Type: application/json
```

Request:

```json
{
	"text": "Does this bus go to the hospital?"
}
```

Response: `audio/mpeg` stream

### Conversation

```http
POST /conversation
Content-Type: application/json
```

Request:

```json
{
	"scenario": "bus",
	"user_text": "I need bus to hospital",
	"history": []
}
```

Response (shape):

```json
{
	"understood": true,
	"was_clear": false,
	"character_response": "Yes, this bus goes there.",
	"correction": "Does this bus go to the hospital?",
	"session_end": false
}
```

### Speech-to-Text

```http
POST /transcribe
Content-Type: multipart/form-data
```

Upload field name: `file`

### Voice Conversation

```http
POST /voice-conversation?scenario=grocery
Content-Type: multipart/form-data
```

Upload field name: `file`

### Voice Chat (audio in, audio out)

```http
POST /voice-chat?scenario=grocery
Content-Type: multipart/form-data
```

Upload field name: `file`
