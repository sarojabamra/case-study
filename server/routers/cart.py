from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.repositories import cart as cart_repository
from server.schemas import CartSync
from server.security import get_current_user

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


@router.get("/")
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return cart_repository.get_cart(db, current_user)


@router.put("/")
def sync_cart(
    payload: CartSync,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return cart_repository.replace_cart(db, current_user, payload)
