def test_tenant_can_mark_order_shipped(authenticated_client, authenticated_tenant_client, user_address):
    create = authenticated_client.post(
        "/orders/",
        json={"address_id": user_address.id, "items": [{"product_id": 1, "quantity": 1}]},
    )
    assert create.status_code == 201
    order_id = create.json()["order_id"]

    response = authenticated_tenant_client.patch(
        "/Nike/orders/{}/status".format(order_id),
        json={"status": "shipped"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "shipped"


def test_customer_can_cancel_placed_order(authenticated_client, user_address, db):
    from server.models import Product

    product = db.query(Product).filter(Product.id == 1).first()
    starting_quantity = product.quantity

    create = authenticated_client.post(
        "/orders/",
        json={"address_id": user_address.id, "items": [{"product_id": 1, "quantity": 1}]},
    )
    order_id = create.json()["order_id"]
    db.refresh(product)
    assert product.quantity == starting_quantity - 1

    response = authenticated_client.post(f"/orders/{order_id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    db.refresh(product)
    assert product.quantity == starting_quantity


def test_tenant_cancel_restock_inventory(
    authenticated_client, authenticated_tenant_client, user_address, db
):
    from server.models import Product

    product = db.query(Product).filter(Product.id == 1).first()
    starting_quantity = product.quantity

    create = authenticated_client.post(
        "/orders/",
        json={"address_id": user_address.id, "items": [{"product_id": 1, "quantity": 2}]},
    )
    order_id = create.json()["order_id"]
    db.refresh(product)
    assert product.quantity == starting_quantity - 2

    response = authenticated_tenant_client.patch(
        f"/Nike/orders/{order_id}/status",
        json={"status": "cancelled"},
    )

    assert response.status_code == 200
    db.refresh(product)
    assert product.quantity == starting_quantity


def test_customer_can_request_return_after_delivery(
    authenticated_client, authenticated_tenant_client, user_address
):
    create = authenticated_client.post(
        "/orders/",
        json={"address_id": user_address.id, "items": [{"product_id": 1, "quantity": 1}]},
    )
    order_id = create.json()["order_id"]

    for status in ("shipped", "delivered"):
        patch = authenticated_tenant_client.patch(
            f"/Nike/orders/{order_id}/status",
            json={"status": status},
        )
        assert patch.status_code == 200

    response = authenticated_client.post(f"/orders/{order_id}/return")

    assert response.status_code == 200
    assert response.json()["return_status"] == "requested"
