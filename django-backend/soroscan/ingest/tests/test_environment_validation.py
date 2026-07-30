import os
import sys
import importlib
from unittest import mock

import pytest
from django.core.exceptions import ImproperlyConfigured

import soroscan.settings


class TestEnvironmentValidation:
    def test_missing_required_env_vars_raises_error(self):
        # We need to simulate that we are not running tests
        # to trigger the production startup checks in settings.py.
        with mock.patch.object(sys, "argv", ["manage.py", "runserver"]):
            with mock.patch.dict(os.environ, {}, clear=True):
                # Ensure DJANGO_SETTINGS_MODULE doesn't trigger _running_tests=True
                os.environ["DJANGO_SETTINGS_MODULE"] = "soroscan.settings"
                
                with pytest.raises(ImproperlyConfigured) as exc_info:
                    importlib.reload(soroscan.settings)
                
                assert "Required environment variable" in str(exc_info.value)
                assert "SECRET_KEY" in str(exc_info.value)

    def test_all_required_env_vars_passes(self):
        with mock.patch.object(sys, "argv", ["manage.py", "runserver"]):
            with mock.patch.dict(os.environ, {}, clear=True):
                os.environ["DJANGO_SETTINGS_MODULE"] = "soroscan.settings"
                os.environ["SECRET_KEY"] = "test-secret"
                os.environ["DATABASE_URL"] = "postgres://..."
                os.environ["REDIS_URL"] = "redis://..."
                os.environ["SOROBAN_RPC_URL"] = "https://..."
                os.environ["STELLAR_NETWORK_PASSPHRASE"] = "Test SDF Network ; September 2015"
                os.environ["SOROSCAN_CONTRACT_ID"] = "CC..."
                
                # Should not raise
                importlib.reload(soroscan.settings)
