from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class HomeCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    title: str = Field(min_length=1, max_length=150)
    district: str = Field(min_length=1, max_length=100)
    rooms: int = Field(strict=True, gt=0)

    area: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
        allow_inf_nan=False,
    )

    price: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
        allow_inf_nan=False,
    )


class HomeRead(HomeCreate):
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
        extra="forbid",
    )

    id: int
    
class HomeUpdate(HomeCreate):
    pass
class ProjectCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    home_id: int = Field(strict=True, gt=0)
    name: str = Field(min_length=1, max_length=100)

    budget: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
        allow_inf_nan=False,
    )


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    name: str = Field(min_length=1, max_length=100)

    budget: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
        allow_inf_nan=False,
    )

    status: Literal["active", "completed"]


class ProjectRead(ProjectCreate):
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
        extra="forbid",
    )

    id: int
    status: Literal["active", "completed"]