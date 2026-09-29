def _delivered_order(db, user_id, product_id):
    from server.models import Order, OrderItem

    order = Order(user_id=user_id, total_quantity=1, total_amount=999, status="delivered")
    db.add(order)
    db.flush()
    db.add(OrderItem(order_id=order.id, product_id=product_id, quantity=1, price=999))
    db.commit()


def test_delivered_customer_can_create_and_read_one_review(authenticated_client, db, seed_catalog, normal_user):
    from server.models import Product

    product = db.query(Product).filter(Product.name == "iPhone 14").first()
    _delivered_order(db, normal_user.id, product.id)

    response = authenticated_client.post(
        f"/products/{product.id}/reviews", json={"rating": 5, "comment": "Excellent"}
    )

    assert response.status_code == 201
    assert response.json()["reviewer_name"] == "testuser"
    reviews = authenticated_client.get(f"/products/{product.id}/reviews")
    assert reviews.status_code == 200
    assert reviews.json()["average_rating"] == 5.0
    assert reviews.json()["rating_count"] == 1
    assert reviews.json()["reviews"][0]["comment"] == "Excellent"
    catalogue = authenticated_client.get("/products/")
    product_card = next(item for item in catalogue.json()["products"] if item["id"] == product.id)
    assert product_card["average_rating"] == 5.0
    assert product_card["rating_count"] == 1
    authenticated_client.post(f"/products/{product.id}/favourite")
    favourite = authenticated_client.get("/products/favourites").json()[0]
    assert favourite["average_rating"] == 5.0
    assert favourite["rating_count"] == 1
    assert authenticated_client.post(
        f"/products/{product.id}/reviews", json={"rating": 4}
    ).status_code == 409


def test_review_requires_delivered_purchase(authenticated_client, db, seed_catalog):
    from server.models import Product

    product = db.query(Product).filter(Product.name == "iPhone 14").first()
    response = authenticated_client.post(f"/products/{product.id}/reviews", json={"rating": 4})

    assert response.status_code == 403
    assert response.json()["detail"] == "You can review a product after it has been delivered"
