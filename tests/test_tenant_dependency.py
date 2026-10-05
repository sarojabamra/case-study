from unittest.mock import Mock

import pytest

from server.main import app
from server.routers.tenant import router
from server.security import get_current_user, require_tenant


def test_all_tenant_routes_require_tenant():
    for route in router.routes:
        assert any(
            dependency.call is require_tenant
            for dependency in route.dependant.dependencies
        ), route.path


@pytest.mark.parametrize(
    "user_fixture,brand,expected_status,detail",
    [
        ("normal_user", "Nike", 403, "Tenant privileges required"),
        ("admin_user", "Nike", 403, "Tenant privileges required"),
        ("tenant_user", "Samsung", 403, "You do not have access to this tenant"),
        ("tenant_user", "Missing", 404, "Tenant not found"),
        ("tenant_user", "Nike", 200, None),
    ],
)
def test_tenant_dependency_guards_before_repository(
    client, request, monkeypatch, user_fixture, brand, expected_status, detail
):
    user = request.getfixturevalue(user_fixture)
    app.dependency_overrides[get_current_user] = lambda: user
    repository = Mock(return_value=[])
    monkeypatch.setattr("server.repositories.tenant.list_products", repository)

    response = client.get(f"/{brand}/products")

    assert response.status_code == expected_status
    if expected_status == 200:
        repository.assert_called_once()
        assert repository.call_args.args[1].id == user.tenant_id
    else:
        assert response.json()["detail"] == detail
        repository.assert_not_called()
