from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.database import get_db
from server.repositories import products

router = APIRouter(tags=["Brands"])


@router.get("/brands")
def list_brands(db: Session = Depends(get_db)):
    return products.list_brands(db)
