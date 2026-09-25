import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

STUDIO_SESSION_SECRET = os.getenv("STUDIO_SESSION_SECRET", "dev-studio-session-change-me")
STUDIO_SESSION_ALGORITHM = "HS256"
STUDIO_SESSION_TTL_DAYS = 7


def issue_studio_session(user_id: int, tenant_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=STUDIO_SESSION_TTL_DAYS)
    payload = {
        "sub": str(user_id),
        "tenant_id": tenant_id,
        "exp": expires_at,
    }
    return jwt.encode(payload, STUDIO_SESSION_SECRET, algorithm=STUDIO_SESSION_ALGORITHM)


def parse_studio_session(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            STUDIO_SESSION_SECRET,
            algorithms=[STUDIO_SESSION_ALGORITHM],
        )
    except JWTError:
        raise ValueError("Invalid studio session")
