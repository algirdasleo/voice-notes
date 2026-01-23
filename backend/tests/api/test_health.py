"""Tests for health check endpoint."""

import pytest


class TestHealth:
    """Tests for health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self, async_client):
        """Test health check endpoint returns ok status."""
        response = await async_client.get("/health/")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_health_check_no_auth(self, async_client):
        """Test health check does not require authentication."""
        response = await async_client.get("/health/")
        assert response.status_code == 200
