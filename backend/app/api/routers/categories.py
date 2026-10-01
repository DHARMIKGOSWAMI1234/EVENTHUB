"""EVENTHUB Category API Router

Provides public retrieval of event categories.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models import Category
from app.schemas.categories import CategoryResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get(
    "",
    response_model=List[CategoryResponse],
    summary="List all categories",
)
def list_categories(db: Session = Depends(get_db)) -> List[Category]:
    """Retrieve all available event categories."""
    return db.query(Category).order_by(Category.name.asc()).all()


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get category by ID",
)
def get_category(category_id: int, db: Session = Depends(get_db)) -> Category:
    """Retrieve category details by ID."""
    category = db.query(Category).filter(Category.id == category_id).one_or_none()
    if not category:
        raise NotFoundException("Category", category_id)
    return category
