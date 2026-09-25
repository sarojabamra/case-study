import os

from server.env import load_app_env

load_app_env()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server import models
from server.database import (
    engine,
    ensure_order_shipping_columns,
    ensure_order_status_columns,
    ensure_product_image_columns,
    ensure_user_full_name_column,
)
from server.routers import addresses, admin, auth, brands, cart, orders, products, tenant

app = FastAPI()

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(addresses.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(products.router)
app.include_router(brands.router)
app.include_router(tenant.router)
app.include_router(admin.router)

models.Base.metadata.create_all(engine)
ensure_product_image_columns(engine)
ensure_order_shipping_columns(engine)
ensure_order_status_columns(engine)
ensure_user_full_name_column(engine)
