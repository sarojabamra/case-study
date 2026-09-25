from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.schemas import ChangePasswordRequest, ProfileUpdate, RefreshRequest, SignupCreate, UserCreate
from server.security import get_current_user
from server.repositories import auth

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: SignupCreate, db: Session = Depends(get_db)):
    return await auth.signup(user, db)


@router.post("/login")
async def login(user: UserCreate, db: Session = Depends(get_db)):
    return await auth.login(user, db)


@router.post("/{tenant_name}/login")
async def tenant_login(
    tenant_name: str, user: UserCreate, db: Session = Depends(get_db)
):
    return await auth.tenant_login(tenant_name, user, db)


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return auth.current_user_profile(current_user)


@router.patch("/me")
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return auth.update_profile(db, current_user, payload)


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    return await auth.change_password(current_user, payload)


@router.post("/refresh")
async def refresh(body: RefreshRequest):
    return await auth.refresh(body.refresh_token)
