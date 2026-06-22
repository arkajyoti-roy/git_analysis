import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { CONFIG } from '../../../config/config';

@Component({
  selector: 'app-create',
  imports: [FormsModule],
  templateUrl: './create.html',
  styleUrl: './create.css'
})
export class Create {

  emp_name = '';
  emp_email = '';
  emp_pass = '';
  emp_role = 'junior-dev';

  isLoading = false;

  constructor(
    private http: HttpClient
  ) {}

  createUser() {

    if (
      !this.emp_name ||
      !this.emp_email ||
      !this.emp_pass ||
      !this.emp_role
    ) {

      alert('Please fill all fields');
      return;

    }

    this.isLoading = true;

    const payload = {

      emp_name: this.emp_name,

      emp_email: this.emp_email,

      emp_pass: this.emp_pass,

      emp_role: this.emp_role

    };

    this.http.post(

      `${CONFIG.BASE_URL}/auth/register`,

      payload

    ).subscribe({

      next: (response: any) => {

        this.isLoading = false;

        if(response.success){

          alert('User Created Successfully');

          this.emp_name = '';
          this.emp_email = '';
          this.emp_pass = '';
          this.emp_role = 'junior-dev';

        }

      },

      error: (error) => {

        this.isLoading = false;

        console.error(error);

        alert(
          error?.error?.message ||
          'Failed To Create User'
        );

      }

    });

  }

}