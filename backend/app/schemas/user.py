from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=64, description="Unique username")
    email: Optional[str] = Field(default=None, description="User email address")
    full_name: Optional[str] = Field(default=None, max_length=128)
    role: str = Field(default="operator", description="Role: admin, operator, analyst, viewer")


class UserCreate(UserBase):
    password: str = Field(min_length=6, description="Password (at least 6 characters)")


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenPayload(BaseModel):
    sub: str
    user_id: int
    role: str
    exp: Optional[int] = None


class RoleUpdateRequest(BaseModel):
    role: str = Field(description="Role: admin, operator, analyst, viewer")


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)
