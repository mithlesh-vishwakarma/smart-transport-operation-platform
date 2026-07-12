from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Simple license hierarchy: Class A can drive everything, C is basic
LICENSE_HIERARCHY = {'Class A': 3, 'Class B': 2, 'Class C': 1}

class Vehicle(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'Available', 'Available'
        ON_TRIP = 'On Trip', 'On Trip'
        IN_SHOP = 'In Shop', 'In Shop'
        RETIRED = 'Retired', 'Retired'

    registration_number = models.CharField(max_length=50, unique=True)
    name_model = models.CharField(max_length=100)
    vehicle_type = models.CharField(max_length=50)  # e.g., Van, Truck, Sedan
    max_load_capacity = models.FloatField()  # in kg
    odometer = models.FloatField(default=0.0)  # in km
    acquisition_cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    
    # Premium features
    required_license_category = models.CharField(max_length=20, default='Class C')
    next_service_odometer = models.FloatField(default=5000.0)

    def needs_service(self):
        return self.odometer >= self.next_service_odometer

    def __str__(self):
        return f"{self.registration_number} - {self.name_model} ({self.status})"


class DriverProfile(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'Available', 'Available'
        ON_TRIP = 'On Trip', 'On Trip'
        OFF_DUTY = 'Off Duty', 'Off Duty'
        SUSPENDED = 'Suspended', 'Suspended'

    user = models.OneToOneField('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'role': 'DRIVER'})
    license_number = models.CharField(max_length=50, unique=True)
    license_category = models.CharField(max_length=20, default='Class C')  # Class A, B, or C
    license_expiry_date = models.DateField()
    contact_number = models.CharField(max_length=20)
    safety_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)

    def is_license_expired(self):
        return self.license_expiry_date < timezone.now().date()

    def __str__(self):
        return f"{self.user.username} ({self.status})"


class Trip(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        DISPATCHED = 'Dispatched', 'Dispatched'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'

    source = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT)
    driver = models.ForeignKey(DriverProfile, on_delete=models.PROTECT)
    cargo_weight = models.FloatField()
    planned_distance = models.FloatField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Premium metric extensions
    actual_distance = models.FloatField(null=True, blank=True)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def clean(self):
        # Perform validation only if we are dispatching or editing a dispatched trip
        if self.status == self.Status.DISPATCHED:
            # 1. Check cargo capacity
            if self.cargo_weight > self.vehicle.max_load_capacity:
                raise ValidationError(f"Cargo weight ({self.cargo_weight}kg) exceeds vehicle max load capacity ({self.vehicle.max_load_capacity}kg).")

            # 2. Check if vehicle is ready/available (ignoring current trip assignment)
            if self.vehicle.status in [Vehicle.Status.IN_SHOP, Vehicle.Status.RETIRED]:
                raise ValidationError(f"Vehicle is currently {self.vehicle.status} and cannot be dispatched.")
            
            # Prevent double booking: check if vehicle is on another active dispatch
            other_vehicle_trips = Trip.objects.filter(vehicle=self.vehicle, status=self.Status.DISPATCHED).exclude(pk=self.pk)
            if other_vehicle_trips.exists() or (self.vehicle.status == Vehicle.Status.ON_TRIP and not self.pk):
                raise ValidationError("Vehicle is already assigned to an active trip.")

            # 3. Check driver compliance
            if self.driver.status == DriverProfile.Status.SUSPENDED:
                raise ValidationError("Cannot assign trip: Driver is suspended.")
            
            if self.driver.is_license_expired():
                raise ValidationError(f"Cannot assign trip: Driver's license expired on {self.driver.license_expiry_date}.")

            # Prevent double booking for driver
            other_driver_trips = Trip.objects.filter(driver=self.driver, status=self.Status.DISPATCHED).exclude(pk=self.pk)
            if other_driver_trips.exists() or (self.driver.status == DriverProfile.Status.ON_TRIP and not self.pk):
                raise ValidationError("Driver is already assigned to an active trip.")

            # 4. License category compatibility check
            driver_lvl = LICENSE_HIERARCHY.get(self.driver.license_category, 0)
            vehicle_lvl = LICENSE_HIERARCHY.get(self.vehicle.required_license_category, 1)
            if driver_lvl < vehicle_lvl:
                raise ValidationError(
                    f"Driver license level ({self.driver.license_category}) is insufficient "
                    f"for vehicle requirements ({self.vehicle.required_license_category})."
                )

    def save(self, *args, **kwargs):
        # Capture original state before saving to DB
        old_status = None
        old_vehicle = None
        old_driver = None
        if self.pk:
            try:
                orig = Trip.objects.get(pk=self.pk)
                old_status = orig.status
                old_vehicle = orig.vehicle
                old_driver = orig.driver
            except Trip.DoesNotExist:
                pass

        # Validate when transition is happening or when reassignment is done on active dispatch
        if self.status == self.Status.DISPATCHED:
            if old_status != self.Status.DISPATCHED or old_vehicle != self.vehicle or old_driver != self.driver:
                self.clean()

        super().save(*args, **kwargs)

        # Trigger automatic status switches
        if self.status == self.Status.DISPATCHED:
            # 1. Update current vehicle/driver to ON_TRIP
            if self.vehicle.status != Vehicle.Status.ON_TRIP:
                self.vehicle.status = Vehicle.Status.ON_TRIP
                self.vehicle.save(update_fields=['status'])
            if self.driver.status != DriverProfile.Status.ON_TRIP:
                self.driver.status = DriverProfile.Status.ON_TRIP
                self.driver.save(update_fields=['status'])

            # 2. Reset old vehicle if it was reassigned
            if old_vehicle and old_vehicle != self.vehicle:
                other = Trip.objects.filter(vehicle=old_vehicle, status=self.Status.DISPATCHED).exclude(pk=self.pk)
                if not other.exists():
                    old_vehicle.status = Vehicle.Status.AVAILABLE
                    old_vehicle.save(update_fields=['status'])

            # 3. Reset old driver if it was reassigned
            if old_driver and old_driver != self.driver:
                other = Trip.objects.filter(driver=old_driver, status=self.Status.DISPATCHED).exclude(pk=self.pk)
                if not other.exists():
                    old_driver.status = DriverProfile.Status.AVAILABLE
                    old_driver.save(update_fields=['status'])

            if old_status != self.status:
                TripStatusHistory.objects.create(trip=self, from_status=old_status or 'Draft', to_status=self.status)

        elif self.status == self.Status.COMPLETED and old_status == self.Status.DISPATCHED:
            # Trip completion
            self.vehicle.status = Vehicle.Status.AVAILABLE
            dist = self.actual_distance if self.actual_distance is not None else self.planned_distance
            self.vehicle.odometer += dist
            self.vehicle.save(update_fields=['status', 'odometer'])
            
            self.driver.status = DriverProfile.Status.AVAILABLE
            self.driver.save(update_fields=['status'])
            TripStatusHistory.objects.create(trip=self, from_status=old_status, to_status=self.status)

        elif self.status == self.Status.CANCELLED and old_status == self.Status.DISPATCHED:
            # Trip cancellation
            self.vehicle.status = Vehicle.Status.AVAILABLE
            self.vehicle.save(update_fields=['status'])
            self.driver.status = DriverProfile.Status.AVAILABLE
            self.driver.save(update_fields=['status'])
            TripStatusHistory.objects.create(trip=self, from_status=old_status, to_status=self.status)

    def __str__(self):
        return f"Trip {self.id}: {self.source} -> {self.destination} ({self.status})"


class MaintenanceLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    description = models.TextField()
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.localdate)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Put vehicle in maintenance shop if active, restore to available if resolved
        if self.is_active:
            if self.vehicle.status != Vehicle.Status.IN_SHOP:
                self.vehicle.status = Vehicle.Status.IN_SHOP
                self.vehicle.save(update_fields=['status'])
        else:
            if self.vehicle.status == Vehicle.Status.IN_SHOP:
                # Restore to available (if not retired)
                if self.vehicle.status != Vehicle.Status.RETIRED:
                    self.vehicle.status = Vehicle.Status.AVAILABLE
                    self.vehicle.save(update_fields=['status'])

    def __str__(self):
        state = "Active" if self.is_active else "Closed"
        return f"{self.vehicle.registration_number} - {self.description[:30]} ({state})"


class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    liters = models.FloatField()
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.localdate)

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.liters}L ({self.date})"


