from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from server.models import Order, OrderItem, User
from server.schemas import OrderCreate


from server.repositories import addresses, order_status, services


def create_order(db: Session, current_user: User, order: OrderCreate):
    shipping_address = addresses.get_address_for_user(
        db,
        current_user,
        order.address_id,
    )

    if not order.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item",
        )

    total_quantity = 0
    total_amount = 0
    order_items = []

    for item in order.items:
        product = services.get_product(db, item.product_id)

        if item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order quantity must be greater than 0",
            )

        if item.quantity > product.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient quantity for product "
                    f"'{product.name}'. "
                    f"Available quantity: {product.quantity}"
                ),
            )

        order_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price=product.price,
        )

        order_items.append(order_item)
        total_quantity += item.quantity
        total_amount += product.price * item.quantity
        product.quantity -= item.quantity

    db_order = Order(
        user_id=current_user.id,
        total_quantity=total_quantity,
        total_amount=total_amount,
        address_id=shipping_address.id,
        shipping_label=shipping_address.label,
        shipping_recipient_name=shipping_address.recipient_name,
        shipping_line1=shipping_address.line1,
        shipping_line2=shipping_address.line2,
        shipping_city=shipping_address.city,
        shipping_state=shipping_address.state,
        shipping_postal_code=shipping_address.postal_code,
        shipping_country=shipping_address.country,
        shipping_phone=shipping_address.phone,
        status=order_status.ORDER_STATUS_PLACED,
    )

    db.add(db_order)
    db.flush()

    for order_item in order_items:
        order_item.order_id = db_order.id
        db.add(order_item)

    db.commit()
    db.refresh(db_order)

    from server.repositories import cart as cart_repository

    cart_repository.clear_cart(db, current_user)

    return {
        "message": "Order created successfully",
        "order_id": db_order.id,
        "total_quantity": db_order.total_quantity,
        "total_amount": db_order.total_amount,
        "status": db_order.status,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "quantity": item.quantity,
                "price": item.price,
            }
            for item in order_items
        ],
    }


def list_orders(db: Session, current_user: User, page: int = 1, limit: int = 10):
    services.validate_pagination(page, limit)

    query = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
    )

    total = query.count()
    offset = (page - 1) * limit
    orders = (
        query.options(selectinload(Order.items).selectinload(OrderItem.product))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "orders": [services.serialize_order(order) for order in orders],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit,
    }


def get_order(db: Session, current_user: User, order_id: int):
    order = services.get_order_for_user(db, current_user.id, order_id)
    return services.serialize_order(order)


def cancel_order(db: Session, current_user: User, order_id: int):
    order = services.get_order_for_user(db, current_user.id, order_id)
    order_status.cancel_order_for_customer(db, order)
    db.commit()
    db.refresh(order)
    return services.serialize_order(order)


def request_order_return(db: Session, current_user: User, order_id: int):
    order = services.get_order_for_user(db, current_user.id, order_id)
    order_status.request_return_for_customer(db, order)
    db.commit()
    db.refresh(order)
    return services.serialize_order(order)
