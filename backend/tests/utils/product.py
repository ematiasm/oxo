from decimal import Decimal

from sqlmodel import Session

from app import crud
from app.models import Product, ProductCreate
from tests.utils.utils import random_lower_string


def random_sku() -> str:
    return f"SKU-{random_lower_string()[:12]}"


def create_random_product(db: Session) -> Product:
    product_in = ProductCreate(
        name=random_lower_string(),
        sku=random_sku(),
        price=Decimal("10.00"),
        stock=5,
    )
    return crud.create_product(session=db, product_in=product_in)
