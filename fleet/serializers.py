from rest_framework import serializers
from accounts.serializers import UserSerializer
from accounts.models import CustomUser, UserRole
from .models import Vehicle, DriverProfile

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
