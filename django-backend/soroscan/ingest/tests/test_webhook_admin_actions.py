import pytest
from django.contrib.admin.sites import AdminSite
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory
from soroscan.ingest.admin import WebhookSubscriptionAdmin
from soroscan.ingest.models import WebhookSubscription
from soroscan.ingest.tests.factories import WebhookSubscriptionFactory

@pytest.mark.django_db
class TestWebhookSubscriptionAdmin:
    def setup_method(self):
        self.site = AdminSite()
        self.admin = WebhookSubscriptionAdmin(WebhookSubscription, self.site)
        self.rf = RequestFactory()

    def test_enable_webhooks_action(self):
        # Create a suspended, inactive webhook
        webhook = WebhookSubscriptionFactory(
            is_active=False,
            status=WebhookSubscription.STATUS_SUSPENDED,
            failure_count=5
        )
        
        queryset = WebhookSubscription.objects.filter(id=webhook.id)
        
        request = self.rf.post('/')
        # Add messages support to mock request
        setattr(request, '_messages', FallbackStorage(request))
        # Mock request.user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        request.user = User.objects.create_user(username="testadmin", is_staff=True)
        
        # Mock request.META for IP address used in AdminAuditMixin
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        self.admin.enable_webhooks(request, queryset)
        
        webhook.refresh_from_db()
        assert webhook.is_active is True
        assert webhook.status == WebhookSubscription.STATUS_ACTIVE
        assert webhook.failure_count == 0

    def test_disable_webhooks_action(self):
        # Create an active webhook
        webhook = WebhookSubscriptionFactory(is_active=True)
        
        queryset = WebhookSubscription.objects.filter(id=webhook.id)
        
        request = self.rf.post('/')
        setattr(request, '_messages', FallbackStorage(request))
        # Mock request.user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        request.user = User.objects.create_user(username="testadmin2", is_staff=True)
        
        # Mock request.META for IP address used in AdminAuditMixin
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        self.admin.disable_webhooks(request, queryset)
        
        webhook.refresh_from_db()
        assert webhook.is_active is False
