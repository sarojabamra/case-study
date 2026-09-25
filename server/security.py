import logging
import os

import httpx
from jose import jwt, JWTError
from fastapi import (
    Depends,
    Header,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session

from server.database import get_db
from server.env import load_app_env
from server.models import User
from server.repositories import services
from server.studio_session import parse_studio_session

load_app_env()

logger = logging.getLogger(__name__)


KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")


if not KEYCLOAK_URL or not KEYCLOAK_REALM:
    raise RuntimeError("KEYCLOAK_URL and KEYCLOAK_REALM must be configured")


security = HTTPBearer()


KEYCLOAK_CERTS_URL = (
    f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}" "/protocol/openid-connect/certs"
)

KEYCLOAK_ISSUER = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(KEYCLOAK_CERTS_URL)

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not retrieve Keycloak public keys",
            )

        jwks = response.json()
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a key ID",
            )

        key = next((key for key in jwks["keys"] if key["kid"] == kid), None)
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token signing key not found",
            )

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=KEYCLOAK_ISSUER,
            options={"verify_aud": False},
        )

    except JWTError:
        logger.info("Token validation failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

    keycloak_id = payload.get("sub")
    if not keycloak_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a user id",
        )

    user = db.query(User).filter(User.keycloak_id == keycloak_id).first()
    if not user:
        username = payload.get("preferred_username")
        if username:
            user = db.query(User).filter(User.username == username).first()
            if user is not None:
                user.keycloak_id = keycloak_id
                db.commit()
                db.refresh(user)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in local database",
        )

    return user


def get_tenant_studio_user(
    tenant_name: str,
    studio_session: str | None = Header(default=None, alias="X-Studio-Session"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    tenant = services.verify_tenant_user(db, current_user, tenant_name)
    if not studio_session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sign in through your brand login to use the studio",
        )
    try:
        payload = parse_studio_session(studio_session)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sign in through your brand login to use the studio",
        )
    user_id = payload.get("sub")
    session_tenant_id = payload.get("tenant_id")
    if user_id is None or session_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sign in through your brand login to use the studio",
        )
    if int(user_id) != current_user.id or int(session_tenant_id) != tenant.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sign in through your brand login to use the studio",
        )
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role is None or current_user.role.name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    return current_user
