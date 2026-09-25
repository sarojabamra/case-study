from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from server.models import Order, OrderItem, Product

ORDER_STATUS_PLACED = "placed"
ORDER_STATUS_SHIPPED = "shipped"
ORDER_STATUS_DELIVERED = "delivered"
ORDER_STATUS_CANCELLED = "cancelled"

RETURN_STATUS_REQUESTED = "requested"
RETURN_STATUS_APPROVED = "approved"
RETURN_STATUS_REJECTED = "rejected"

TENANT_STATUS_TRANSITIONS = {
    ORDER_STATUS_PLACED: {ORDER_STATUS_SHIPPED, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_SHIPPED: {ORDER_STATUS_DELIVERED, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_DELIVERED: set(),
    ORDER_STATUS_CANCELLED: set(),
}

CUSTOMER_CANCELLABLE = {ORDER_STATUS_PLACED, ORDER_STATUS_SHIPPED}


def validate_order_status(value: str) -> str:
    allowed = {
        ORDER_STATUS_PLACED,
        ORDER_STATUS_SHIPPED,
        ORDER_STATUS_DELIVERED,
        ORDER_STATUS_CANCELLED,
    }
    if value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status",
        )
    return value


def restock_order_items(db: Session, order: Order) -> None:
    if (order.status or ORDER_STATUS_PLACED) == ORDER_STATUS_CANCELLED:
        return

    line_items = (
        db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        if not order.items
        else list(order.items)
    )
    for item in line_items:
        product = db.get(Product, item.product_id)
        if product is not None:
            product.quantity += item.quantity
    db.flush()


def apply_tenant_status_update(db: Session, order: Order, next_status: str) -> None:
    current_status = order.status or ORDER_STATUS_PLACED
    next_status = validate_order_status(next_status)
    allowed = TENANT_STATUS_TRANSITIONS.get(current_status, set())
    if next_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot change status from {current_status} to {next_status}",
        )
    if next_status == ORDER_STATUS_CANCELLED and current_status != ORDER_STATUS_CANCELLED:
        restock_order_items(db, order)
    order.status = next_status


def cancel_order_for_customer(db: Session, order: Order) -> None:
    current_status = order.status or ORDER_STATUS_PLACED
    if current_status not in CUSTOMER_CANCELLABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order can no longer be cancelled",
        )
    restock_order_items(db, order)
    order.status = ORDER_STATUS_CANCELLED


def request_return_for_customer(db: Session, order: Order) -> None:
    current_status = order.status or ORDER_STATUS_PLACED
    if current_status != ORDER_STATUS_DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Returns are only available for delivered orders",
        )
    if order.return_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A return has already been requested for this order",
        )
    order.return_status = RETURN_STATUS_REQUESTED


def update_return_status_for_tenant(db: Session, order: Order, return_status: str) -> None:
    current_status = order.status or ORDER_STATUS_PLACED
    if current_status != ORDER_STATUS_DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Returns can only be managed for delivered orders",
        )
    if order.return_status != RETURN_STATUS_REQUESTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No return request is pending for this order",
        )
    if return_status not in {RETURN_STATUS_APPROVED, RETURN_STATUS_REJECTED}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid return status",
        )
    if return_status == RETURN_STATUS_APPROVED:
        restock_order_items(db, order)
    order.return_status = return_status
