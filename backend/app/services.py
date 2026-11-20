from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Home
from app.schemas import HomeCreate

from sqlalchemy.exc import IntegrityError
from app.schemas import ProjectUpdate
from app.models import Project
from app.schemas import ProjectCreate
def create_home(db: Session, data: HomeCreate) -> Home:
    home = Home(**data.model_dump())

    try:
        db.add(home)
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(home)
    return home


def get_homes(db: Session) -> list[Home]:
    query = select(Home).order_by(Home.id)
    return list(db.scalars(query).all())
def get_home(db: Session, home_id: int) -> Home | None:
    return db.get(Home, home_id)


def update_home(
    db: Session,
    home: Home,
    data: HomeCreate,
) -> Home:
    try:
        for field, value in data.model_dump().items():
            setattr(home, field, value)

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(home)
    return home


def delete_home(db: Session, home: Home) -> None:
    try:
        db.delete(home)
        db.commit()
    except Exception:
        db.rollback()
        raise
class ProjectError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def create_project(db: Session, data: ProjectCreate) -> Project:
    home = db.get(Home, data.home_id)

    if home is None:
        raise ProjectError(404, "Квартира не найдена")

    project = Project(**data.model_dump())

    try:
        db.add(project)
        db.commit()

    except IntegrityError as exc:
        db.rollback()

        error_code = getattr(exc.orig, "sqlstate", None)
        diagnostic = getattr(exc.orig, "diag", None)
        constraint = getattr(diagnostic, "constraint_name", None)

        if (
            error_code == "23505"
            and constraint == "uq_active_project_per_home"
        ):
            raise ProjectError(
                409,
                "У этой квартиры уже есть активный проект ремонта",
            ) from exc

        if error_code == "23503":
            raise ProjectError(
                404,
                "Квартира больше не существует",
            ) from exc

        raise

    except Exception:
        db.rollback()
        raise

    db.refresh(project)
    return project


def get_projects(db: Session) -> list[Project]:
    query = select(Project).order_by(Project.id)
    return list(db.scalars(query).all())


def get_project(db: Session, project_id: int) -> Project | None:
    return db.get(Project, project_id)
def update_project(
    db: Session,
    project_id: int,
    data: ProjectUpdate,
) -> Project:
    try:
        query = (
            select(Project)
            .where(Project.id == project_id)
            .with_for_update()
        )
        project = db.scalar(query)

        if project is None:
            raise ProjectError(404, "Проект не найден")

        if project.status == "completed":
            raise ProjectError(
                409,
                "Завершённый проект нельзя изменять",
            )

        project.name = data.name
        project.budget = data.budget
        project.status = data.status

        db.commit()

    except Exception:
        db.rollback()
        raise

    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> None:
    try:
        query = (
            select(Project)
            .where(Project.id == project_id)
            .with_for_update()
        )
        project = db.scalar(query)

        if project is None:
            raise ProjectError(404, "Проект не найден")

        if project.status == "completed":
            raise ProjectError(
                409,
                "Завершённый проект нельзя удалить",
            )

        db.delete(project)
        db.commit()

    except Exception:
        db.rollback()
        raise