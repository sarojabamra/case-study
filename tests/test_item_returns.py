def test_tenant_return_decision_affects_only_its_order_item(
    db, seed_catalog, normal_user
):
    from server.models import Order, OrderItem, Product
    from server.repositories import orders, services, tenant_orders
    from server.schemas import OrderReturnDecision

    nike_product = db.query(Product).filter(Product.tenant_id == seed_catalog["tenant"].id).first()
    ikea_product = Product(
        name="Other brand item",
        price=30,
        quantity=8,
        category_id=seed_catalog["category"].id,
        tenant_id=seed_catalog["other_tenant"].id,
    )
    db.add(ikea_product)
    db.flush()
    order = Order(user_id=normal_user.id, total_quantity=2, total_amount=50, status="delivered")
    db.add(order)
    db.flush()
    nike_item = OrderItem(order_id=order.id, product_id=nike_product.id, quantity=2, price=10)
    ikea_item = OrderItem(order_id=order.id, product_id=ikea_product.id, quantity=1, price=30)
    db.add_all([nike_item, ikea_item])
    db.commit()
    nike_quantity_before_approval = nike_product.quantity

    orders.request_order_item_return(db, normal_user, order.id, nike_item.id)
    tenant_orders.update_tenant_order_item_return(
        db,
        seed_catalog["tenant"],
        order.id,
        nike_item.id,
        OrderReturnDecision(return_status="approved"),
    )

    db.refresh(nike_item)
    db.refresh(ikea_item)
    db.refresh(nike_product)
    assert nike_item.return_status == "approved"
    assert ikea_item.return_status is None
    assert nike_product.quantity == nike_quantity_before_approval + nike_item.quantity
    tenant_order = services.serialize_order(order, tenant_id=seed_catalog["tenant"].id)
    assert tenant_order["total_quantity"] == 2
    assert tenant_order["total_amount"] == 20
    assert len(tenant_order["items"]) == 1


def test_tenant_cancellation_affects_only_its_order_item(
    db, seed_catalog, normal_user
):
    from server.models import Order, OrderItem, Product
    from server.repositories import tenant_orders

    nike_product = db.query(Product).filter(Product.tenant_id == seed_catalog["tenant"].id).first()
    other_product = Product(
        name="Other cancellation item", price=30, quantity=8,
        category_id=seed_catalog["category"].id, tenant_id=seed_catalog["other_tenant"].id,
    )
    db.add(other_product)
    db.flush()
    order = Order(user_id=normal_user.id, total_quantity=2, total_amount=50, status="placed")
    db.add(order)
    db.flush()
    nike_item = OrderItem(order_id=order.id, product_id=nike_product.id, quantity=2, price=10)
    other_item = OrderItem(order_id=order.id, product_id=other_product.id, quantity=1, price=30)
    db.add_all([nike_item, other_item])
    db.commit()
    stock_before = nike_product.quantity

    tenant_orders.cancel_tenant_order_item(db, seed_catalog["tenant"], order.id, nike_item.id)

    db.refresh(nike_item)
    db.refresh(other_item)
    db.refresh(nike_product)
    assert nike_item.is_cancelled is True
    assert other_item.is_cancelled is False
    assert nike_product.quantity == stock_before + nike_item.quantity
