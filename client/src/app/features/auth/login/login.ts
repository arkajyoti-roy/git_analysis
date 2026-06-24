import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';

  isLoading = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toast: ToastService
  ) { }

  login() {

    if (!this.email || !this.password) {
      this.toast.warning('Please enter email and password');
      return;
    }

    this.isLoading = true;

    const payload = {
      emp_email: this.email,
      emp_pass: this.password
    };

    this.http.post(
      `${CONFIG.BASE_URL}/auth/login`,
      payload
    ).subscribe({

      next: (response: any) => {

        this.isLoading = false;

        if (response.success) {

          localStorage.setItem(
            'token',
            response.data.token
          );

          localStorage.setItem(
            'emp_id',
            response.data.emp_id
          );

          localStorage.setItem(
            'emp_name',
            response.data.emp_name
          );

          localStorage.setItem(
            'emp_email',
            response.data.emp_email
          );

          localStorage.setItem(
            'role',
            response.data.emp_role
          );

          // Fetch the full details from /details/show to see if they've completed the profile
          this.http.get(`${CONFIG.BASE_URL}/details/show?emp_id=${response.data.emp_id}`).subscribe({
            next: (profileRes: any) => {
              let profile = profileRes;
              if (profileRes.data && profileRes.data.emp_id) profile = profileRes.data;
              else if (profileRes.user && profileRes.user.emp_id) profile = profileRes.user;
              else if (profileRes.employee && profileRes.employee.emp_id) profile = profileRes.employee;
              else if (Array.isArray(profileRes) && profileRes.length > 0) profile = profileRes[0];
              else if (profileRes.data && Array.isArray(profileRes.data) && profileRes.data.length > 0) profile = profileRes.data[0];
              else if (profileRes.data) profile = profileRes.data;

              // Check if profile details are populated

              // Check if ANY of the additional profile details exist
              const isProfileComplete = profile && (
                profile.emp_phone ||
                profile.emp_address ||
                profile.emp_position ||
                profile.emp_blood_group ||
                profile.emp_doj ||
                profile.emp_tenure
              );

              if (isProfileComplete) {
                localStorage.setItem('profile_completed', 'true');
                if (response.data.emp_role === 'admin') {
                  this.router.navigate(['/admin-dashboard']);
                } else {
                  this.router.navigate(['/developer/dashboard']);
                }
              } else {
                // Profile incomplete
                localStorage.setItem('profile_completed', 'false');
                this.router.navigate(['/complete-profile']);
              }
            },
            error: () => {
              // If fetching profile fails or it's not found, assume incomplete
              localStorage.setItem('profile_completed', 'false');
              this.router.navigate(['/complete-profile']);
            }
          });

        } else {

          this.toast.error(response.message || 'Login Failed');

        }

      },

      error: (error) => {

        this.isLoading = false;

        console.error(error);

        this.toast.error(error?.error?.message || 'Login Failed');

      }

    });

  }

}