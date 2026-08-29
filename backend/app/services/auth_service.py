import os
import hashlib
import hmac
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.schemas.user import UserCreate

logger = logging.getLogger("landguard.auth")


class AuthService:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    # ─────────────────────────────────────────────────────────────
    # Password Hashing & Verification (PBKDF2-HMAC-SHA256)
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plain text password with a secure random salt."""
        salt = secrets.token_hex(16)
        iterations = 100_000
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return f"pbkdf2_sha256${iterations}${salt}${key.hex()}"

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against stored PBKDF2 hash."""
        try:
            parts = hashed_password.split("$")
            if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
                # Fallback simple sha256 check
                return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

            _, iterations_str, salt, stored_key = parts
            iterations = int(iterations_str)
            key = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations,
            )
            return hmac.compare_digest(key.hex(), stored_key)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

    # ─────────────────────────────────────────────────────────────
    # JWT Token Generation & Verification
    # ─────────────────────────────────────────────────────────────
    def create_access_token(self, user: User, expires_delta: Optional[timedelta] = None) -> Dict[str, Any]:
        """Generate a cryptographically signed JWT access token for the user."""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.expire_minutes)

        payload = {
            "sub": user.username,
            "user_id": user.id,
            "role": user.role,
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": int(self.expire_minutes * 60),
            "user": user,
        }

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate a JWT access token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired signature")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None

    # ─────────────────────────────────────────────────────────────
    # User Management Operations
    # ─────────────────────────────────────────────────────────────
    def get_user_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def authenticate_user(self, db: Session, username: str, password: str) -> Optional[User]:
        user = self.get_user_by_username(db, username)
        if not user:
            return None
        if not user.is_active:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None

        # Update last login timestamp
        user.last_login = datetime.utcnow()
        db.commit()
        return user

    def create_user(self, db: Session, user_in: UserCreate) -> User:
        hashed = self.hash_password(user_in.password)
        user = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=hashed,
            full_name=user_in.full_name,
            role=user_in.role.lower() if user_in.role else "operator",
            is_active=True,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # ─────────────────────────────────────────────────────────────
    # System Seeding (Default Default Users)
    # ─────────────────────────────────────────────────────────────
    def seed_default_users(self, db: Session):
        """Seed standard initial operator and admin accounts if none exist."""
        default_accounts = [
            {
                "username": "admin",
                "email": "admin@landguard.ai",
                "password": "admin123",
                "role": "admin",
                "full_name": "Chief Safety Engineer (Admin)",
            },
            {
                "username": "operator",
                "email": "operator@landguard.ai",
                "password": "operator123",
                "role": "operator",
                "full_name": "Control Room Operator",
            },
            {
                "username": "analyst",
                "email": "analyst@landguard.ai",
                "password": "analyst123",
                "role": "analyst",
                "full_name": "Geotechnical Data Analyst",
            },
            {
                "username": "viewer",
                "email": "viewer@landguard.ai",
                "password": "viewer123",
                "role": "viewer",
                "full_name": "Public Emergency Observer",
            },
        ]

        for acc in default_accounts:
            existing = self.get_user_by_username(db, acc["username"])
            if not existing:
                self.create_user(
                    db,
                    UserCreate(
                        username=acc["username"],
                        email=acc["email"],
                        password=acc["password"],
                        role=acc["role"],
                        full_name=acc["full_name"],
                    ),
                )
                logger.info(f"Seeded default user: {acc['username']} (Role: {acc['role']})")


auth_service = AuthService()
