from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Custom permission to allow only owners of an object to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Check if the object has a user attribute and if that matches the request user
        return hasattr(obj, 'user') and obj.user == request.user


class IsNotary(permissions.BasePermission):
    """
    Permission to allow only users with role 'notary' to access the view.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'notary'


class IsUser(permissions.BasePermission):
    """
    Permission to allow only users with role 'user' to access the view.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'user'


class IsNotaryOrOwner(permissions.BasePermission):
    """
    Permission to allow both the notary assigned to a request and the owner of the request.
    """
    
    def has_object_permission(self, request, view, obj):
        # Allow notaries assigned to this request
        if request.user.role == 'notary' and hasattr(obj, 'notary') and obj.notary == request.user:
            return True
            
        # Allow owners of the request
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
            
        return False


class IsAdmin(permissions.BasePermission):
    """
    Permission to allow only users with role 'admin'.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'