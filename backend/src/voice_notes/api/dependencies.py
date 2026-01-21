"""API dependencies for voice notes."""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from voice_notes.models.auth import AccessTokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"


def get_access_token_data(
    token: str = Depends(oauth2_scheme),
) -> AccessTokenData:
    """Decode JWT token and retrieve current user ID."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        exp_date = payload.get("exp")
        if not user_id or not exp_date:
            raise HTTPException(status_code=401, detail="Invalid token")

        return AccessTokenData(user_id=UUID(user_id), exp_date=exp_date)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
