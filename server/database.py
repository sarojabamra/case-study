from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./ecommerce.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_product_image_columns(bind=engine) -> None:
    """Add image columns when create_all cannot alter an existing SQLite file."""
    if bind.dialect.name != "sqlite":
        return
    with bind.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(products)").fetchall()
        if not rows:
            return
        names = {row[1] for row in rows}
        if "image_key" not in names:
            conn.exec_driver_sql("ALTER TABLE products ADD COLUMN image_key VARCHAR")
            conn.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_products_image_key ON products (image_key)"
            )
        if "image_content_type" not in names:
            conn.exec_driver_sql(
                "ALTER TABLE products ADD COLUMN image_content_type VARCHAR"
            )


def ensure_order_shipping_columns(bind=engine) -> None:
    if bind.dialect.name != "sqlite":
        return
    with bind.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(orders)").fetchall()
        if not rows:
            return
        names = {row[1] for row in rows}
        columns = {
            "address_id": "INTEGER",
            "shipping_label": "VARCHAR",
            "shipping_recipient_name": "VARCHAR",
            "shipping_line1": "VARCHAR",
            "shipping_line2": "VARCHAR",
            "shipping_city": "VARCHAR",
            "shipping_state": "VARCHAR",
            "shipping_postal_code": "VARCHAR",
            "shipping_country": "VARCHAR",
            "shipping_phone": "VARCHAR",
        }
        for column_name, column_type in columns.items():
            if column_name not in names:
                conn.exec_driver_sql(
                    f"ALTER TABLE orders ADD COLUMN {column_name} {column_type}"
                )


def ensure_order_status_columns(bind=engine) -> None:
    if bind.dialect.name != "sqlite":
        return
    with bind.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(orders)").fetchall()
        if not rows:
            return
        names = {row[1] for row in rows}
        if "status" not in names:
            conn.exec_driver_sql(
                "ALTER TABLE orders ADD COLUMN status VARCHAR NOT NULL DEFAULT 'placed'"
            )
        if "return_status" not in names:
            conn.exec_driver_sql("ALTER TABLE orders ADD COLUMN return_status VARCHAR")


def ensure_user_full_name_column(bind=engine) -> None:
    if bind.dialect.name != "sqlite":
        return
    with bind.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
        if not rows:
            return
        names = {row[1] for row in rows}
        if "full_name" not in names:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN full_name VARCHAR")
