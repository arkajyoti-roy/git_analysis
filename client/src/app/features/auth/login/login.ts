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

  // login() {

  //   if (!this.email || !this.password) {
  //     alert('Please enter email and password');
  //     return;
  //   }

  //   this.isLoading = true;

  //   const payload = {
  //     email: this.email,
  //     password: this.password
  //   };

  //   this.http.post(
  //     `${CONFIG.BASE_URL}/admin/login`,
  //     payload
  //   )
  //   .subscribe({

  //     next: (response: any) => {

  //       this.isLoading = false;

  //       localStorage.setItem(
  //         'token',
  //         response.token
  //       );

  //       localStorage.setItem(
  //         'role',
  //         response.role
  //       );

  //       if (response.role === 'admin') {

  //         this.router.navigate([
  //           '/admin-dashboard'
  //         ]);

  //         return;
  //       }

  //       if (
  //         response.role === 'senior-dev' ||
  //         response.role === 'junior-dev'
  //       ) {

  //         this.router.navigate([
  //           '/developer/dashboard'
  //         ]);

  //         return;
  //       }

  //       alert('Role not recognized');

  //     },

  //     error: (error) => {

  //       this.isLoading = false;

  //       console.error(error);

  //       alert(
  //         error?.error?.message ||
  //         'Invalid Credentials'
  //       );

  //     }

  //   });

  // }


login() {

  const payload = {

    admin_email: this.email,

    admin_password: this.password

  };

  this.http.post(

    `${CONFIG.BASE_URL}/admin/login`,

    payload

  ).subscribe({

    next: (response: any) => {

      if(response.success){

        localStorage.setItem(
          'token',
          response.data.token
        );

        localStorage.setItem(
          'admin_id',
          response.data.admin_id
        );

        localStorage.setItem(
          'admin_name',
          response.data.admin_name
        );

        localStorage.setItem(
          'admin_email',
          response.data.admin_email
        );

        localStorage.setItem(
          'role',
          'admin'
        );

        this.router.navigate([
          '/admin-dashboard'
        ]);

      }

    },

    error: (error) => {

      console.error(error);

      alert(
        error?.error?.message ||
        'Login Failed'
      );

    }

  });

}

}