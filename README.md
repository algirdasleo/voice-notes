# Voice Notes

> Live: [voicenotes.framer.ai](https://voicenotes.framer.ai)

## Overview

Voice Notes is a full-stack AI-powered application for recording, managing, and interacting with voice-based notes. It combines speech-to-text transcription, RAG-based conversational AI, and intelligent content generation into a single platform.

## Features

### Voice Recording & Transcription

- In-browser audio recording with microphone device selection and mute toggle
- Real-time waveform visualization during recording
- Playback before submitting
- Automatic speech-to-text via OpenAI Whisper (`whisper-1`)

### Note Management

- Auto-generated titles from transcription text
- AI-suggested tags (4 per note) plus custom tag creation
- Full CRUD operations with tag-based filtering
- Card grid with emoji icons and relative timestamps

### AI Content Generation

- Select one or more notes, choose a content type, and generate polished content
- **7 content types**: Meeting Report, To-Do List, Translate, Blog Post, Email, Summary, Custom Prompt
- Structured AI output with markdown formatting
- Browsable, copyable, and filterable content library

### AI Chat (RAG)

- Real-time streaming chat over WebSocket (token-by-token)
- ReAct agent with 4 tools: `search_notes` (semantic similarity), `list_notes`, `get_note`, `web_search` (Tavily)
- Project-scoped filtering — restrict chat context to specific projects
- Markdown rendering with syntax highlighting
- Suggestion prompts for quick start

### Projects

- Organize notes into projects with name, description, emoji icon (16 options), and color (8 options)
- Assign/unassign notes via searchable multi-select dialog
- Project list in sidebar with note counts
- Project context available for scoping chat queries

### Authentication

- Email/password sign-up and sign-in via SuperTokens
- Google OAuth (third-party sign-in)


## API Endpoints

### Health — `/health`

| Method | Path | Auth | Description  |
| ------ | ---- | ---- | ------------ |
| GET    | `/`  | No   | Health check |

### Auth — `/auth`

| Method | Path        | Auth | Description           |
| ------ | ----------- | ---- | --------------------- |
| GET    | `/me`       | Yes  | Get current user info |
| POST   | `/metadata` | Yes  | Update user metadata  |

SuperTokens also mounts its own routes under `/auth` (sign-up, sign-in, session refresh, OAuth callbacks).

### Notes — `/notes`

| Method | Path            | Auth | Description                              |
| ------ | --------------- | ---- | ---------------------------------------- |
| POST   | `/`             | Yes  | Create a note (auto-embeds for RAG)      |
| GET    | `/`             | Yes  | List all notes (optional `?tag=` filter) |
| PUT    | `/{note_id}`    | Yes  | Update note                              |
| DELETE | `/{note_id}`    | Yes  | Delete note                              |
| POST   | `/suggest-tags` | Yes  | AI-suggest 4 tags for transcription      |
| POST   | `/embed-all`    | Yes  | Backfill embeddings for all notes        |

### Content — `/content`

| Method | Path            | Auth | Description                                         |
| ------ | --------------- | ---- | --------------------------------------------------- |
| GET    | `/types`        | No   | List available content types                        |
| GET    | `/`             | Yes  | List all content (optional `?content_type=` filter) |
| POST   | `/generate`     | Yes  | AI-generate content from selected notes             |
| POST   | `/`             | Yes  | Create content manually                             |
| GET    | `/{note_id}`    | Yes  | Get content for a specific note                     |
| PUT    | `/{content_id}` | Yes  | Update content                                      |
| DELETE | `/{content_id}` | Yes  | Delete content                                      |

### Projects — `/projects`

| Method | Path                  | Auth | Description                        |
| ------ | --------------------- | ---- | ---------------------------------- |
| GET    | `/`                   | Yes  | List all projects with note counts |
| POST   | `/`                   | Yes  | Create project                     |
| GET    | `/{project_id}`       | Yes  | Get project                        |
| PUT    | `/{project_id}`       | Yes  | Update project                     |
| DELETE | `/{project_id}`       | Yes  | Delete project                     |
| GET    | `/{project_id}/notes` | Yes  | List notes in project              |
| POST   | `/{project_id}/notes` | Yes  | Assign notes to project            |
| DELETE | `/{project_id}/notes` | Yes  | Remove notes from project          |

### Speech — `/speech`

| Method | Path          | Auth | Description                       |
| ------ | ------------- | ---- | --------------------------------- |
| POST   | `/transcribe` | Yes  | Upload audio → Whisper STT → text |

### Chat — `/chat`

| Method | Path          | Auth   | Description                               |
| ------ | ------------- | ------ | ----------------------------------------- |
| POST   | `/ws-ticket`  | Yes    | Get short-lived ticket for WebSocket auth |
| WS     | `/ws?ticket=` | Ticket | Streaming AI chat via WebSocket           |

## Getting Started

### Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Tavily (web search)
TAVILY_API_KEY=tvly-...

# PostgreSQL (defaults provided in docker-compose)
POSTGRES_USER=voice_notes_user
POSTGRES_PASSWORD=voice_notes_password
POSTGRES_DB=voice_notes
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Application URLs
VITE_BACKEND_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
```

### Running with Docker Compose

```bash
# Start database and backend
docker compose up -d

# Backend available at http://localhost:8000
# Database at localhost:5432
```

### Running Locally (Development)

```bash
# Install all dependencies
make install

# Start the database
make db-up

# Run backend + frontend together
make dev

# Or run them separately:
make backend   # http://localhost:8000
make frontend  # http://localhost:5173
```

### Available Make Commands

| Command         | Description                                          |
| --------------- | ---------------------------------------------------- |
| `make install`  | Install backend (uv) and frontend (bun) dependencies |
| `make dev`      | Run backend + frontend concurrently                  |
| `make backend`  | Run backend only                                     |
| `make frontend` | Run frontend only                                    |
| `make lint`     | Lint backend (ruff + ty) and frontend (eslint)       |
| `make format`   | Format backend (ruff) and frontend (prettier)        |
| `make db-up`    | Start PostgreSQL via Docker Compose                  |
| `make db-down`  | Stop PostgreSQL                                      |
| `make db-logs`  | View database logs                                   |

## Testing

```bash
cd backend
uv run pytest
```

Tests run against a real PostgreSQL instance (creates a `voice_notes_test` database). Auth is mocked via FastAPI dependency overrides. Coverage includes health, notes CRUD, content CRUD + filtering, projects + note assignment, AI chat (WebSocket), and speech (skipped without API key).

## Project Structure

```
VoiceNotes/
├── docker-compose.yml          # DB + backend services
├── Makefile                    # Dev commands
├── backend/
│   ├── Dockerfile
│   ├── init_db.sql             # pgvector extension setup
│   ├── pyproject.toml          # Python dependencies (uv)
│   ├── pytest.ini
│   ├── src/voice_notes/
│   │   ├── main.py             # FastAPI app + SuperTokens init
│   │   ├── api/
│   │   │   ├── dependencies.py # Auth dependency (verify_session)
│   │   │   └── routers/        # auth, chat, content, health, notes, projects, speech
│   │   ├── config/
│   │   │   ├── settings.py     # Pydantic settings
│   │   │   └── prompts/        # System prompts (chat, content types, tags)
│   │   ├── models/             # DB models + Pydantic schemas per domain
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── content/
│   │   │   ├── embeddings/
│   │   │   ├── notes/
│   │   │   ├── projects/
│   │   │   ├── shared/
│   │   │   └── tags/
│   │   ├── repositories/       # Data access (notes, content, projects)
│   │   ├── services/           # Business logic (chat, content, database, speech, tags, tools, vector_store)
│   │   └── utils/              # Error handlers, ownership checks
│   └── tests/                  # pytest-asyncio tests
├── frontend/
│   ├── firebase.json           # Firebase Hosting config
│   ├── package.json            # Frontend dependencies (bun)
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── router.tsx          # React Router routes
│   │   ├── main.tsx            # SuperTokens init + entry point
│   │   ├── api/                # API client functions
│   │   ├── components/         # UI components (Radix/shadcn-style)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities
│   │   ├── pages/              # Auth + dashboard pages
│   │   └── types/              # TypeScript type definitions
│   └── public/
```

