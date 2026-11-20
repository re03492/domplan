from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import services
from app.database import get_db
from app.schemas import HomeCreate, HomeRead, HomeUpdate


router = APIRouter(
    prefix="/homes",
    tags=["Квартиры"],
)

HomeId = Annotated[int, Path(gt=0)]


@router.post("", response_model=HomeRead, status_code=201)
def create_home(
    data: HomeCreate,
    db: Session = Depends(get_db),
):
    return services.create_home(db, data)


@router.get("", response_model=list[HomeRead])
def get_homes(db: Session = Depends(get_db)):
    return services.get_homes(db)


@router.get("/{home_id}", response_model=HomeRead)
def get_home(
    home_id: HomeId,
    db: Session = Depends(get_db),
):
    home = services.get_home(db, home_id)

    if home is None:
        raise HTTPException(
            status_code=404,
            detail="Квартира не найдена",
        )

    return home


@router.put("/{home_id}", response_model=HomeRead)
def update_home(
    home_id: HomeId,
    data: HomeUpdate,
    db: Session = Depends(get_db),
):
    home = services.get_home(db, home_id)

    if home is None:
        raise HTTPException(
            status_code=404,
            detail="Квартира не найдена",
        )

    return services.update_home(db, home, data)


@router.delete("/{home_id}", status_code=204)
def delete_home(
    home_id: HomeId,
    db: Session = Depends(get_db),
):
    home = services.get_home(db, home_id)

    if home is None:
        raise HTTPException(
            status_code=404,
            detail="Квартира не найдена",
        )

    try:
        services.delete_home(db, home)
    except IntegrityError as exc:
        if getattr(exc.orig, "sqlstate", None) == "23503":
            raise HTTPException(
                status_code=409,
                detail="Нельзя удалить квартиру со связанными проектами",
            ) from exc
        raise

    return Response(status_code=204)