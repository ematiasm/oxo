from decimal import Decimal

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.product import create_random_product, random_sku
from tests.utils.utils import random_lower_string


def test_create_product(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "name": "Mate",
        "description": "Mate de calabaza",
        "sku": random_sku(),
        "price": "1500.50",
        "stock": 10,
    }
    response = client.post(
        f"{settings.API_V1_STR}/products/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["sku"] == data["sku"]
    assert Decimal(content["price"]) == Decimal("1500.50")
    assert content["stock"] == 10
    assert content["is_active"] is True
    assert "id" in content
    assert "updated_at" in content


def test_create_product_as_normal_user_is_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    data = {"name": "Mate", "sku": random_sku(), "price": "100.00", "stock": 1}
    response = client.post(
        f"{settings.API_V1_STR}/products/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_create_product_requires_auth(client: TestClient) -> None:
    data = {"name": "Mate", "sku": random_sku(), "price": "100.00", "stock": 1}
    response = client.post(f"{settings.API_V1_STR}/products/", json=data)
    assert response.status_code == 401


def test_create_product_rejects_duplicate_sku(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    product = create_random_product(db)
    data = {
        "name": random_lower_string(),
        "sku": product.sku,
        "price": "1.00",
        "stock": 0,
    }
    response = client.post(
        f"{settings.API_V1_STR}/products/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_product_rejects_non_positive_price(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Mate", "sku": random_sku(), "price": "0", "stock": 1}
    response = client.post(
        f"{settings.API_V1_STR}/products/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 422


def test_create_product_rejects_negative_stock(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Mate", "sku": random_sku(), "price": "1.00", "stock": -1}
    response = client.post(
        f"{settings.API_V1_STR}/products/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 422


def test_read_product(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    product = create_random_product(db)
    response = client.get(
        f"{settings.API_V1_STR}/products/{product.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(product.id)
    assert content["sku"] == product.sku


def test_read_product_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    import uuid

    response = client.get(
        f"{settings.API_V1_STR}/products/{uuid.uuid4()}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


def test_read_product_requires_auth(client: TestClient, db: Session) -> None:
    product = create_random_product(db)
    response = client.get(f"{settings.API_V1_STR}/products/{product.id}")
    assert response.status_code == 401


def test_read_products(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_random_product(db)
    create_random_product(db)
    response = client.get(
        f"{settings.API_V1_STR}/products/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert content["count"] >= 2


def test_read_products_requires_auth(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/products/")
    assert response.status_code == 401


def test_update_product(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    product = create_random_product(db)
    data = {"name": "Updated name", "price": "99.99"}
    response = client.put(
        f"{settings.API_V1_STR}/products/{product.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == "Updated name"
    assert Decimal(content["price"]) == Decimal("99.99")
    assert content["sku"] == product.sku
    assert content["id"] == str(product.id)


def test_update_product_as_normal_user_is_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    product = create_random_product(db)
    response = client.put(
        f"{settings.API_V1_STR}/products/{product.id}",
        headers=normal_user_token_headers,
        json={"name": "Nope"},
    )
    assert response.status_code == 403


def test_update_product_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    import uuid

    response = client.put(
        f"{settings.API_V1_STR}/products/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json={"name": "Nope"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


def test_update_product_rejects_duplicate_sku(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    first = create_random_product(db)
    second = create_random_product(db)
    response = client.put(
        f"{settings.API_V1_STR}/products/{second.id}",
        headers=superuser_token_headers,
        json={"sku": first.sku},
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_update_product_ignores_updated_at_regression(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    product = create_random_product(db)
    original_updated_at = product.updated_at
    response = client.put(
        f"{settings.API_V1_STR}/products/{product.id}",
        headers=superuser_token_headers,
        json={"stock": 42},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["stock"] == 42
    assert original_updated_at is not None
    assert content["updated_at"] >= str(original_updated_at)


def test_delete_product(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    product = create_random_product(db)
    response = client.delete(
        f"{settings.API_V1_STR}/products/{product.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Product deleted successfully"

    response = client.get(
        f"{settings.API_V1_STR}/products/{product.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_delete_product_as_normal_user_is_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    product = create_random_product(db)
    response = client.delete(
        f"{settings.API_V1_STR}/products/{product.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_delete_product_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    import uuid

    response = client.delete(
        f"{settings.API_V1_STR}/products/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"
