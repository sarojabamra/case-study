from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tenant
from ..schemas import ProductCreate, ProductUpdate
from ..security import require_tenant
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
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant.create_product(db, current_tenant, product)


@router.get("/products")
def list_products(
    tenant_name: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
    skip: int = 0,
    limit: int = 10,
):
    return tenant.list_products(db, current_tenant, skip, limit)


@router.get("/studio/summary")
def get_studio_summary(
    tenant_name: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant.get_studio_summary(db, current_tenant)


@router.get("/products/low-stock")
def list_low_stock_products(
    tenant_name: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant.list_low_stock_products(db, current_tenant)


@router.put("/products/{product_id}")
def update_product(
    tenant_name: str,
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant.update_product(db, current_tenant, product_id, product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    tenant_name: str,
    product_id: int,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
    store: ObjectStore = Depends(get_object_store),
):
    return tenant.delete_product(db, current_tenant, product_id, store)


@router.post("/products/{product_id}/image")
def upload_product_image(
    tenant_name: str,
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
    store: ObjectStore = Depends(get_object_store),
):
    return tenant.save_product_image(
        db, current_tenant, product_id, file, store
    )


@router.get("/orders")
def list_orders(
    tenant_name: str,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant_orders.list_tenant_orders(
        db, current_tenant, page, limit
    )


@router.patch("/orders/{order_id}/status")
def update_order_status(
    tenant_name: str,
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant_orders.update_tenant_order_status(
        db, current_tenant, order_id, payload
    )


@router.post("/orders/{order_id}/items/{item_id}/cancel")
def cancel_order_item(
    tenant_name: str,
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant_orders.cancel_tenant_order_item(
        db, current_tenant, order_id, item_id
    )


@router.patch("/orders/{order_id}/items/{item_id}/return")
def update_order_item_return(
    tenant_name: str,
    order_id: int,
    item_id: int,
    payload: OrderReturnDecision,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
):
    return tenant_orders.update_tenant_order_item_return(
        db, current_tenant, order_id, item_id, payload
    )


@router.delete("/products/{product_id}/image", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(
    tenant_name: str,
    product_id: int,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(require_tenant),
    store: ObjectStore = Depends(get_object_store),
):
    return tenant.delete_product_image(
        db, current_tenant, product_id, store
    )
