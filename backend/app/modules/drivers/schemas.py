from pydantic import BaseModel, ConfigDict, Field


class DriverCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=15)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class DriverUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=15)
    address: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class DriverResponse(BaseModel):
    id: int
    full_name: str
    phone: str | None
    address: str | None
    notes: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)