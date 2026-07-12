from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, DriverProfileViewSet

router = DefaultRouter()
router.register('vehicles', VehicleViewSet, basename='vehicle')
router.register('drivers', DriverProfileViewSet, basename='driver')

urlpatterns = [
    path('', include(router.urls)),
]
