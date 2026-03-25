import hmac
import hashlib
import time
import json
import base64
import os

from fastapi import HTTPException, Header
from jose import jwt, JWTError

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
QUESTION_TOKEN_SECRET = os.environ.get("QUESTION_TOKEN_SECRET", "dev-question-secret-change-in-prod")


def get_current_user(authorization: str = Header(None)) -> str:
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def make_question_token(question_id: int) -> str:
    issued_at = time.time()
    data = f"{question_id}:{issued_at}"
    sig = hmac.new(QUESTION_TOKEN_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()
    payload = {"q": question_id, "t": issued_at, "sig": sig}
    return base64.b64encode(json.dumps(payload).encode()).decode()


def verify_question_token(token: str, question_id: int) -> float:
    """Verifies the token and returns elapsed seconds since question was issued."""
    try:
        payload = json.loads(base64.b64decode(token).decode())
        data = f"{payload['q']}:{payload['t']}"
        expected = hmac.new(QUESTION_TOKEN_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, payload["sig"]):
            raise HTTPException(status_code=400, detail="Invalid question token")
        if payload["q"] != question_id:
            raise HTTPException(status_code=400, detail="Token question mismatch")
        return time.time() - payload["t"]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid question token")
