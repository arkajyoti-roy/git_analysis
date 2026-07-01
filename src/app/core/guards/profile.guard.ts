import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const profileGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Check if profile is completed locally (we set this on login or after completing profile)
  const isCompleted = localStorage.getItem('profile_completed');
  
  if (isCompleted === 'true') {
    return true;
  }
  
  // If not completed or unknown, force them to complete profile.
  // The login flow checks the backend first. If they get here without the flag, redirect.
  router.navigate(['/complete-profile']);
  return false;
};
