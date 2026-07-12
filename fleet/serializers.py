from rest_framework import serializers
from accounts.serializers import UserSerializer
from accounts.models import CustomUser, UserRole
from .models import (
    Vehicle, DriverProfile, Trip, MaintenanceLog, 
    FuelLog, Expense, VehicleDocument, TripStatusHistory
)

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'

class DriverProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=UserRole.DRIVER),
        source='user',
        write_only=True
    )

    class Meta:
        model = DriverProfile
        fields = (
            'id', 'user', 'user_id', 'license_number', 'license_category', 
            'license_expiry_date', 'contact_number', 'safety_score', 'status'
        )
        read_only_fields = ('id', 'safety_score')

class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = '__all__'

class MaintenanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceLog
        fields = '__all__'

class FuelLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelLog
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class VehicleDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleDocument
        fields = '__all__'

class TripStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TripStatusHistory
        fields = '__all__'

