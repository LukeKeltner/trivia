import hmac
import hashlib
import time
import json
import base64
import os

import httpx
from fastapi import HTTPException, Header
from jose import jwt, JWTError

_jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
QUESTION_TOKEN_SECRET = os.environ.get("QUESTION_TOKEN_SECRET", "dev-question-secret-change-in-prod")

_jwks_cache = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        try:
            resp = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=5)
            _jwks_cache = resp.json()
        except Exception:
            _jwks_cache = {"keys": []}
    return _jwks_cache


def _verify_token(token: str) -> str:
    """Verify a Supabase JWT (HS256 or ES256) and return the user's sub (UUID)."""
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "HS256":
            payload = jwt.decode(
                token,
                _jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            jwks = _get_jwks()
            kid = header.get("kid")
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
            if not key:
                raise JWTError("Signing key not found")
            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256"],
                options={"verify_aud": False},
            )

        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    return _verify_token(authorization.removeprefix("Bearer "))


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
