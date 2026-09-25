from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from server.models import Product, SavedCartItem, User
from server.repositories import services
from server.schemas import CartSync


def _serialize_cart_line(product: Product, quantity: int) -> dict:
    return {
        "product_id": product.id,
        "name": product.name,
        "price": product.price,
        "tenant_name": product.tenant.name if product.tenant is not None else None,
        "quantity": quantity,
        "available": product.quantity,
    }


def get_cart(db: Session, current_user: User):
    lines = (
        db.query(SavedCartItem)
        .filter(SavedCartItem.user_id == current_user.id)
        .options(
            selectinload(SavedCartItem.product).selectinload(Product.tenant),
        )
        .all()
    )
    items = []
    for line in lines:
        if line.product is None or line.product.quantity <= 0:
            continue
        quantity = min(line.quantity, line.product.quantity)
        if quantity <= 0:
            continue
        items.append(_serialize_cart_line(line.product, quantity))
    return {"items": items}


def replace_cart(db: Session, current_user: User, payload: CartSync):
    if not payload.items:
        db.query(SavedCartItem).filter(SavedCartItem.user_id == current_user.id).delete()
        db.commit()
        return {"items": []}

    merged: dict[int, int] = {}
    for line in payload.items:
        if line.quantity <= 0:
            continue
        merged[line.product_id] = merged.get(line.product_id, 0) + line.quantity

    if not merged:
        db.query(SavedCartItem).filter(SavedCartItem.user_id == current_user.id).delete()
        db.commit()
        return {"items": []}

    db.query(SavedCartItem).filter(SavedCartItem.user_id == current_user.id).delete()

    items = []
    for product_id, quantity in merged.items():
        product = services.get_product(db, product_id)
        if product.quantity <= 0:
            continue
        clamped_quantity = min(quantity, product.quantity)
        db.add(
            SavedCartItem(
                user_id=current_user.id,
                product_id=product.id,
                quantity=clamped_quantity,
            )
        )
        items.append(_serialize_cart_line(product, clamped_quantity))

    db.commit()
    return {"items": items}


def clear_cart(db: Session, current_user: User):
    db.query(SavedCartItem).filter(SavedCartItem.user_id == current_user.id).delete()
    db.commit()
    return {"items": []}
