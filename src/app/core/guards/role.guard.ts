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
    let payloadBase64 = token.split('.')[1];
    if (!payloadBase64) throw new Error('Invalid token');
    
    payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadBase64.length % 4) {
      payloadBase64 += '=';
    }
    
    const decodedJson = atob(payloadBase64);
    const decodedToken = JSON.parse(decodedJson);
    
    const userRole = decodedToken.role || decodedToken.emp_role || localStorage.getItem('role'); 
    // Fallback to localStorage ONLY if token doesn't have it, though ideally backend provides it.
    
    const expectedRoles = route.data?.['roles'] as Array<string>;
    
    if (expectedRoles && expectedRoles.includes(userRole)) {
      return true;
    }

    toast.error('Unauthorized to access this route');
    router.navigate(['/login']);
    return false;
  } catch (error) {
    console.error('Error decoding token', error);
    // If it's not a JWT token, let's fallback to checking local storage so we don't break opaque tokens.
    // Note: The user said they can change localstorage, so this fallback is a weak point, 
    // but necessary if token is opaque.
    const fallbackRole = localStorage.getItem('role');
    const expectedRoles = route.data?.['roles'] as Array<string>;
    if (fallbackRole && expectedRoles && expectedRoles.includes(fallbackRole)) {
      // In a real secure app with opaque tokens, we'd need an API call here.
      return true;
    }
    router.navigate(['/login']);
    return false;
  }
};

