import pytest
from .factories import UserFactory, TrackedContractFactory

@pytest.fixture
def user():
    return UserFactory()

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

