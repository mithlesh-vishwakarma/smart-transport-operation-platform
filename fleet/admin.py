from django.contrib import admin
from .models import (
    Vehicle, DriverProfile, Trip, MaintenanceLog, 
    FuelLog, Expense, VehicleDocument, TripStatusHistory
)

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'name_model', 'vehicle_type', 'odometer', 'status', 'next_service_odometer')
    list_filter = ('status', 'vehicle_type')
    search_fields = ('registration_number', 'name_model')

@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'license_category', 'license_expiry_date', 'status', 'safety_score')
    list_filter = ('status', 'license_category')
    search_fields = ('user__username', 'license_number')

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'source', 'destination', 'vehicle', 'driver', 'status', 'planned_distance')
    list_filter = ('status',)
    search_fields = ('source', 'destination')

@admin.register(MaintenanceLog)
class MaintenanceLogAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'description', 'cost', 'date', 'is_active')
    list_filter = ('is_active',)

@admin.register(FuelLog)
class FuelLogAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'liters', 'cost', 'date')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'expense_type', 'cost', 'date')
    list_filter = ('expense_type',)

@admin.register(VehicleDocument)
class VehicleDocumentAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'document_name', 'document_number', 'expiry_date')

@admin.register(TripStatusHistory)
class TripStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('trip', 'from_status', 'to_status', 'timestamp')

