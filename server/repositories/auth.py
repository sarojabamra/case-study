import logging

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from server.keycloak import (
    create_keycloak_user,
    delete_keycloak_user,
    get_user_token,
    refresh_user_token,
    update_keycloak_user_password,
)

from server.models import User
from server.schemas import ChangePasswordRequest, ProfileUpdate, SignupCreate, UserCreate
from . import services

logger = logging.getLogger(__name__)


async def signup(user: SignupCreate, db):
    existing_user = (
        db.query(User)
        .filter(func.lower(User.username) == user.username.lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    user_role = services.get_role(db, "USER")

    keycloak_user_id = await create_keycloak_user(
        username=user.username,
        password=user.password,
    )

    db_user = User(
        username=user.username,
        full_name=user.full_name,
        keycloak_id=keycloak_user_id,
        role_id=user_role.id,
        tenant_id=None,
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception as exc:
        db.rollback()

        # Delete Keycloak user because local creation failed
        try:
            await delete_keycloak_user(keycloak_user_id)
        except Exception:
            pass

        logger.exception("Local user creation failed after Keycloak signup")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create local user",
        ) from exc

    return {
        "message": "User signed up successfully",
        "user_id": db_user.id,
        "username": db_user.username,
    }


async def login(user, db: Session):
    services.get_user(db, user.username)
    token_data = await get_user_token(user.username, user.password)
    return services.build_token_response(token_data)


async def tenant_login(tenant_name: str, user: UserCreate, db: Session):
    services.get_tenant(db, tenant_name)
    db_user = services.get_user(db, user.username)
    services.verify_tenant_user(db, db_user, tenant_name)

    token_data = await get_user_token(user.username, user.password)
    return services.build_token_response(token_data)


def update_profile(db: Session, user: User, payload: ProfileUpdate):
    user.full_name = payload.full_name
    db.commit()
    db.refresh(user)
    return current_user_profile(user)


def current_user_profile(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.name if user.role is not None else None,
        "tenant_id": user.tenant_id,
        "tenant_name": user.tenant.name if user.tenant is not None else None,
    }


async def refresh(refresh_token: str):
    token_data = await refresh_user_token(refresh_token)
    return services.build_token_response(token_data)


async def change_password(user: User, payload: ChangePasswordRequest):
    if not user.keycloak_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account cannot change its password here",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password",
        )

    try:
        await get_user_token(user.username, payload.current_password)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            ) from exc
        raise

    await update_keycloak_user_password(user.keycloak_id, payload.new_password)

    return {"message": "Password updated successfully"}