class Expense(models.Model):
    class ExpenseType(models.TextChoices):
        TOLL = 'Toll', 'Toll'
        MAINTENANCE = 'Maintenance', 'Maintenance'
        FUEL = 'Fuel', 'Fuel'
        OTHER = 'Other', 'Other'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    expense_type = models.CharField(max_length=50, choices=ExpenseType.choices)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField(default=timezone.localdate)
    
    # Audit log dynamic reference mapping
    ref_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.expense_type}: ${self.cost}"


class VehicleDocument(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='documents')
    document_name = models.CharField(max_length=100)
    document_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    file_path = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.document_name}"


class TripStatusHistory(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='history')
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Trip {self.trip_id} status changed from {self.from_status} to {self.to_status}"


# --- Signals to sync logs to consolidated Expense Ledger ---

@receiver(post_save, sender=FuelLog)
def sync_fuel_expense(sender, instance, created, **kwargs):
    Expense.objects.update_or_create(
        expense_type=Expense.ExpenseType.FUEL,
        ref_id=instance.id,
        defaults={
            'vehicle': instance.vehicle,
            'cost': instance.cost,
            'description': f"Fuel entry: {instance.liters} liters.",
            'date': instance.date
        }
    )

@receiver(post_delete, sender=FuelLog)
def remove_fuel_expense(sender, instance, **kwargs):
    Expense.objects.filter(expense_type=Expense.ExpenseType.FUEL, ref_id=instance.id).delete()

@receiver(post_save, sender=MaintenanceLog)
def sync_maintenance_expense(sender, instance, created, **kwargs):
    Expense.objects.update_or_create(
        expense_type=Expense.ExpenseType.MAINTENANCE,
        ref_id=instance.id,
        defaults={
            'vehicle': instance.vehicle,
            'cost': instance.cost,
            'description': f"Maintenance entry: {instance.description}",
            'date': instance.date
        }
    )

@receiver(post_delete, sender=MaintenanceLog)
def remove_maintenance_expense(sender, instance, **kwargs):
    Expense.objects.filter(expense_type=Expense.ExpenseType.MAINTENANCE, ref_id=instance.id).delete()

