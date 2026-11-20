from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from fastapi import Response
from app.schemas import ProjectUpdate
from app import services
from app.database import get_db
from app.schemas import ProjectCreate, ProjectRead


router = APIRouter(
    prefix="/projects",
    tags=["Проекты ремонта"],
)

ProjectId = Annotated[int, Path(gt=0)]


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
):
    try:
        return services.create_project(db, data)
    except services.ProjectError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc


@router.get("", response_model=list[ProjectRead])
def get_projects(db: Session = Depends(get_db)):
    return services.get_projects(db)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: ProjectId,
    db: Session = Depends(get_db),
):
    project = services.get_project(db, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Проект не найден",
        )

    return project
@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: ProjectId,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    try:
        return services.update_project(db, project_id, data)
    except services.ProjectError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: ProjectId,
    db: Session = Depends(get_db),
):
    try:
        services.delete_project(db, project_id)
    except services.ProjectError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc

    return Response(status_code=204)