import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { CONFIG } from '../../../config/config';

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
    private http: HttpClient
  ) {}

  login() {

    if (!this.email || !this.password) {
      alert('Please enter email and password');
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

          if (response.data.emp_role === 'admin') {

            this.router.navigate([
              '/admin-dashboard'
            ]);

          } else {

            this.router.navigate([
              '/developer/dashboard'
            ]);

          }

        } else {

          alert(
            response.message ||
            'Login Failed'
          );

        }

      },

      error: (error) => {

        this.isLoading = false;

        console.error(error);

        alert(
          error?.error?.message ||
          'Login Failed'
        );

      }

    });

  }

}