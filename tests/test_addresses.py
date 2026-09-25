def test_list_addresses_requires_auth(client):
    response = client.get("/addresses/")

    assert response.status_code == 401


def test_user_can_create_and_list_addresses(authenticated_client):
    create_response = authenticated_client.post(
        "/addresses/",
        json={
            "recipient_name": "Jane Doe",
            "line1": "42 Park Avenue",
            "city": "Delhi",
            "state": "Delhi",
            "postal_code": "110001",
            "country": "IN",
            "label": "Office",
        },
    )

    assert create_response.status_code == 201
    assert create_response.json()["recipient_name"] == "Jane Doe"
    assert create_response.json()["is_default"] is False

    list_response = authenticated_client.get("/addresses/")

    assert list_response.status_code == 200
    assert len(list_response.json()["addresses"]) == 2


def test_user_cannot_access_other_users_address(authenticated_client, db, role_factory):
    from server.models import User, UserAddress

    other_role = role_factory("USER")
    other_user = User(username="other", keycloak_id="other-id", role_id=other_role.id)
    db.add(other_user)
    db.commit()
    db.refresh(other_user)

    foreign_address = UserAddress(
        user_id=other_user.id,
        recipient_name="Other",
        line1="Elsewhere",
        city="Pune",
        state="Maharashtra",
        postal_code="411001",
        country="IN",
        is_default=True,
    )
    db.add(foreign_address)
    db.commit()
    db.refresh(foreign_address)

    response = authenticated_client.put(
        f"/addresses/{foreign_address.id}",
        json={"city": "Hacked"},
    )

    assert response.status_code == 404


def test_address_rejects_city_with_numbers(authenticated_client):
    response = authenticated_client.post(
        "/addresses/",
        json={
            "recipient_name": "Jane Doe",
            "line1": "42 Park Avenue",
            "city": "Delhi123",
            "state": "Delhi",
            "postal_code": "110001",
            "country": "IN",
        },
    )

    assert response.status_code == 422


def test_address_rejects_invalid_pin_code(authenticated_client):
    response = authenticated_client.post(
        "/addresses/",
        json={
            "recipient_name": "Jane Doe",
            "line1": "42 Park Avenue",
            "city": "Delhi",
            "state": "Delhi",
            "postal_code": "12AB",
            "country": "IN",
        },
    )

    assert response.status_code == 422


def test_create_order_requires_valid_address(authenticated_client, user_address):
    response = authenticated_client.post(
        "/orders/",
        json={
            "address_id": user_address.id,
            "items": [{"product_id": 1, "quantity": 1}],
        },
    )

    assert response.status_code == 201
    order = authenticated_client.get(f"/orders/{response.json()['order_id']}").json()
    assert order["shipping_address"]["line1"] == "123 Main Street"
