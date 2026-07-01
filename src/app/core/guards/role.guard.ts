import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = localStorage.getItem('token');
  
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    if (token.split('.').length === 3) {
      let payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        while (payloadBase64.length % 4) {
          payloadBase64 += '=';
        }
        
        const decodedJson = atob(payloadBase64);
        const decodedToken = JSON.parse(decodedJson);
        
        const userRole = decodedToken.role || decodedToken.emp_role || localStorage.getItem('role'); 
        const expectedRoles = route.data?.['roles'] as Array<string>;
        
        if (expectedRoles && expectedRoles.includes(userRole)) {
          return true;
        }
      }
    } else {
      // Opaque token fallback
      const fallbackRole = localStorage.getItem('role');
      const expectedRoles = route.data?.['roles'] as Array<string>;
      if (fallbackRole && expectedRoles && expectedRoles.includes(fallbackRole)) {
        return true;
      }
    }

    toast.error('Unauthorized to access this route');
    router.navigate(['/login']);
    return false;
  } catch (error) {
    // If decoding completely fails for some reason
    const fallbackRole = localStorage.getItem('role');
    const expectedRoles = route.data?.['roles'] as Array<string>;
    if (fallbackRole && expectedRoles && expectedRoles.includes(fallbackRole)) {
      return true;
    }
    router.navigate(['/login']);
    return false;
  }
};

