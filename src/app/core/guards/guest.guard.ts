import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  if (token) {
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
  
          if (userRole === 'admin') {
            router.navigate(['/admin/dashboard']);
            return false;
          } else if (userRole === 'sr-dev' || userRole === 'jr-dev' || userRole === 'dev') {
            router.navigate(['/developer/dashboard']);
            return false;
          }
        }
      } else {
        // Fallback for opaque token scenario
        const fallbackRole = localStorage.getItem('role');
        if (fallbackRole === 'admin') {
          router.navigate(['/admin/dashboard']);
          return false;
        } else if (fallbackRole === 'sr-dev' || fallbackRole === 'jr-dev' || fallbackRole === 'dev') {
          router.navigate(['/developer/dashboard']);
          return false;
        }
      }
    } catch (e) {
      // If decoding fails
      const fallbackRole = localStorage.getItem('role');
      if (fallbackRole === 'admin') {
        router.navigate(['/admin/dashboard']);
        return false;
      } else if (fallbackRole === 'sr-dev' || fallbackRole === 'jr-dev' || fallbackRole === 'dev') {
        router.navigate(['/developer/dashboard']);
        return false;
      }
    }
    
    // If token exists but role is unknown, clear invalid session and allow them to log in again.
    localStorage.clear();
    return true;
  }

  // Allow access to login page
  return true;
};
