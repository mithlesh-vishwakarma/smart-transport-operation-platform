from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, DriverProfileViewSet, TripViewSet, 
    MaintenanceLogViewSet, FuelLogViewSet, ExpenseViewSet,
    DashboardKPIView, AnalyticsReportView
)

router = DefaultRouter()
router.register('vehicles', VehicleViewSet, basename='vehicle')
router.register('drivers', DriverProfileViewSet, basename='driver')
router.register('trips', TripViewSet, basename='trip')
router.register('maintenance', MaintenanceLogViewSet, basename='maintenance')
router.register('fuel-logs', FuelLogViewSet, basename='fuel-log')
router.register('expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('reports/analytics/', AnalyticsReportView.as_view(), name='reports-analytics'),
]
