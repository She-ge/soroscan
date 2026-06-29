from django.urls import path

from . import views

urlpatterns = [
    path("events", views.list_events, name="v1-events"),
    path("contracts/<str:contract_id>", views.get_contract, name="v1-contract-detail"),
]
