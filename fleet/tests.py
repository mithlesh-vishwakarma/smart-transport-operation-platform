from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from .models import Vehicle, DriverProfile, Trip, MaintenanceLog, FuelLog, Expense, VehicleDocument
import datetime
from django.utils import timezone

User = get_user_model()

class FleetBaseTestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(username='m_mgr', email='m@t.com', password='p', role='FLEET_MANAGER')
        self.driver_user = User.objects.create_user(username='d_drv', email='d@t.com', password='p', role='DRIVER')
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user,
            license_number='LIC-ABC-123',
            license_category='Class A',
            license_expiry_date=datetime.date.today() + datetime.timedelta(days=100),
            contact_number='555-5555'
        )
        self.vehicle = Vehicle.objects.create(
            registration_number='REG-XYZ-999',
            name_model='Heavy Rig',
            vehicle_type='Truck',
            max_load_capacity=1000.0,
            odometer=50000.0,
            acquisition_cost=60000.00,
            required_license_category='Class B'
        )

class FleetCRUDTestCase(FleetBaseTestCase):
    def test_vehicle_list_unauthenticated(self):
        res = self.client.get('/api/vehicles/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_vehicle_list_authenticated_driver(self):
        self.client.force_authenticate(user=self.driver_user)
        res = self.client.get('/api/vehicles/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_vehicle_create_driver_blocked(self):
        self.client.force_authenticate(user=self.driver_user)
        payload = {
            'registration_number': 'REG-NEW-111',
            'name_model': 'Cargo Van',
            'vehicle_type': 'Van',
            'max_load_capacity': 500.0,
            'odometer': 0.0,
            'acquisition_cost': 25000.00,
            'required_license_category': 'Class C'
        }
        res = self.client.post('/api/vehicles/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_vehicle_create_manager_allowed(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            'registration_number': 'REG-NEW-111',
            'name_model': 'Cargo Van',
            'vehicle_type': 'Van',
            'max_load_capacity': 500.0,
            'odometer': 0.0,
            'acquisition_cost': 25000.00,
            'required_license_category': 'Class C'
        }
        res = self.client.post('/api/vehicles/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Vehicle.objects.filter(registration_number='REG-NEW-111').exists())

class TripDispatchTestCase(FleetBaseTestCase):
    def test_dispatch_overload_weight_fails(self):
        self.client.force_authenticate(user=self.manager)
        trip = Trip.objects.create(
            source='Origin', destination='Dest',
            vehicle=self.vehicle, driver=self.driver_profile,
            cargo_weight=1500.0, planned_distance=100.0,
            revenue=500.00
        )
        res = self.client.post(f'/api/trips/{trip.id}/dispatch/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cargo weight', str(res.data.get('error')))

    def test_dispatch_license_mismatch_fails(self):
        self.client.force_authenticate(user=self.manager)
        driver_c_user = User.objects.create_user(username='d_c', email='c@t.com', password='p', role='DRIVER')
        driver_c = DriverProfile.objects.create(
            user=driver_c_user,
            license_number='LIC-C-001',
            license_category='Class C',
            license_expiry_date=datetime.date.today() + datetime.timedelta(days=100)
        )
        self.vehicle.required_license_category = 'Class A'
        self.vehicle.save()
        
        trip = Trip.objects.create(
            source='A', destination='B',
            vehicle=self.vehicle, driver=driver_c,
            cargo_weight=100.0, planned_distance=50.0,
            revenue=200.00
        )
        res = self.client.post(f'/api/trips/{trip.id}/dispatch/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('insufficient', str(res.data.get('error')))

    def test_dispatch_expired_license_fails(self):
        self.client.force_authenticate(user=self.manager)
        self.driver_profile.license_expiry_date = datetime.date.today() - datetime.timedelta(days=5)
        self.driver_profile.save()
        
        trip = Trip.objects.create(
            source='A', destination='B',
            vehicle=self.vehicle, driver=self.driver_profile,
            cargo_weight=100.0, planned_distance=50.0,
            revenue=200.00
        )
        res = self.client.post(f'/api/trips/{trip.id}/dispatch/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', str(res.data.get('error')))

class TripLifecycleTestCase(FleetBaseTestCase):
    def test_trip_dispatch_completes_resets_mileage(self):
        self.client.force_authenticate(user=self.manager)
        trip = Trip.objects.create(
            source='A', destination='B',
            vehicle=self.vehicle, driver=self.driver_profile,
            cargo_weight=100.0, planned_distance=100.0,
            revenue=500.00
        )
        
        res1 = self.client.post(f'/api/trips/{trip.id}/dispatch/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        
        self.vehicle.refresh_from_db()
        self.driver_profile.refresh_from_db()
        self.assertEqual(self.vehicle.status, Vehicle.Status.ON_TRIP)
        self.assertEqual(self.driver_profile.status, DriverProfile.Status.ON_TRIP)

        res2 = self.client.post(f'/api/trips/{trip.id}/complete/', {'actual_distance': 105.0}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        
        self.vehicle.refresh_from_db()
        self.driver_profile.refresh_from_db()
        self.assertEqual(self.vehicle.status, Vehicle.Status.AVAILABLE)
        self.assertEqual(self.driver_profile.status, DriverProfile.Status.AVAILABLE)
        self.assertEqual(self.vehicle.odometer, 50105.0)

class MaintenanceFuelExpenseTestCase(FleetBaseTestCase):
    def test_maintenance_puts_vehicle_in_shop(self):
        self.client.force_authenticate(user=self.manager)
        self.client.post('/api/maintenance/', {
            'vehicle': self.vehicle.id,
            'description': 'Brake replacement',
            'cost': 450.00,
            'is_active': True
        }, format='json')
        
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.status, Vehicle.Status.IN_SHOP)
        self.assertTrue(Expense.objects.filter(expense_type='Maintenance', cost=450.00).exists())

    def test_fuel_log_adds_expense(self):
        self.client.force_authenticate(user=self.manager)
        self.client.post('/api/fuel-logs/', {
            'vehicle': self.vehicle.id,
            'liters': 40.0,
            'cost': 60.00
        }, format='json')
        
        self.assertTrue(Expense.objects.filter(expense_type='Fuel', cost=60.00).exists())

    def test_dashboard_kpis_and_reports_endpoints(self):
        self.client.force_authenticate(user=self.manager)
        
        FuelLog.objects.create(vehicle=self.vehicle, liters=50.0, cost=75.00)
        Trip.objects.create(
            source='A', destination='B',
            vehicle=self.vehicle, driver=self.driver_profile,
            cargo_weight=100.0, planned_distance=200.0,
            revenue=1000.00, status=Trip.Status.COMPLETED,
            actual_distance=200.0
        )
        
        res_kpi = self.client.get('/api/dashboard/kpis/')
        self.assertEqual(res_kpi.status_code, status.HTTP_200_OK)
        self.assertEqual(res_kpi.data['total_vehicles'], 1)

        res_report = self.client.get('/api/reports/analytics/')
        self.assertEqual(res_report.status_code, status.HTTP_200_OK)
        self.assertEqual(res_report.data[0]['fuel_efficiency_km_l'], 4.0)
        self.assertEqual(res_report.data[0]['roi'], 0.0154)

        res_csv = self.client.get('/api/reports/analytics/?export=csv')
        self.assertEqual(res_csv.status_code, status.HTTP_200_OK)
        self.assertEqual(res_csv['Content-Type'], 'text/csv')
        self.assertIn('attachment', res_csv['Content-Disposition'])
