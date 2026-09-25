from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import ProductCreate, ProductUpdate
from ..security import get_current_user
from ..storage import ObjectStore, get_object_store
from server.repositories import tenant, tenant_orders
from server.schemas import OrderReturnDecision, OrderStatusUpdate

router = APIRouter(
    prefix="/{tenant_name}",
    tags=["Tenant"],
)


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(
    tenant_name: str,
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tenant.create_product(db, tenant_name, current_user, product)


@router.get("/products")
def list_products(
    tenant_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10,
):
    return tenant.list_products(db, tenant_name, current_user, skip, limit)


@router.put("/products/{product_id}")
def update_product(
    tenant_name: str,
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tenant.update_product(db, tenant_name, current_user, product_id, product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    tenant_name: str,
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    store: ObjectStore = Depends(get_object_store),
):
    return tenant.delete_product(db, tenant_name, current_user, product_id, store)


@router.post("/products/{product_id}/image")
def upload_product_image(
    tenant_name: str,
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    store: ObjectStore = Depends(get_object_store),
):
    return tenant.save_product_image(
        db, tenant_name, current_user, product_id, file, store
    )


@router.get("/orders")
def list_orders(
    tenant_name: str,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tenant_orders.list_tenant_orders(
        db, tenant_name, current_user, page, limit
    )


@router.patch("/orders/{order_id}/status")
def update_order_status(
    tenant_name: str,
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tenant_orders.update_tenant_order_status(
        db, tenant_name, current_user, order_id, payload
    )


@router.patch("/orders/{order_id}/return")
def update_order_return(
    tenant_name: str,
    order_id: int,
    payload: OrderReturnDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tenant_orders.update_tenant_order_return(
        db, tenant_name, current_user, order_id, payload
    )


@router.delete("/products/{product_id}/image", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(
    tenant_name: str,
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    store: ObjectStore = Depends(get_object_store),
):
    return tenant.delete_product_image(
        db, tenant_name, current_user, product_id, store
    )
