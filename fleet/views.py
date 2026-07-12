from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.db.models import Sum, Count, Q
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.utils import timezone
import csv
import datetime

from accounts.permissions import IsFleetManagerOrReadOnly
from .models import (
    Vehicle, DriverProfile, Trip, MaintenanceLog, 
    FuelLog, Expense, VehicleDocument
)
from .serializers import (
    VehicleSerializer, DriverProfileSerializer, TripSerializer, 
    MaintenanceLogSerializer, FuelLogSerializer, ExpenseSerializer,
    VehicleDocumentSerializer
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
        queryset = DriverProfile.objects.select_related('user')
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
        queryset = Trip.objects.select_related('vehicle', 'driver__user')
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
    queryset = MaintenanceLog.objects.select_related('vehicle')

class FuelLogViewSet(viewsets.ModelViewSet):
    serializer_class = FuelLogSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    queryset = FuelLog.objects.select_related('vehicle')

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    queryset = Expense.objects.select_related('vehicle')

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
        # Fetch all related data in bulk to eliminate N+1 queries
        vehicles = Vehicle.objects.all()

        # Aggregate fuel data per vehicle in a single query
        fuel_agg = (
            FuelLog.objects
            .values('vehicle_id')
            .annotate(total_liters=Sum('liters'), total_fuel_cost=Sum('cost'))
        )
        fuel_by_vehicle = {row['vehicle_id']: row for row in fuel_agg}

        # Aggregate maintenance cost per vehicle in a single query
        maint_agg = (
            MaintenanceLog.objects
            .values('vehicle_id')
            .annotate(total_maintenance_cost=Sum('cost'))
        )
        maint_by_vehicle = {row['vehicle_id']: row['total_maintenance_cost'] for row in maint_agg}

        # Fetch all completed trips in one query
        completed_trips = Trip.objects.filter(status=Trip.Status.COMPLETED).values(
            'vehicle_id', 'actual_distance', 'planned_distance', 'revenue'
        )
        trips_by_vehicle = {}
        for t in completed_trips:
            trips_by_vehicle.setdefault(t['vehicle_id'], []).append(t)

        report_data = []
        for vehicle in vehicles:
            vid = vehicle.id
            fuel = fuel_by_vehicle.get(vid, {})
            total_liters = float(fuel.get('total_liters') or 0)
            total_fuel_cost = float(fuel.get('total_fuel_cost') or 0)
            total_maintenance_cost = float(maint_by_vehicle.get(vid) or 0)
            operational_cost = total_fuel_cost + total_maintenance_cost

            vtrips = trips_by_vehicle.get(vid, [])
            total_distance = sum(
                float(t['actual_distance'] if t['actual_distance'] is not None else t['planned_distance'] or 0)
                for t in vtrips
            )
            total_revenue = sum(float(t['revenue'] or 0) for t in vtrips)

            fuel_efficiency = (total_distance / total_liters) if total_liters > 0 else 0.0
            roi = ((total_revenue - operational_cost) / float(vehicle.acquisition_cost)) if vehicle.acquisition_cost > 0 else 0.0

            report_data.append({
                'vehicle_id': vid,
                'registration_number': vehicle.registration_number,
                'name_model': vehicle.name_model,
                'total_distance_km': round(total_distance, 2),
                'total_fuel_liters': round(total_liters, 2),
                'fuel_efficiency_km_l': round(fuel_efficiency, 2),
                'operational_cost': round(operational_cost, 2),
                'total_revenue': round(total_revenue, 2),
                'roi': round(roi, 4)
            })

        export_param = request.query_params.get('export')
        if export_param == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="fleet_analytics_report.csv"'
            writer = csv.writer(response)
            writer.writerow([
                'Vehicle ID', 'Registration Number', 'Name/Model',
                'Total Distance (km)', 'Total Fuel (liters)', 'Fuel Efficiency (km/L)',
                'Operational Cost', 'Total Revenue', 'ROI'
            ])
            for item in report_data:
                writer.writerow([
                    item['vehicle_id'], item['registration_number'], item['name_model'],
                    item['total_distance_km'], item['total_fuel_liters'], item['fuel_efficiency_km_l'],
                    item['operational_cost'], item['total_revenue'], item['roi']
                ])
            return response

        return Response(report_data)

class VehicleDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleDocumentSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    queryset = VehicleDocument.objects.select_related('vehicle')

class ComplianceAlertView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        expiring_limit_driver = today + datetime.timedelta(days=30)
        expiring_limit_doc = today + datetime.timedelta(days=15)
        
        expired_drivers = DriverProfile.objects.select_related('user').filter(license_expiry_date__lt=today)
        expiring_drivers = DriverProfile.objects.select_related('user').filter(
            license_expiry_date__gte=today,
            license_expiry_date__lte=expiring_limit_driver
        )

        expired_docs = VehicleDocument.objects.select_related('vehicle').filter(expiry_date__lt=today)
        expiring_docs = VehicleDocument.objects.select_related('vehicle').filter(
            expiry_date__gte=today,
            expiry_date__lte=expiring_limit_doc
        )
        
        driver_expired_list = [{
            'driver_id': d.id,
            'driver_name': d.user.username,
            'license_number': d.license_number,
            'expiry_date': str(d.license_expiry_date),
            'days_expired': (today - d.license_expiry_date).days
        } for d in expired_drivers]
        
        driver_expiring_list = [{
            'driver_id': d.id,
            'driver_name': d.user.username,
            'license_number': d.license_number,
            'expiry_date': str(d.license_expiry_date),
            'days_remaining': (d.license_expiry_date - today).days
        } for d in expiring_drivers]
        
        doc_expired_list = [{
            'document_id': doc.id,
            'vehicle_id': doc.vehicle.id,
            'registration_number': doc.vehicle.registration_number,
            'document_name': doc.document_name,
            'document_number': doc.document_number,
            'expiry_date': str(doc.expiry_date),
            'days_expired': (today - doc.expiry_date).days
        } for doc in expired_docs]
        
        doc_expiring_list = [{
            'document_id': doc.id,
            'vehicle_id': doc.vehicle.id,
            'registration_number': doc.vehicle.registration_number,
            'document_name': doc.document_name,
            'document_number': doc.document_number,
            'expiry_date': str(doc.expiry_date),
            'days_remaining': (doc.expiry_date - today).days
        } for doc in expiring_docs]
        
        return Response({
            'driver_alerts': {
                'expired': driver_expired_list,
                'expiring_soon_30_days': driver_expiring_list
            },
            'document_alerts': {
                'expired': doc_expired_list,
                'expiring_soon_15_days': doc_expiring_list
            }
        })



