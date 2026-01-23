"""Tests for authentication endpoints."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.models.users import User


class TestAuth:
    """Tests for authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client, db: AsyncSession):
        """Test successful user registration."""
        response = await async_client.post(
            "/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
            },
        )
        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, async_client, test_user: User):
        """Test registration with duplicate email returns success (no enumeration)."""
        response = await async_client.post(
            "/auth/register",
            json={
                "email": test_user.email,
                "password": "password123",
            },
        )
        # Return success even for duplicate to prevent user enumeration
        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_login_success(self, async_client, test_user: User):
        """Test successful login."""
        # Set a known password hash for testing
        response = await async_client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword",
            },
        )
        # Should set cookie and return 204
        assert response.status_code == 204
        assert "access_token" in response.cookies

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, async_client):
        """Test login with invalid credentials."""
        response = await async_client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client, user: User):
        """Test login with wrong password."""
        response = await async_client.post(
            "/auth/login",
            json={
                "email": user.email,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
