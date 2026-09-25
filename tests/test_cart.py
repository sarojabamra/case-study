def test_authenticated_cart_sync(authenticated_client, seed_catalog):
    put_response = authenticated_client.put(
        "/cart/",
        json={"items": [{"product_id": 1, "quantity": 2}]},
    )

    assert put_response.status_code == 200
    assert put_response.json()["items"][0]["product_id"] == 1
    assert put_response.json()["items"][0]["quantity"] == 2

    get_response = authenticated_client.get("/cart/")

    assert get_response.status_code == 200
    assert len(get_response.json()["items"]) == 1


def test_cart_requires_auth(client):
    response = client.get("/cart/")

    assert response.status_code == 401
