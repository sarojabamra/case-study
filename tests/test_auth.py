def test_signup(client, monkeypatch):
    async def fake_create_keycloak_user(username, password, tenant_name=None):
        return "fake-keycloak-id"

    monkeypatch.setattr(
        "server.repositories.auth.create_keycloak_user",
        fake_create_keycloak_user,
    )

    response = client.post(
        "/auth/signup",
        json={
            "full_name": "Test User",
            "username": "testuser",
            "password": "password123",
        },
    )

    assert response.status_code == 201
    assert response.json()["username"] == "testuser"


def test_signup_rejects_full_name_with_numbers(client, monkeypatch):
    async def fake_create_keycloak_user(username, password, tenant_name=None):
        return "fake-keycloak-id"

    monkeypatch.setattr(
        "server.repositories.auth.create_keycloak_user",
        fake_create_keycloak_user,
    )

    response = client.post(
        "/auth/signup",
        json={
            "full_name": "John2 Doe",
            "username": "john2",
            "password": "password123",
        },
    )

    assert response.status_code == 422


def test_change_password(authenticated_client, normal_user, monkeypatch):
    async def fake_get_user_token(username, password):
        if password != "password123":
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )
        return {
            "access_token": "token",
            "refresh_token": "refresh",
            "expires_in": 3600,
            "token_type": "bearer",
        }

    async def fake_update_password(keycloak_user_id, new_password, admin_token=None):
        assert keycloak_user_id == normal_user.keycloak_id
        assert new_password == "newpass99"

    monkeypatch.setattr(
        "server.repositories.auth.get_user_token",
        fake_get_user_token,
    )
    monkeypatch.setattr(
        "server.repositories.auth.update_keycloak_user_password",
        fake_update_password,
    )

    response = authenticated_client.post(
        "/auth/change-password",
        json={
            "current_password": "password123",
            "new_password": "newpass99",
        },
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"


def test_change_password_rejects_wrong_current(authenticated_client, monkeypatch):
    async def fake_get_user_token(username, password):
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    monkeypatch.setattr(
        "server.repositories.auth.get_user_token",
        fake_get_user_token,
    )

    response = authenticated_client.post(
        "/auth/change-password",
        json={
            "current_password": "wrong",
            "new_password": "newpass99",
        },
    )

    assert response.status_code == 400


def test_update_profile(authenticated_client, db, normal_user):
    response = authenticated_client.patch(
        "/auth/me",
        json={"full_name": "Updated Name"},
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"

    db.refresh(normal_user)
    assert normal_user.full_name == "Updated Name"


def test_update_profile_rejects_invalid_name(authenticated_client):
    response = authenticated_client.patch(
        "/auth/me",
        json={"full_name": "Bad1"},
    )

    assert response.status_code == 422


def test_login_success(client, monkeypatch, normal_user):
    async def fake_get_user_token(username, password):
        return {
            "access_token": "token",
            "refresh_token": "refresh",
            "expires_in": 3600,
            "token_type": "bearer",
        }

    monkeypatch.setattr(
        "server.repositories.auth.get_user_token",
        fake_get_user_token,
    )

    response = client.post(
        "/auth/login",
        json={
            "username": normal_user.username,
            "password": "password123",
        },
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "token"


def test_login_missing_user_returns_404(client):
    response = client.post(
        "/auth/login",
        json={
            "username": "missing-user",
            "password": "password123",
        },
    )

    assert response.status_code == 404
