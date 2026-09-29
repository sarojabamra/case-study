import logging

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from server.images import build_object_key, prepare_image, read_upload
from server.models import Order, OrderItem, Product, Review, SavedCartItem, User
from server.repositories import services
from server.schemas import ProductCreate, ProductUpdate
from server.storage import ObjectStore, StorageError

logger = logging.getLogger(__name__)


def create_product(
    db: Session, tenant_name: str, current_user: User, product: ProductCreate
):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)
    services.get_category(db, product.category_id)

    db_product = Product(
        name=product.name,
        price=product.price,
        quantity=product.quantity,
        category_id=product.category_id,
        tenant_id=tenant.id,
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return {
        "message": "Product created successfully",
        "product": services.serialize_product(db_product),
    }


def list_products(
    db: Session, tenant_name: str, current_user: User, skip: int = 0, limit: int = 10
):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)

    products = (
        db.query(Product)
        .options(selectinload(Product.category), selectinload(Product.tenant))
        .filter(Product.tenant_id == tenant.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [services.serialize_product(product) for product in products]


def get_studio_summary(db: Session, tenant_name: str, current_user: User):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)
    product_count = db.query(func.count(Product.id)).filter(Product.tenant_id == tenant.id).scalar() or 0
    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.tenant_id == tenant.id, Product.quantity < 5)
        .scalar()
        or 0
    )
    order_count = (
        db.query(func.count(func.distinct(OrderItem.order_id)))
        .join(Order)
        .join(Product)
        .filter(Product.tenant_id == tenant.id)
        .scalar()
        or 0
    )
    sales_filters = (
        Product.tenant_id == tenant.id,
        Order.status != "cancelled",
        OrderItem.is_cancelled.is_(False),
        func.coalesce(OrderItem.return_status, "") != "approved",
    )
    units_sold = (
        db.query(func.coalesce(func.sum(OrderItem.quantity), 0))
        .join(Order)
        .join(Product)
        .filter(*sales_filters)
        .scalar()
        or 0
    )
    revenue = (
        db.query(func.coalesce(func.sum(OrderItem.price * OrderItem.quantity), 0))
        .join(Order)
        .join(Product)
        .filter(*sales_filters)
        .scalar()
        or 0
    )
    return {
        "units_sold": int(units_sold),
        "product_count": product_count,
        "low_stock_count": low_stock_count,
        "order_count": order_count,
        "revenue": float(revenue),
    }


def list_low_stock_products(db: Session, tenant_name: str, current_user: User):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)
    products = (
        db.query(Product)
        .options(selectinload(Product.category), selectinload(Product.tenant))
        .filter(Product.tenant_id == tenant.id, Product.quantity < 5)
        .order_by(Product.quantity, Product.id)
        .all()
    )
    return [services.serialize_product(product) for product in products]


def update_product(
    db: Session,
    tenant_name: str,
    current_user: User,
    product_id: int,
    product: ProductUpdate,
):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)

    db_product = services.get_product_for_tenant(db, tenant.id, product_id)

    update_data = product.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        services.get_category(db, update_data["category_id"])

    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)

    return {
        "message": "Product updated successfully",
        "product": services.serialize_product(db_product),
    }


def delete_product(
    db: Session,
    tenant_name: str,
    current_user: User,
    product_id: int,
    store: ObjectStore,
):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)

    db_product = services.get_product_for_tenant(db, tenant.id, product_id)
    dependencies = []
    if db.query(SavedCartItem.id).filter(SavedCartItem.product_id == product_id).first():
        dependencies.append("customers' saved carts")
    if db.query(OrderItem.id).filter(OrderItem.product_id == product_id).first():
        dependencies.append("order history")
    if db.query(Review.id).filter(Review.product_id == product_id).first():
        dependencies.append("customer reviews")
    if dependencies:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this product because it is in "
            + " and ".join(dependencies)
            + ". Set its stock to 0 to prevent further purchases.",
        )

    image_key = db_product.image_key

    db.delete(db_product)
    db.commit()
    _delete_stored_image(store, image_key, product_id)

    return None


def save_product_image(
    db: Session,
    tenant_name: str,
    current_user: User,
    product_id: int,
    upload: UploadFile,
    store: ObjectStore,
):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)
    product = services.get_product_for_tenant(db, tenant.id, product_id)
    encoded, content_type, ext = prepare_image(read_upload(upload))
    key = build_object_key(tenant.id, product.id, ext)
    previous = product.image_key

    try:
        store.put(key, encoded, content_type)
    except StorageError:
        logger.exception("failed to store product image")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image storage is unavailable",
        )

    product.image_key = key
    product.image_content_type = content_type
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("failed to save product image")
        _delete_stored_image(store, key, product.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the image.",
        )

    db.refresh(product)
    if previous:
        _delete_stored_image(store, previous, product.id)

    return {
        "message": "Product image saved",
        "product": services.serialize_product(product),
    }


def delete_product_image(
    db: Session,
    tenant_name: str,
    current_user: User,
    product_id: int,
    store: ObjectStore,
):
    tenant = services.verify_tenant_user(db, current_user, tenant_name)
    product = services.get_product_for_tenant(db, tenant.id, product_id)
    previous = product.image_key
    if not previous:
        return None

    product.image_key = None
    product.image_content_type = None
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("failed to remove product image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not remove the image.",
        )

    _delete_stored_image(store, previous, product.id)
    return None


def _delete_stored_image(store: ObjectStore, key: str | None, product_id: int) -> None:
    if not key:
        return
    try:
        store.delete(key)
    except StorageError:
        logger.exception("failed to delete stored image for product %s", product_id)
