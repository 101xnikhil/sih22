import logging
from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import auth_service
from app.config import settings

logger = logging.getLogger("landguard.deps")

# OAuth2 Password Bearer for Swagger UI interactive login
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/token",
    auto_error=False,
)

http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate incoming Bearer JWT token and retrieve the authenticated user.
    Supports both standard Authorization header and OAuth2 form token.
    """
    raw_token = token
    if not raw_token and auth_header:
        raw_token = auth_header.credentials

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = auth_service.decode_token(raw_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    username = payload.get("sub")
    if not user_id or not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = auth_service.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Retrieve user if valid Bearer token provided, otherwise return None."""
    raw_token = token or (auth_header.credentials if auth_header else None)
    if not raw_token:
        return None

    payload = auth_service.decode_token(raw_token)
    if not payload or "user_id" not in payload:
        return None

    return auth_service.get_user_by_id(db, payload["user_id"])


def require_role(allowed_roles: List[str]) -> Callable:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Example: Depends(require_role(["admin", "operator"]))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").lower()
        allowed = [r.lower() for r in allowed_roles]

        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires role in {allowed_roles}. Your role is '{current_user.role}'.",
            )
        return current_user

    return role_checker


# Convenient Pre-Defined Role Checkers
require_admin = require_role(["admin"])
require_operator_or_admin = require_role(["admin", "operator"])
require_analyst_or_higher = require_role(["admin", "operator", "analyst"])
