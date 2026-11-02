import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models import (
    Message,
    Product,
    ProductCreate,
    ProductPublic,
    ProductsPublic,
    ProductUpdate,
    get_datetime_utc,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=ProductsPublic)
def read_products(
    session: SessionDep, _current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve products.
    """
    count_statement = select(func.count()).select_from(Product)
    count = session.exec(count_statement).one()

    statement = (
        select(Product)
        .order_by(col(Product.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    products = session.exec(statement).all()

    products_public = [ProductPublic.model_validate(product) for product in products]
    return ProductsPublic(data=products_public, count=count)


@router.get("/{id}", response_model=ProductPublic)
def read_product(session: SessionDep, _current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get product by ID.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ProductPublic,
)
def create_product(*, session: SessionDep, product_in: ProductCreate) -> Any:
    """
    Create new product.
    """
    product = crud.get_product_by_sku(session=session, sku=product_in.sku)
    if product:
        raise HTTPException(
            status_code=400,
            detail="The product with this SKU already exists in the system.",
        )
    return crud.create_product(session=session, product_in=product_in)


@router.put(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ProductPublic,
)
def update_product(
    *, session: SessionDep, id: uuid.UUID, product_in: ProductUpdate
) -> Any:
    """
    Update a product.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product_in.sku is not None:
        existing_product = crud.get_product_by_sku(session=session, sku=product_in.sku)
        if existing_product and existing_product.id != product.id:
            raise HTTPException(
                status_code=400,
                detail="The product with this SKU already exists in the system.",
            )

    update_dict = product_in.model_dump(exclude_unset=True)
    product.sqlmodel_update(update_dict)
    product.updated_at = get_datetime_utc()
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.delete(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_product(session: SessionDep, id: uuid.UUID) -> Message:
    """
    Delete a product.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    session.delete(product)
    session.commit()
    return Message(message="Product deleted successfully")
