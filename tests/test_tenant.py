def test_tenant_can_create_product(authenticated_tenant_client):
    response = authenticated_tenant_client.post(
        "/Nike/products",
        json={
            "name": "Air Max",
            "price": 12000,
            "quantity": 20,
            "category_id": 1,
        },
    )

    assert response.status_code == 201
    assert response.json()["product"]["name"] == "Air Max"


def test_tenant_can_list_own_products(authenticated_tenant_client):
    authenticated_tenant_client.post(
        "/Nike/products",
        json={
            "name": "Air Max",
            "price": 12000,
            "quantity": 20,
            "category_id": 1,
        },
    )

    response = authenticated_tenant_client.get("/Nike/products")

    assert response.status_code == 200
    assert any(product["name"] == "Air Max" for product in response.json())


def test_tenant_can_update_own_product(authenticated_tenant_client):
    create_response = authenticated_tenant_client.post(
        "/Nike/products",
        json={
            "name": "Air Max",
            "price": 12000,
            "quantity": 20,
            "category_id": 1,
        },
    )
    product_id = create_response.json()["product"]["id"]

    response = authenticated_tenant_client.put(
        f"/Nike/products/{product_id}",
        json={"price": 15000},
    )

    assert response.status_code == 200
    assert response.json()["product"]["price"] == 15000


def test_tenant_can_delete_own_product(authenticated_tenant_client):
    create_response = authenticated_tenant_client.post(
        "/Nike/products",
        json={
            "name": "Jordan",
            "price": 20000,
            "quantity": 5,
            "category_id": 1,
        },
    )
    product_id = create_response.json()["product"]["id"]

    response = authenticated_tenant_client.delete(f"/Nike/products/{product_id}")

    assert response.status_code == 204


def test_tenant_cannot_access_another_tenant(authenticated_tenant_client):
    response = authenticated_tenant_client.post(
        "/Samsung/products",
        json={
            "name": "Galaxy",
            "price": 50000,
            "quantity": 10,
            "category_id": 1,
        },
    )

    assert response.status_code == 403


def test_tenant_product_not_found(authenticated_tenant_client):
    response = authenticated_tenant_client.put(
        "/Nike/products/999",
        json={"price": 100},
    )

    assert response.status_code == 404


def test_low_stock_includes_only_brand_products_below_five(
    authenticated_tenant_client, db, seed_catalog
):
    from server.models import Product

    for quantity in (0, 1, 4, 5):
        db.add(Product(name=f'Stock {quantity}', price=10, quantity=quantity,
                       category_id=seed_catalog['category'].id,
                       tenant_id=seed_catalog['tenant'].id))
    db.add(Product(name='Other brand low stock', price=10, quantity=1,
                   category_id=seed_catalog['category'].id,
                   tenant_id=seed_catalog['other_tenant'].id))
    db.commit()

    response = authenticated_tenant_client.get('/Nike/products/low-stock')
    assert response.status_code == 200
    assert [p['quantity'] for p in response.json()] == [0, 1, 4]
    assert all(p['tenant_name'] == 'Nike' for p in response.json())
    product_id = response.json()[-1]['id']
    authenticated_tenant_client.put(f'/Nike/products/{product_id}', json={'quantity': 5})
    assert len(authenticated_tenant_client.get('/Nike/products/low-stock').json()) == 2


def test_low_stock_cannot_access_other_brand(authenticated_tenant_client):
    assert authenticated_tenant_client.get('/Samsung/products/low-stock').status_code == 403


def test_studio_summary_is_scoped_and_excludes_cancelled_or_returned_revenue(
    authenticated_tenant_client, db, seed_catalog, normal_user
):
    from server.models import Order, OrderItem, Product

    low_stock_product = Product(
        name="Low stock product",
        price=20,
        quantity=4,
        category_id=seed_catalog["category"].id,
        tenant_id=seed_catalog["tenant"].id,
    )
    db.add(low_stock_product)
    db.commit()

    delivered = Order(user_id=normal_user.id, total_quantity=2, total_amount=50, status="delivered")
    cancelled = Order(user_id=normal_user.id, total_quantity=1, total_amount=50, status="cancelled")
    returned = Order(user_id=normal_user.id, total_quantity=1, total_amount=30, status="delivered", return_status="approved")
    db.add_all([delivered, cancelled, returned])
    db.flush()
    db.add_all([
        OrderItem(order_id=delivered.id, product_id=low_stock_product.id, quantity=2, price=25),
        OrderItem(order_id=cancelled.id, product_id=low_stock_product.id, quantity=1, price=50),
        OrderItem(order_id=returned.id, product_id=low_stock_product.id, quantity=1, price=30),
    ])
    db.commit()

    response = authenticated_tenant_client.get("/Nike/studio/summary")

    assert response.status_code == 200
    assert response.json() == {
        "units_sold": 2,
        "product_count": 3,
        "low_stock_count": 1,
        "order_count": 3,
        "revenue": 50.0,
    }
    assert authenticated_tenant_client.get("/Samsung/studio/summary").status_code == 403
