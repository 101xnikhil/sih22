import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    RoleUpdateRequest,
    ChangePasswordRequest,
)
from app.services.auth_service import auth_service
from app.api.deps import get_current_user, require_admin

logger = logging.getLogger("landguard.auth_api")
router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with JSON credentials and receive a cryptographically signed JWT access token.
    Default Pre-Seeded Accounts:
    - **admin** / **admin123** (Role: admin)
    - **operator** / **operator123** (Role: operator)
    - **analyst** / **analyst123** (Role: analyst)
    - **viewer** / **viewer123** (Role: viewer)
    """
    user = auth_service.authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_dict = auth_service.create_access_token(user)
    return token_dict


@router.post("/token", status_code=status.HTTP_200_OK)
def oauth2_form_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 compatible token endpoint used directly by FastAPI Swagger UI interactive authorize popup.
    """
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_dict = auth_service.create_access_token(user)
    return {
        "access_token": token_dict["access_token"],
        "token_type": "bearer",
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new user account (e.g. operator, analyst, viewer).
    """
    existing = auth_service.get_user_by_username(db, user_in.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{user_in.username}' is already registered.",
        )

    user = auth_service.create_user(db, user_in)
    return user


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve current authenticated user profile and permissions.
    Requires: `Authorization: Bearer <access_token>`
    """
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change password for the currently logged in user.
    """
    if not auth_service.verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password.",
        )

    current_user.hashed_password = auth_service.hash_password(payload.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully."}


@router.get("/users", response_model=List[UserResponse], status_code=status.HTTP_200_OK)
def list_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    List all registered users. Restricted to `admin` role.
    """
    return db.query(User).order_by(User.id.asc()).all()


@router.put("/users/{user_id}/role", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_user_role(
    user_id: int,
    role_in: RoleUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Update a user's role (admin, operator, analyst, viewer). Restricted to `admin` role.
    """
    user = auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    valid_roles = ["admin", "operator", "analyst", "viewer"]
    if role_in.role.lower() not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role_in.role}'. Must be one of: {valid_roles}",
        )

    user.role = role_in.role.lower()
    db.commit()
    db.refresh(user)
    return user
