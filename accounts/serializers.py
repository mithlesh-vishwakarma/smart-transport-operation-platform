from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from fleet.models import DriverProfile
from .models import UserRole

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    # Driver specific details
    license_number = serializers.CharField(required=False, write_only=True)
    license_category = serializers.CharField(required=False, write_only=True)
    license_expiry_date = serializers.DateField(required=False, write_only=True)
    contact_number = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 
                  'license_number', 'license_category', 'license_expiry_date', 'contact_number')

    def validate(self, attrs):
        role = attrs.get('role')
        if role == UserRole.DRIVER:
            # Drivers must provide license details upon registration
            driver_fields = ['license_number', 'license_category', 'license_expiry_date', 'contact_number']
            missing = [f for f in driver_fields if f not in attrs]
            if missing:
                raise serializers.ValidationError(
                    {field: "This field is required for drivers." for field in missing}
                )
        return attrs

    def create(self, validated_data):
        # Extract driver fields
        license_number = validated_data.pop('license_number', None)
        license_category = validated_data.pop('license_category', 'Class C')
        license_expiry_date = validated_data.pop('license_expiry_date', None)
        contact_number = validated_data.pop('contact_number', None)

        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', UserRole.FLEET_MANAGER)
        )

        # Create driver profile if the role is driver
        if user.role == UserRole.DRIVER:
            DriverProfile.objects.create(
                user=user,
                license_number=license_number,
                license_category=license_category,
                license_expiry_date=license_expiry_date,
                contact_number=contact_number
            )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username_or_email = attrs.get('username') or attrs.get('email')
        password = attrs.get('password')

        user = None
        if '@' in username_or_email:
            user = User.objects.filter(email__iexact=username_or_email).first()
        else:
            user = User.objects.filter(username__iexact=username_or_email).first()

        if user and user.check_password(password):
            attrs['username'] = user.username

        data = super().validate(attrs)

        role_homes = {
            'FLEET_MANAGER': '/fleet',
            'DISPATCHER': '/dashboard',
            'SAFETY_OFFICER': '/drivers',
            'FINANCIAL_ANALYST': '/fuel',
            'DRIVER': '/dashboard'
        }

        role_frontend_map = {
            'FLEET_MANAGER': 'Fleet Manager',
            'DISPATCHER': 'Dispatcher',
            'SAFETY_OFFICER': 'Safety Officer',
            'FINANCIAL_ANALYST': 'Financial Analyst',
            'DRIVER': 'Driver'
        }
        frontend_role = role_frontend_map.get(user.role, user.role)
        role_home = role_homes.get(user.role, '/dashboard')

        data['user'] = {
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'role': frontend_role,
            'homePath': role_home
        }
        data['token'] = data['access']
        return data

