from rest_framework import viewsets
from django.db import models
from accounts.permissions import IsFleetManagerOrReadOnly
from .models import Vehicle, DriverProfile
from .serializers import VehicleSerializer, DriverProfileSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsFleetManagerOrReadOnly]

    def get_queryset(self):
        queryset = Vehicle.objects.all()
        
        # API filter parameters
        status = self.request.query_params.get('status')
        vehicle_type = self.request.query_params.get('vehicle_type')
        search = self.request.query_params.get('search')
        
        if status:
            queryset = queryset.filter(status=status)
        if vehicle_type:
            queryset = queryset.filter(vehicle_type__iexact=vehicle_type)
        if search:
            queryset = queryset.filter(
                models.Q(registration_number__icontains=search) | 
                models.Q(name_model__icontains=search)
            )
        return queryset

class DriverProfileViewSet(viewsets.ModelViewSet):
    serializer_class = DriverProfileSerializer
    permission_classes = [IsFleetManagerOrReadOnly]

    def get_queryset(self):
        queryset = DriverProfile.objects.all()
        
        # API filter parameters
        status = self.request.query_params.get('status')
        license_category = self.request.query_params.get('license_category')
        search = self.request.query_params.get('search')
        
        if status:
            queryset = queryset.filter(status=status)
        if license_category:
            queryset = queryset.filter(license_category__iexact=license_category)
        if search:
            queryset = queryset.filter(
                models.Q(user__username__icontains=search) | 
                models.Q(user__email__icontains=search) |
                models.Q(contact_number__icontains=search)
            )
        return queryset

