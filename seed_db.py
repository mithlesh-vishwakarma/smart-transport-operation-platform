import os
import datetime
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'TransitOps.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import UserRole
from fleet.models import Vehicle, DriverProfile, Trip, MaintenanceLog, FuelLog, Expense

User = get_user_model()

def seed():
    print("Clearing existing database records...")
    Expense.objects.all().delete()
    FuelLog.objects.all().delete()
    MaintenanceLog.objects.all().delete()
    Trip.objects.all().delete()
    DriverProfile.objects.all().delete()
    Vehicle.objects.all().delete()
    User.objects.all().delete()

    print("Creating admin and staff users...")
    # Standard admin/management accounts
    manager_user = User.objects.create_user(
        username="manager",
        email="manager@transitops.in",
        password="password",
        role=UserRole.FLEET_MANAGER
    )
    dispatcher_user = User.objects.create_user(
        username="dispatcher",
        email="raven.k@transitops.in",
        password="password",
        role=UserRole.DISPATCHER
    )
    safety_user = User.objects.create_user(
        username="safety",
        email="safety@transitops.in",
        password="password",
        role=UserRole.SAFETY_OFFICER
    )
    analyst_user = User.objects.create_user(
        username="analyst",
        email="analyst@transitops.in",
        password="password",
        role=UserRole.FINANCIAL_ANALYST
    )

    print("Creating vehicle fleet...")
    #GJ01AB4521
    v1 = Vehicle.objects.create(
        registration_number="GJ01AB4521",
        name_model="VAN-05",
        vehicle_type="Van",
        max_load_capacity=500.0,
        odometer=74000.0,
        acquisition_cost=620000.0,
        status=Vehicle.Status.AVAILABLE,
        required_license_category="Class C"
    )
    #GJ01AB9981
    v2 = Vehicle.objects.create(
        registration_number="GJ01AB9981",
        name_model="TRUCK-11",
        vehicle_type="Truck",
        max_load_capacity=5000.0,
        odometer=182000.0,
        acquisition_cost=2450000.0,
        status=Vehicle.Status.AVAILABLE,
        required_license_category="Class A"
    )
    #GJ01AB1120
    v3 = Vehicle.objects.create(
        registration_number="GJ01AB1120",
        name_model="MINI-03",
        vehicle_type="Mini",
        max_load_capacity=1000.0,
        odometer=66000.0,
        acquisition_cost=41000.0,
        status=Vehicle.Status.IN_SHOP,
        required_license_category="Class C"
    )
    #GJ01AB0008
    v4 = Vehicle.objects.create(
        registration_number="GJ01AB0008",
        name_model="VAN-09",
        vehicle_type="Van",
        max_load_capacity=750.0,
        odometer=241900.0,
        acquisition_cost=590000.0,
        status=Vehicle.Status.RETIRED,
        required_license_category="Class C"
    )
    #GJ01AB2201
    v5 = Vehicle.objects.create(
        registration_number="GJ01AB2201",
        name_model="TRUCK-04",
        vehicle_type="Truck",
        max_load_capacity=8000.0,
        odometer=98000.0,
        acquisition_cost=3100000.0,
        status=Vehicle.Status.AVAILABLE,
        required_license_category="Class A"
    )
    #GJ01AB3310
    v6 = Vehicle.objects.create(
        registration_number="GJ01AB3310",
        name_model="MINI-08",
        vehicle_type="Mini",
        max_load_capacity=800.0,
        odometer=42000.0,
        acquisition_cost=380000.0,
        status=Vehicle.Status.AVAILABLE,
        required_license_category="Class C"
    )

    print("Creating driver users and profiles...")
    # Alex
    alex_user = User.objects.create_user(
        username="Alex",
        email="alex@transitops.in",
        password="password",
        role=UserRole.DRIVER
    )
    d1 = DriverProfile.objects.create(
        user=alex_user,
        license_number="GJ14-2019-88421",
        license_category="Class C",
        license_expiry_date=datetime.date(2027, 11, 12),
        contact_number="9876543421",
        safety_score=92.0,
        status=DriverProfile.Status.AVAILABLE
    )

    # John
    john_user = User.objects.create_user(
        username="John",
        email="john@transitops.in",
        password="password",
        role=UserRole.DRIVER
    )
    d2 = DriverProfile.objects.create(
        user=john_user,
        license_number="GJ14-2018-11209",
        license_category="Class A",
        license_expiry_date=datetime.date(2025, 6, 1),
        contact_number="9765432108",
        safety_score=74.0,
        status=DriverProfile.Status.SUSPENDED
    )

    # Priya
    priya_user = User.objects.create_user(
        username="Priya",
        email="priya@transitops.in",
        password="password",
        role=UserRole.DRIVER
    )
    d3 = DriverProfile.objects.create(
        user=priya_user,
        license_number="GJ14-2020-55102",
        license_category="Class A",
        license_expiry_date=datetime.date(2028, 3, 20),
        contact_number="9654321552",
        safety_score=88.0,
        status=DriverProfile.Status.AVAILABLE
    )

    # Suresh
    suresh_user = User.objects.create_user(
        username="Suresh",
        email="suresh@transitops.in",
        password="password",
        role=UserRole.DRIVER
    )
    d4 = DriverProfile.objects.create(
        user=suresh_user,
        license_number="GJ14-2017-33018",
        license_category="Class A",
        license_expiry_date=datetime.date(2027, 1, 15),
        contact_number="9543210019",
        safety_score=85.0,
        status=DriverProfile.Status.OFF_DUTY
    )

    print("Creating trips...")
    # TR001
    Trip.objects.create(
        source="Gandhinagar Depot",
        destination="Ahmedabad Hub",
        vehicle=v2,
        driver=d3,
        cargo_weight=3200.0,
        planned_distance=45.0,
        status=Trip.Status.DISPATCHED,
        revenue=9200.0
    )
    # TR002
    Trip.objects.create(
        source="Vatva Industrial Area",
        destination="Sanand Warehouse",
        vehicle=v1,
        driver=d1,
        cargo_weight=420.0,
        planned_distance=38.0,
        status=Trip.Status.COMPLETED,
        actual_distance=38.0,
        revenue=8500.0
    )
    # TR004
    Trip.objects.create(
        source="Vatva Industrial Area",
        destination="Sanand Warehouse",
        vehicle=v5,
        driver=d4,
        cargo_weight=5100.0,
        planned_distance=52.0,
        status=Trip.Status.DRAFT,
        revenue=12000.0
    )
    # TR006
    Trip.objects.create(
        source="Mansa",
        destination="Kalol Depot",
        vehicle=v6,
        driver=d2,
        cargo_weight=1200.0,
        planned_distance=22.0,
        status=Trip.Status.CANCELLED,
        revenue=0.0
    )

    print("Creating maintenance records...")
    MaintenanceLog.objects.create(
        vehicle=v3,
        description="Tyre Replace",
        cost=6200.00,
        date=timezone.now().date() - timezone.timedelta(days=7),
        is_active=True
    )
    MaintenanceLog.objects.create(
        vehicle=v2,
        description="Engine Repair",
        cost=18000.00,
        date=timezone.now().date() - timezone.timedelta(days=14),
        is_active=False
    )
    MaintenanceLog.objects.create(
        vehicle=v1,
        description="Oil Change",
        cost=2500.00,
        date=timezone.now().date() - timezone.timedelta(days=11),
        is_active=False
    )

    print("Creating fuel logs...")
    FuelLog.objects.create(
        vehicle=v1,
        liters=42.0,
        cost=3150.00,
        date=timezone.now().date() - timezone.timedelta(days=7)
    )
    FuelLog.objects.create(
        vehicle=v2,
        liters=110.0,
        cost=8400.00,
        date=timezone.now().date() - timezone.timedelta(days=8)
    )
    FuelLog.objects.create(
        vehicle=v6,
        liters=28.0,
        cost=2100.00,
        date=timezone.now().date() - timezone.timedelta(days=9)
    )

    print("Creating additional manual expenses...")
    # Toll charges
    Expense.objects.create(
        vehicle=v2,
        expense_type=Expense.ExpenseType.TOLL,
        cost=180.00,
        description="Trip TR001 Toll Charge",
        date=timezone.now().date() - timezone.timedelta(days=7)
    )
    Expense.objects.create(
        vehicle=v2,
        expense_type=Expense.ExpenseType.OTHER,
        cost=120.00,
        description="Trip TR001 Miscellaneous fees",
        date=timezone.now().date() - timezone.timedelta(days=7)
    )
    Expense.objects.create(
        vehicle=v1,
        expense_type=Expense.ExpenseType.TOLL,
        cost=90.00,
        description="Trip TR002 Toll Charge",
        date=timezone.now().date() - timezone.timedelta(days=10)
    )
    Expense.objects.create(
        vehicle=v1,
        expense_type=Expense.ExpenseType.OTHER,
        cost=50.00,
        description="Trip TR002 Miscellaneous fees",
        date=timezone.now().date() - timezone.timedelta(days=10)
    )

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
