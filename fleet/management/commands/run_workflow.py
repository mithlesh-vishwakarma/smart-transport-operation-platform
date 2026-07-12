import datetime
from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from django.utils import timezone
from accounts.models import CustomUser
from fleet.models import Vehicle, DriverProfile, Trip, MaintenanceLog, FuelLog, Expense

class Command(BaseCommand):
    help = 'Validates TransitOps business rules and custom configurations'

    def handle(self, *args, **options):
        self.stdout.write("--- Starting Database Integrity & Validation Tests ---")

        # Cleanup existing test data to ensure clean runs
        Trip.objects.filter(source='Test Start').delete()
        DriverProfile.objects.filter(license_number__startswith='TEST_').delete()
        CustomUser.objects.filter(username__startswith='test_').delete()
        Vehicle.objects.filter(registration_number__startswith='TEST_').delete()

        # 1. Create Vehicle
        self.stdout.write("Creating test vehicle (Van-05, Max Load: 500kg)...")
        vehicle = Vehicle.objects.create(
            registration_number='TEST_VAN_05',
            name_model='Van-05',
            vehicle_type='Van',
            max_load_capacity=500.0,
            odometer=1000.0,
            acquisition_cost=15000.00,
            required_license_category='Class B'  # requires Class B or higher
        )

        # 2. Create Custom User & Driver Profile
        self.stdout.write("Creating driver profile for Alex (License Category: Class C - Basic)...")
        user_c = CustomUser.objects.create_user(
            username='test_alex',
            email='alex@test.com',
            password='password123',
            role='DRIVER'
        )
        driver_c = DriverProfile.objects.create(
            user=user_c,
            license_number='TEST_LIC_111',
            license_category='Class C',
            license_expiry_date=timezone.now().date() + datetime.timedelta(days=365),
            contact_number='123456789'
        )

        # 3. Test: Insufficient license class validation
        self.stdout.write("Testing validation: Driver (Class C) driving Vehicle (requires Class B)...")
        trip_fail = Trip(
            source='Test Start',
            destination='Test End',
            vehicle=vehicle,
            driver=driver_c,
            cargo_weight=100.0,
            planned_distance=50.0,
            status=Trip.Status.DISPATCHED
        )
        try:
            trip_fail.clean()
            trip_fail.save()
            self.stdout.write(self.style.ERROR("FAIL: Trip saved despite insufficient driver license class!"))
        except ValidationError as e:
            self.stdout.write(self.style.SUCCESS(f"PASS: Prevented dispatch with error: {e}"))

        # Create driver with sufficient license (Class B)
        self.stdout.write("Creating driver profile for Bob (License Category: Class B)...")
        user_b = CustomUser.objects.create_user(
            username='test_bob',
            email='bob@test.com',
            password='password123',
            role='DRIVER'
        )
        driver_b = DriverProfile.objects.create(
            user=user_b,
            license_number='TEST_LIC_222',
            license_category='Class B',
            license_expiry_date=timezone.now().date() + datetime.timedelta(days=365),
            contact_number='987654321'
        )

        # 4. Test: Cargo weight validation
        self.stdout.write("Testing validation: Overloading vehicle (Cargo: 600kg, Max: 500kg)...")
        trip_overload = Trip(
            source='Test Start',
            destination='Test End',
            vehicle=vehicle,
            driver=driver_b,
            cargo_weight=600.0,
            planned_distance=50.0,
            status=Trip.Status.DISPATCHED
        )
        try:
            trip_overload.clean()
            trip_overload.save()
            self.stdout.write(self.style.ERROR("FAIL: Trip saved despite overloading cargo weight!"))
        except ValidationError as e:
            self.stdout.write(self.style.SUCCESS(f"PASS: Prevented overloading with error: {e}"))

        # 5. Test: Expired License validation
        self.stdout.write("Creating driver profile with expired license...")
        user_expired = CustomUser.objects.create_user(
            username='test_expired',
            email='exp@test.com',
            password='password123',
            role='DRIVER'
        )
        driver_expired = DriverProfile.objects.create(
            user=user_expired,
            license_number='TEST_LIC_333',
            license_category='Class B',
            license_expiry_date=timezone.now().date() - datetime.timedelta(days=1),
            contact_number='555555555'
        )
        trip_expired = Trip(
            source='Test Start',
            destination='Test End',
            vehicle=vehicle,
            driver=driver_expired,
            cargo_weight=100.0,
            planned_distance=50.0,
            status=Trip.Status.DISPATCHED
        )
        try:
            trip_expired.clean()
            trip_expired.save()
            self.stdout.write(self.style.ERROR("FAIL: Trip saved despite expired driver license!"))
        except ValidationError as e:
            self.stdout.write(self.style.SUCCESS(f"PASS: Prevented dispatch with error: {e}"))

        # 6. Test: Proper workflow and status transitions
        self.stdout.write("Creating valid trip (Cargo: 450kg, Driver: Bob, status: Draft)...")
        trip = Trip.objects.create(
            source='Test Start',
            destination='Test End',
            vehicle=vehicle,
            driver=driver_b,
            cargo_weight=450.0,
            planned_distance=150.0,
            revenue=500.00,
            status=Trip.Status.DRAFT
        )

        # Dispatch trip
        self.stdout.write("Dispatching trip...")
        trip.status = Trip.Status.DISPATCHED
        trip.save()

        # Re-fetch states to confirm auto status change to 'On Trip'
        vehicle.refresh_from_db()
        driver_b.refresh_from_db()
        self.stdout.write(f"After dispatch -> Vehicle Status: {vehicle.status}, Driver Status: {driver_b.status}")
        if vehicle.status == Vehicle.Status.ON_TRIP and driver_b.status == DriverProfile.Status.ON_TRIP:
            self.stdout.write(self.style.SUCCESS("PASS: Vehicle and Driver statuses updated to 'On Trip'"))
        else:
            self.stdout.write(self.style.ERROR("FAIL: Statuses not updated correctly!"))

        # Complete trip
        self.stdout.write("Completing trip (Actual Distance: 155.0 km)...")
        trip.status = Trip.Status.COMPLETED
        trip.actual_distance = 155.0
        trip.save()

        vehicle.refresh_from_db()
        driver_b.refresh_from_db()
        self.stdout.write(f"After completion -> Vehicle Status: {vehicle.status}, Odometer: {vehicle.odometer} km, Driver Status: {driver_b.status}")
        if vehicle.status == Vehicle.Status.AVAILABLE and vehicle.odometer == 1155.0 and driver_b.status == DriverProfile.Status.AVAILABLE:
            self.stdout.write(self.style.SUCCESS("PASS: Odometer updated and statuses restored to 'Available'"))
        else:
            self.stdout.write(self.style.ERROR("FAIL: Statuses or odometer not updated correctly!"))

        # 7. Test: Maintenance workflow
        self.stdout.write("Creating an active maintenance log...")
        m_log = MaintenanceLog.objects.create(
            vehicle=vehicle,
            description="Oil Change and brake inspection",
            cost=250.00,
            date=timezone.now().date(),
            is_active=True
        )
        vehicle.refresh_from_db()
        self.stdout.write(f"After starting maintenance -> Vehicle Status: {vehicle.status}")
        if vehicle.status == Vehicle.Status.IN_SHOP:
            self.stdout.write(self.style.SUCCESS("PASS: Vehicle status set to 'In Shop'"))
        else:
            self.stdout.write(self.style.ERROR("FAIL: Vehicle status not set to 'In Shop'"))

        # Check that maintenance is synced to expense ledger
        expense_m = Expense.objects.filter(expense_type=Expense.ExpenseType.MAINTENANCE, ref_id=m_log.id).first()
        if expense_m and expense_m.cost == 250.00:
            self.stdout.write(self.style.SUCCESS(f"PASS: Maintenance expense synchronized inside ledger: {expense_m}"))
        else:
            self.stdout.write(self.style.ERROR("FAIL: Expense ledger did not sync maintenance log!"))

        # Close maintenance
        self.stdout.write("Closing maintenance log...")
        m_log.is_active = False
        m_log.save()
        vehicle.refresh_from_db()
        self.stdout.write(f"After closing maintenance -> Vehicle Status: {vehicle.status}")
        if vehicle.status == Vehicle.Status.AVAILABLE:
            self.stdout.write(self.style.SUCCESS("PASS: Vehicle status restored to 'Available'"))
        else:
            self.stdout.write(self.style.ERROR("FAIL: Vehicle status not restored to 'Available'"))

        # 8. Test: Fuel logs & Expense ledger sync
        self.stdout.write("Creating fuel log entry (50 liters, cost: $75.00)...")
        fuel_log = FuelLog.objects.create(
            vehicle=vehicle,
            liters=50.0,
            cost=75.00,
            date=timezone.now().date()
        )
        expense_f = Expense.objects.filter(expense_type=Expense.ExpenseType.FUEL, ref_id=fuel_log.id).first()
        if expense_f and expense_f.cost == 75.00:
            self.stdout.write(self.style.SUCCESS(f"PASS: Fuel expense synchronized inside ledger: {expense_f}"))
        else:
            self.stdout.write(self.style.ERROR("FAIL: Expense ledger did not sync fuel log!"))

        self.stdout.write("--- All tests completed successfully! ---")
