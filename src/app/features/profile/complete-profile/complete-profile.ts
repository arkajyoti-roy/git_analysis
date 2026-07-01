import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.css'
})
export class CompleteProfile implements OnInit {
  
  // Readonly fields
  emp_id = '';
  emp_name = '';
  emp_email = '';
  emp_system_role = '';

  // Editable fields
  emp_phone = '';
  emp_address = '';
  emp_blood_group = '';
  emp_role = ''; // We will default this to their system role if needed, or Developer
  emp_position = '';
  emp_work_field = '';
  emp_doj = '';
  emp_tenure: number | null = null;
  emp_grad: number | null = null;
  emp_m_status = '';

  isLoading = false;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

  constructor(private http: HttpClient, private router: Router, private toast: ToastService) {}

  ngOnInit() {
    this.emp_id = localStorage.getItem('emp_id') || localStorage.getItem('admin_id') || '';
    this.emp_name = localStorage.getItem('emp_name') || localStorage.getItem('admin_name') || '';
    this.emp_email = localStorage.getItem('emp_email') || '';
    this.emp_system_role = localStorage.getItem('role') || 'Developer';
    
    // Set default role from system role
    this.emp_role = this.emp_system_role;

    if (!this.emp_id) {
      this.router.navigate(['/login']);
    }
  }

  saveProfile() {
    if (!this.emp_phone || !this.emp_address) {
      this.toast.warning('Please fill out all required fields.');
      return;
    }

    this.isLoading = true;

    const payload = {
      emp_id: this.emp_id,
      emp_phone: this.emp_phone,
      emp_address: this.emp_address,
      emp_blood_group: this.emp_blood_group,
      emp_role: this.emp_role, // Hidden/default
      emp_position: this.emp_position,
      emp_work_field: this.emp_work_field,
      emp_doj: this.emp_doj,
      emp_tenure: this.emp_tenure,
      emp_grad: this.emp_grad,
      emp_m_status: this.emp_m_status
    };

    this.http.put(`${CONFIG.BASE_URL}/auth/details`, payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Mark profile as completed locally
        localStorage.setItem('profile_completed', 'true');
        
        // Navigate to dashboard based on role
        if (this.emp_system_role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/developer/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to save profile', err);
        this.toast.error(err.error?.message || 'Failed to save profile details. Please try again.');
      }
    });
  }
}
