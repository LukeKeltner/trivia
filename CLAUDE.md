# Trivia App — Project Context for Claude Code

## What This App Does
A trivia game where users create accounts, pick a topic, place a coin bet, then answer a question. Correct answers earn coins; wrong answers lose them.

### Core Game Loop
1. User logs in to their account
2. User picks a trivia topic (e.g. science, history, pop culture, geography, etc.)
3. User bets some of their coins on the question (e.g. bet 10 coins)
4. User is shown a question and submits their answer
5. If correct → coins are added (e.g. 100 + 10 = 110)
6. If wrong → coins are deducted (e.g. 100 - 10 = 90)

### Starting State
- Each new user begins with **100 coins**

---

## Tech Stack

### Frontend
- **React** (with Vite) — UI framework
- **Tailwind CSS** — styling

### Backend
- **Python + FastAPI** — REST API server
- Auto-generates API docs at `/docs` (useful during development)

### Database
- **PostgreSQL** via **Supabase** — relational database
- **SQLAlchemy** — Python ORM for database queries

### Auth
- **Supabase Auth** — handles user account creation and login

### Hosting & Services
| Service | Purpose | Notes |
|---|---|---|
| GitHub | Version control | Primary repo host |
| Supabase | Postgres DB + Auth | Free tier |
| Vercel | Frontend hosting | Connects to GitHub, auto-deploys |
| Railway | FastAPI backend hosting | Connects to GitHub, auto-deploys |

---

## Key Data Entities

- **Users** — account info, current coin balance
- **Topics** — categories of trivia questions
- **Questions** — the trivia questions, linked to a topic, with correct answer
- **Answers** (optional) — multiple choice options per question
- **Game Rounds** — records of each bet/question/result per user

---

## Architecture Notes
- Frontend (React) and backend (FastAPI) are **separate services** with a clear API boundary
- Frontend calls the FastAPI backend via REST endpoints
- FastAPI talks to Supabase Postgres via SQLAlchemy
- Supabase Auth handles JWTs; FastAPI should validate tokens on protected routes

---

## Conventions & Preferences
- Backend language is **Python** — do not suggest switching to JavaScript/TypeScript for the backend
- Keep frontend and backend in **separate directories** within the monorepo (e.g. `/frontend` and `/backend`)
- Use **environment variables** for all secrets (Supabase URL, API keys, etc.) — never hardcode them
