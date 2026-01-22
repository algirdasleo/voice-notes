"""API dependencies for voice notes."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from voice_notes.models.auth import AccessTokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["argon2"],
)


def decode_access_token(token: str) -> AccessTokenData | None:
    """Decode JWT token and return AccessTokenData or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        exp_date = payload.get("exp")
        if not user_id or not exp_date:
            return None

        return AccessTokenData(user_id=UUID(user_id), exp_date=exp_date)
    except JWTError:
        return None


def get_access_token_data(
    token: str = Depends(oauth2_scheme),
) -> AccessTokenData:
    """Decode JWT token and retrieve current user ID."""
    try:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

        token_data = decode_access_token(token=token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

        return token_data
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )


def create_jwt(user_id: UUID, expires_in: int) -> str:
    """Create a JWT token for the given user ID."""
    expire = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    to_encode = {"sub": str(user_id), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def hash_password(password: str) -> str:
    """Hash the password using Argon2 algorithm."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against Argon2 hash."""
    return pwd_context.verify(plain_password, hashed_password)
