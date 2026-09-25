from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.repositories import addresses
from server.schemas import AddressCreate, AddressUpdate
from server.security import get_current_user

router = APIRouter(
    prefix="/addresses",
    tags=["Addresses"],
)


@router.get("/")
def list_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return addresses.list_addresses(db, current_user)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_address(
    payload: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return addresses.create_address(db, current_user, payload)


@router.put("/{address_id}")
def update_address(
    address_id: int,
    payload: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return addresses.update_address(db, current_user, address_id, payload)


@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return addresses.delete_address(db, current_user, address_id)
