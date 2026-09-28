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
