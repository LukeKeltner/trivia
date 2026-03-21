from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import topics, questions, game

load_dotenv()

app = FastAPI(title="Trivia API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "https://trivia-delta-eight.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topics.router)
app.include_router(questions.router)
app.include_router(game.router)


@app.get("/")
def root():
    return {"message": "Trivia API is running"}
