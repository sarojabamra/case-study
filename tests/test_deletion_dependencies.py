import pytest

from server.models import Order, OrderItem, Product, SavedCartItem, Tenant


@pytest.mark.parametrize('users,products', [(True, False), (False, True), (True, True)])
def test_brand_dependencies_prevent_deletion(
    authenticated_admin_client, db, tenant_user, seed_catalog, users, products
):
    tenant = seed_catalog['tenant']
    tenant_id = tenant.id
    if not users:
        db.delete(tenant_user)
    if not products:
        db.query(Product).filter(Product.tenant_id == tenant_id).delete()
    db.commit()

    response = authenticated_admin_client.delete('/admin/tenants/Nike')

    assert response.status_code == 409
    detail = response.json()['detail']
    assert ('tenant users' in detail) == users
    assert ('products' in detail) == products
    db.expire_all()
    assert db.get(Tenant, tenant_id) is not None
    if users:
        assert tenant_user.tenant_id == tenant_id
    if products:
        assert db.query(Product).filter(Product.tenant_id == tenant_id).count() == 2


@pytest.mark.parametrize('cart,order', [(True, False), (False, True), (True, True)])
def test_product_dependencies_prevent_deletion(
    authenticated_tenant_client, db, normal_user, cart, order
):
    product = db.query(Product).first()
    product_id = product.id
    product.image_key = 'protected-image'
    product.image_content_type = 'image/png'
    store = authenticated_tenant_client.app.state.image_store
    store.put(product.image_key, b'image bytes', 'image/png')
    if cart:
        db.add(SavedCartItem(user_id=normal_user.id, product_id=product_id, quantity=1))
    if order:
        purchase = Order(user_id=normal_user.id, status='delivered')
        db.add(purchase)
        db.flush()
        db.add(OrderItem(order_id=purchase.id, product_id=product_id, quantity=1, price=10))
    db.commit()

    response = authenticated_tenant_client.delete(f'/Nike/products/{product_id}')

    assert response.status_code == 409
    detail = response.json()['detail']
    assert ('saved carts' in detail) == cart
    assert ('order history' in detail) == order
    db.expire_all()
    assert db.get(Product, product_id) is not None
    assert store.get('protected-image')[0] == b'image bytes'
    assert db.query(SavedCartItem).filter_by(product_id=product_id).count() == int(cart)
    assert db.query(OrderItem).filter_by(product_id=product_id).count() == int(order)


def test_product_can_be_deleted_after_cart_reference_removed(
    authenticated_tenant_client, db, normal_user
):
    product_id = db.query(Product).first().id
    item = SavedCartItem(user_id=normal_user.id, product_id=product_id, quantity=1)
    db.add(item)
    db.commit()
    assert authenticated_tenant_client.delete(f'/Nike/products/{product_id}').status_code == 409
    db.delete(item)
    db.commit()
    assert authenticated_tenant_client.delete(f'/Nike/products/{product_id}').status_code == 204
    assert db.get(Product, product_id) is None
