import datetime
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from fleet.models import DriverProfile

class Command(BaseCommand):
    help = 'Sends email reminders to drivers whose licenses are expiring within the next 30 days.'

    def handle(self, *args, **options):
        today = timezone.localdate()
        limit = today + datetime.timedelta(days=30)
        
        # Filter active or available drivers whose licenses expire between today and next 30 days
        expiring_drivers = DriverProfile.objects.filter(
            license_expiry_date__gte=today,
            license_expiry_date__lte=limit
        )

        self.stdout.write(self.style.NOTICE(f"Checking licenses on {today}... Found {expiring_drivers.count()} expiring licenses."))

        for driver in expiring_drivers:
            days_left = (driver.license_expiry_date - today).days
            email_body = (
                f"Hello {driver.user.username},\n\n"
                f"This is a compliance reminder that your commercial driving license ({driver.license_number}) "
                f"is expiring on {driver.license_expiry_date} ({days_left} days remaining).\n\n"
                f"Please update your license details and submit the documents to your Fleet Manager as soon as possible "
                f"to prevent dispatch suspension.\n\n"
                f"Best regards,\n"
                f"TransitOps Compliance Team"
            )
            
            # Send email (prints to console per EMAIL_BACKEND setup)
            send_mail(
                subject=f"URGENT: Commercial Driver License Expiry Warning ({days_left} Days Remaining)",
                message=email_body,
                from_email='compliance@transitops.in',
                recipient_list=[driver.user.email or 'driver@transitops.in'],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS(f"Sent CDL expiry reminder email to {driver.user.username} ({driver.user.email})"))

        self.stdout.write(self.style.SUCCESS("CDL reminder run completed successfully!"))
