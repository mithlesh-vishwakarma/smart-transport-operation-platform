from rest_framework import permissions
from .models import UserRole

class IsFleetManagerOrReadOnly(permissions.BasePermission):
    """
    Allow read-only requests for any authenticated user.
    Restrict write actions to users with the FLEET_MANAGER role.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Read-only methods (GET, HEAD, OPTIONS) are safe
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == UserRole.FLEET_MANAGER
