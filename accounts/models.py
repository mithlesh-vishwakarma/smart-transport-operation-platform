from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    FLEET_MANAGER = 'FLEET_MANAGER', 'Fleet Manager'
    DRIVER = 'DRIVER', 'Driver'
    SAFETY_OFFICER = 'SAFETY_OFFICER', 'Safety Officer'
    FINANCIAL_ANALYST = 'FINANCIAL_ANALYST', 'Financial Analyst'

class CustomUser(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.FLEET_MANAGER
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

