from sqlalchemy import func

from server.env import load_app_env

load_app_env()

from server import models
from server.database import SessionLocal, engine, ensure_order_item_return_status_column, ensure_product_image_columns
from server.models import Category, Product, Role, Tenant, User

models.Base.metadata.create_all(engine)
ensure_product_image_columns(engine)
ensure_order_item_return_status_column(engine)

db = SessionLocal()

for role_name in ("ADMIN", "TENANT", "USER"):
    if db.query(Role).filter(Role.name == role_name).first() is None:
        db.add(Role(name=role_name))
db.flush()

admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
admin_user = db.query(User).filter(User.username == "admin").one_or_none()
if admin_user is not None and admin_role is not None:
    admin_user.role_id = admin_role.id


def get_or_create_category(name: str) -> Category:
    category = (
        db.query(Category)
        .filter(func.lower(Category.name) == name.lower())
        .one_or_none()
    )
    if category is None:
        category = Category(name=name)
        db.add(category)
        db.flush()
    return category


def get_or_create_tenant(name: str) -> Tenant:
    tenant = (
        db.query(Tenant).filter(func.lower(Tenant.name) == name.lower()).one_or_none()
    )
    if tenant is None:
        tenant = Tenant(name=name)
        db.add(tenant)
        db.flush()
    return tenant


def get_or_create_product(
    name: str,
    price: float,
    quantity: int,
    category: Category,
    tenant: Tenant,
) -> Product:
    product = (
        db.query(Product)
        .filter(
            Product.tenant_id == tenant.id,
            func.lower(Product.name) == name.lower(),
        )
        .one_or_none()
    )
    if product is None:
        product = Product(
            name=name,
            price=price,
            quantity=quantity,
            category_id=category.id,
            tenant_id=tenant.id,
        )
        db.add(product)
        db.flush()
    return product


catalogue = [
    ("Apple", "Electronics", "iPhone 15", 699, 8),
    ("Apple", "Electronics", "MacBook Air 13-inch", 999, 3),
    ("Apple", "Electronics", "iPad", 349, 6),
    ("Apple", "Electronics", "AirPods Pro", 249, 9),
    ("Apple", "Accessories", "iPhone Silicone Case", 49, 12),
    ("Samsung", "Electronics", "Galaxy S24", 799, 5),
    ("Samsung", "Electronics", "Galaxy Tab S9", 699, 2),
    ("Samsung", "Electronics", "Galaxy Buds FE", 99, 15),
    ("Samsung", "Electronics", "Galaxy Watch6", 249, 0),
    ("Samsung", "Home Appliances", "Samsung Microwave Oven", 149, 4),
    ("Sony", "Electronics", "PlayStation 5", 499, 1),
    ("Sony", "Accessories", "DualSense Wireless Controller", 69, 14),
    ("Sony", "Electronics", "WH-1000XM5 Headphones", 349, 7),
    ("Sony", "Electronics", "BRAVIA 55-inch TV", 799, 0),
    ("Nike", "Footwear", "Air Force 1 '07", 115, 20),
    ("Nike", "Footwear", "Air Max 90", 130, 6),
    ("Nike", "Clothing", "Sportswear Club Fleece Hoodie", 65, 11),
    ("Nike", "Accessories", "Heritage Backpack", 37, 8),
    ("Adidas", "Footwear", "Stan Smith", 100, 10),
    ("Adidas", "Footwear", "Samba OG", 100, 1),
    ("Adidas", "Clothing", "Tiro Track Pants", 50, 16),
    ("Adidas", "Accessories", "Adicolor Backpack", 35, 9),
    ("IKEA", "Furniture", "BILLY Bookcase", 89, 5),
    ("IKEA", "Furniture", "LACK Side Table", 15, 18),
    ("IKEA", "Furniture", "POANG Armchair", 129, 3),
    ("IKEA", "Home & Kitchen", "FARGKLAR Dinnerware Set", 40, 0),
    ("IKEA", "Home & Kitchen", "RANARP Work Lamp", 55, 7),
]

categories = {
    name: get_or_create_category(name)
    for name in dict.fromkeys(row[1] for row in catalogue)
}
brands = {
    name: get_or_create_tenant(name)
    for name in dict.fromkeys(row[0] for row in catalogue)
}

for brand, category, name, price, quantity in catalogue:
    get_or_create_product(name, price, quantity, categories[category], brands[brand])

db.commit()

print(
    "Seed complete:",
    f"{db.query(Tenant).count()} brands,",
    f"{db.query(Category).count()} categories,",
    f"{db.query(Product).count()} products",
)

db.close()
