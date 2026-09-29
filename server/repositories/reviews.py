from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from server.models import Order, OrderItem, Product, Review, User
from server.repositories import services
from server.schemas import ReviewCreate


def list_reviews(db: Session, product_id: int):
    services.get_product(db, product_id)
    average_rating, rating_count = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.product_id == product_id)
        .one()
    )
    reviews = (
        db.query(Review)
        .options(selectinload(Review.user))
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .all()
    )
    return {
        "average_rating": round(float(average_rating), 1) if average_rating else None,
        "rating_count": rating_count,
        "reviews": [_serialize_review(review) for review in reviews],
    }


def create_review(db: Session, current_user: User, product_id: int, payload: ReviewCreate):
    services.get_product(db, product_id)
    has_delivered_order = (
        db.query(OrderItem.id)
        .join(Order)
        .filter(
            OrderItem.product_id == product_id,
            Order.user_id == current_user.id,
            Order.status == "delivered",
        )
        .first()
    )
    if not has_delivered_order:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can review a product after it has been delivered",
        )
    if db.query(Review.id).filter(Review.user_id == current_user.id, Review.product_id == product_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product",
        )

    review = Review(
        user_id=current_user.id,
        product_id=product_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return _serialize_review(review)


def _serialize_review(review: Review) -> dict:
    reviewer_name = review.user.full_name or review.user.username if review.user else "Verified customer"
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "reviewer_name": reviewer_name,
        "created_at": review.created_at.isoformat(),
    }
