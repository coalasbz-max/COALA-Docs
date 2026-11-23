from pydantic import BaseModel, Field
from typing import Literal


class CreateUserRequest(BaseModel):
    full_name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=8)
    role: Literal["admin", "direction", "service"]
    categories: list[str] = []


class UpdateUserRequest(BaseModel):
    full_name: str = Field(min_length=2)
    email: str
    role: Literal["admin", "direction", "service"]
    is_active: bool
    categories: list[str] = []