from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from server.models import Order, OrderItem, Product, Tenant
from server.repositories import order_status, services
from server.schemas import OrderReturnDecision, OrderStatusUpdate


def _order_has_tenant_products(order: Order, tenant_id: int) -> bool:
    return any(
        item.product is not None and item.product.tenant_id == tenant_id
        for item in order.items
    )


def _get_tenant_order(db: Session, tenant: Tenant, order_id: int):
    order = (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if order is None or not _order_has_tenant_products(order, tenant.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return tenant, order


def list_tenant_orders(
    db: Session,
    tenant: Tenant,
    page: int = 1,
    limit: int = 10,
):
    services.validate_pagination(page, limit)

    matching_order_ids = [
        row[0]
        for row in (
            db.query(Order.id)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .filter(Product.tenant_id == tenant.id)
            .distinct()
            .all()
        )
    ]

    if not matching_order_ids:
        return {
            "orders": [],
            "page": page,
            "limit": limit,
            "total": 0,
            "total_pages": 0,
        }

    query = (
        db.query(Order)
        .filter(Order.id.in_(matching_order_ids))
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
        "orders": [
            services.serialize_order(order, tenant_id=tenant.id)
            for order in orders
        ],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit,
    }


def update_tenant_order_status(
    db: Session,
    tenant: Tenant,
    order_id: int,
    payload: OrderStatusUpdate,
):
    _, order = _get_tenant_order(db, tenant, order_id)
    order_status.apply_tenant_status_update(db, order, payload.status)
    db.commit()
    db.refresh(order)
    return services.serialize_order(order)


def update_tenant_order_item_return(
    db: Session,
    tenant: Tenant,
    order_id: int,
    item_id: int,
    payload: OrderReturnDecision,
):
    tenant, order = _get_tenant_order(db, tenant, order_id)
    item = next(
        (item for item in order.items if item.id == item_id and item.product and item.product.tenant_id == tenant.id),
        None,
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    order_status.update_return_status_for_tenant(db, order, item, payload.return_status)
    db.commit()
    db.refresh(order)
    return services.serialize_order(order, tenant_id=tenant.id)


def cancel_tenant_order_item(
    db: Session, tenant: Tenant, order_id: int, item_id: int
):
    tenant, order = _get_tenant_order(db, tenant, order_id)
    item = next(
        (item for item in order.items if item.id == item_id and item.product and item.product.tenant_id == tenant.id),
        None,
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    order_status.cancel_order_item(db, order, item)
    db.commit()
    db.refresh(order)
    return services.serialize_order(order, tenant_id=tenant.id)
