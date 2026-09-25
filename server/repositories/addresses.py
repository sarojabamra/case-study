from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from server.models import User, UserAddress
from server.schemas import AddressCreate, AddressUpdate


def serialize_address(address: UserAddress) -> dict:
    return {
        "id": address.id,
        "label": address.label,
        "recipient_name": address.recipient_name,
        "line1": address.line1,
        "line2": address.line2,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
        "country": address.country,
        "phone": address.phone,
        "is_default": address.is_default,
    }


def list_addresses(db: Session, current_user: User):
    addresses = (
        db.query(UserAddress)
        .filter(UserAddress.user_id == current_user.id)
        .order_by(UserAddress.is_default.desc(), UserAddress.id.desc())
        .all()
    )
    return {"addresses": [serialize_address(address) for address in addresses]}


def get_address_for_user(db: Session, current_user: User, address_id: int) -> UserAddress:
    address = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == current_user.id)
        .first()
    )
    if address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return address


def _clear_default_addresses(db: Session, user_id: int) -> None:
    db.query(UserAddress).filter(
        UserAddress.user_id == user_id,
        UserAddress.is_default.is_(True),
    ).update({UserAddress.is_default: False})


def create_address(db: Session, current_user: User, payload: AddressCreate):
    has_addresses = (
        db.query(UserAddress.id).filter(UserAddress.user_id == current_user.id).first()
        is not None
    )
    is_default = payload.is_default or not has_addresses

    if is_default:
        _clear_default_addresses(db, current_user.id)

    address = UserAddress(
        user_id=current_user.id,
        label=payload.label,
        recipient_name=payload.recipient_name,
        line1=payload.line1,
        line2=payload.line2,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        phone=payload.phone,
        is_default=is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return serialize_address(address)


def update_address(
    db: Session,
    current_user: User,
    address_id: int,
    payload: AddressUpdate,
):
    address = get_address_for_user(db, current_user, address_id)
    updates = payload.model_dump(exclude_unset=True)

    if updates.get("is_default"):
        _clear_default_addresses(db, current_user.id)

    for field, value in updates.items():
        if field in {"label", "line2", "phone"} and value is not None:
            value = value.strip() or None
        elif isinstance(value, str):
            value = value.strip()
            if field != "label" and not value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} cannot be empty",
                )
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return serialize_address(address)


def delete_address(db: Session, current_user: User, address_id: int):
    address = get_address_for_user(db, current_user, address_id)
    was_default = address.is_default
    db.delete(address)
    db.commit()

    if was_default:
        replacement = (
            db.query(UserAddress)
            .filter(UserAddress.user_id == current_user.id)
            .order_by(UserAddress.id.desc())
            .first()
        )
        if replacement is not None:
            replacement.is_default = True
            db.commit()

    return {"message": "Address deleted"}
