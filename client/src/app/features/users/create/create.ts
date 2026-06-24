import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { ToastService } from '../../../core/services/toast.service';

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
    private http: HttpClient,
    private toast: ToastService
  ) {}

  createUser() {

    if (
      !this.emp_name ||
      !this.emp_email ||
      !this.emp_pass ||
      !this.emp_role
    ) {

      this.toast.warning('Please fill all fields');
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

          this.toast.success('User Created Successfully');

          this.emp_name = '';
          this.emp_email = '';
          this.emp_pass = '';
          this.emp_role = 'junior-dev';

        }

      },

      error: (error) => {

        this.isLoading = false;

        console.error(error);

        this.toast.error(error?.error?.message || 'Failed To Create User');

      }

    });

  }

}