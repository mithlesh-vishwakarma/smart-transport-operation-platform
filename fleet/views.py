from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.core.exceptions import ValidationError
from django.http import HttpResponse
import csv

from accounts.permissions import IsFleetManagerOrReadOnly
from .models import (
    Vehicle, DriverProfile, Trip, MaintenanceLog, 
    FuelLog, Expense
)
from .serializers import (
    VehicleSerializer, DriverProfileSerializer, TripSerializer, 
    MaintenanceLogSerializer, FuelLogSerializer, ExpenseSerializer
)

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsFleetManagerOrReadOnly]

    def get_queryset(self):
        queryset = Vehicle.objects.all()
        params = self.request.query_params if hasattr(self.request, 'query_params') else self.request.GET
        status = params.get('status')
        vehicle_type = params.get('vehicle_type')
        search = params.get('search')
        
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
        params = self.request.query_params if hasattr(self.request, 'query_params') else self.request.GET
        status = params.get('status')
        license_category = params.get('license_category')
        search = params.get('search')
        
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

class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsFleetManagerOrReadOnly]

    def get_queryset(self):
        queryset = Trip.objects.all()
        params = self.request.query_params if hasattr(self.request, 'query_params') else self.request.GET
        status_param = params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=True, methods=['post'], url_path='dispatch', permission_classes=[permissions.IsAuthenticated])
    def dispatch_trip(self, request, pk=None):
        trip = self.get_object()
        if trip.status != Trip.Status.DRAFT:
            return Response({'error': f"Cannot dispatch trip in {trip.status} status."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            trip.status = Trip.Status.DISPATCHED
            trip.save()
            return Response(TripSerializer(trip).data)
        except ValidationError as e:
            return Response({'error': e.messages if hasattr(e, 'messages') else str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        trip = self.get_object()
        if trip.status != Trip.Status.DISPATCHED:
            return Response({'error': f"Cannot complete trip in {trip.status} status."}, status=status.HTTP_400_BAD_REQUEST)
        
        actual_dist = request.data.get('actual_distance')
        if actual_dist is not None:
            try:
                trip.actual_distance = float(actual_dist)
            except ValueError:
                return Response({'error': "actual_distance must be a float number."}, status=status.HTTP_400_BAD_REQUEST)
        
        trip.status = Trip.Status.COMPLETED
        trip.save()
        return Response(TripSerializer(trip).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        trip = self.get_object()
        if trip.status != Trip.Status.DISPATCHED:
            return Response({'error': f"Cannot cancel trip in {trip.status} status."}, status=status.HTTP_400_BAD_REQUEST)
        
        trip.status = Trip.Status.CANCELLED
        trip.save()
        return Response(TripSerializer(trip).data)

class MaintenanceLogViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceLogSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    queryset = MaintenanceLog.objects.all()

class FuelLogViewSet(viewsets.ModelViewSet):
    serializer_class = FuelLogSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    queryset = FuelLog.objects.all()

class ExpenseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    queryset = Expense.objects.all()

class DashboardKPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_vehicles = Vehicle.objects.count()
        active_vehicles = Vehicle.objects.filter(status=Vehicle.Status.ON_TRIP).count()
        available_vehicles = Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE).count()
        vehicles_in_shop = Vehicle.objects.filter(status=Vehicle.Status.IN_SHOP).count()
        
        active_trips = Trip.objects.filter(status=Trip.Status.DISPATCHED).count()
        pending_trips = Trip.objects.filter(status=Trip.Status.DRAFT).count()
        
        drivers_on_duty = DriverProfile.objects.filter(
            status__in=[DriverProfile.Status.AVAILABLE, DriverProfile.Status.ON_TRIP]
        ).count()
        
        fleet_utilization = 0.0
        if total_vehicles > 0:
            fleet_utilization = (active_trips / total_vehicles) * 100.0
            
        data = {
            'total_vehicles': total_vehicles,
            'active_vehicles': active_vehicles,
            'available_vehicles': available_vehicles,
            'vehicles_in_shop': vehicles_in_shop,
            'active_trips': active_trips,
            'pending_trips': pending_trips,
            'drivers_on_duty': drivers_on_duty,
            'fleet_utilization_percent': round(fleet_utilization, 2)
        }
        return Response(data)

class AnalyticsReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vehicles = Vehicle.objects.all()
        report_data = []

        for vehicle in vehicles:
            total_liters = sum(log.liters for log in FuelLog.objects.filter(vehicle=vehicle))
            
            completed_trips = Trip.objects.filter(vehicle=vehicle, status=Trip.Status.COMPLETED)
            total_distance = sum(
                (t.actual_distance if t.actual_distance is not None else t.planned_distance)
                for t in completed_trips
            )
            
            fuel_efficiency = 0.0
            if total_liters > 0:
                fuel_efficiency = total_distance / total_liters
                
            total_fuel_cost = sum(log.cost for log in FuelLog.objects.filter(vehicle=vehicle))
            total_maintenance_cost = sum(log.cost for log in MaintenanceLog.objects.filter(vehicle=vehicle))
            operational_cost = total_fuel_cost + total_maintenance_cost
            
            total_revenue = sum(t.revenue for t in completed_trips)
            
            roi = 0.0
            if vehicle.acquisition_cost > 0:
                roi = (total_revenue - operational_cost) / vehicle.acquisition_cost
                
            report_data.append({
                'vehicle_id': vehicle.id,
                'registration_number': vehicle.registration_number,
                'name_model': vehicle.name_model,
                'total_distance_km': round(total_distance, 2),
                'total_fuel_liters': round(total_liters, 2),
                'fuel_efficiency_km_l': round(fuel_efficiency, 2),
                'operational_cost': float(operational_cost),
                'total_revenue': float(total_revenue),
                'roi': round(float(roi), 4)
            })

        export_param = request.query_params.get('export')
        if export_param == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="fleet_analytics_report.csv"'
            writer = csv.writer(response)
            
            writer.writerow([
                'Vehicle ID', 'Registration Number', 'Name/Model', 
                'Total Distance (km)', 'Total Fuel (liters)', 'Fuel Efficiency (km/L)', 
                'Operational Cost ($)', 'Total Revenue ($)', 'ROI'
            ])
            
            for item in report_data:
                writer.writerow([
                    item['vehicle_id'], item['registration_number'], item['name_model'],
                    item['total_distance_km'], item['total_fuel_liters'], item['fuel_efficiency_km_l'],
                    item['operational_cost'], item['total_revenue'], item['roi']
                ])
            return response
            
        return Response(report_data)



