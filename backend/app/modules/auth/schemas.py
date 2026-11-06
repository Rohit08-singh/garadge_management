
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Login request
class LoginRequest(BaseModel):
    username: str = Field(
        min_length=1,
        max_length=50,
    )

    password: str = Field(
        min_length=1,
        max_length=128,
    )


# User details returned by the API
class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    phone: str | None = None
    role: str

    model_config = ConfigDict(from_attributes=True)


# Login response
class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserResponse


# Create operator request
class OperatorCreateRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
    )

    full_name: str = Field(
        min_length=2,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        max_length=15,
    )

    password: str = Field(
        min_length=8,
        max_length=72,
    )
