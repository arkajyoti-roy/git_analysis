import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { Topbar } from '../../../shared/topbar/topbar';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Topbar],
  templateUrl: './view-profile.html',
  styleUrl: './view-profile.css'
})
export class ViewProfile implements OnInit {
  
  profile: any = null;
  isLoading = true;

  showEditModal = false;
  isSaving = false;
  editData: any = {};

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }

  constructor(private http: HttpClient, private location: Location) {}

  ngOnInit() {
    this.fetchProfile();
  }

  fetchProfile() {
    this.isLoading = true;
    const empId = localStorage.getItem('emp_id') || localStorage.getItem('admin_id');
    
    // First fetch the base profile
    this.http.get(`${CONFIG.BASE_URL}/auth/profile?emp_id=${empId}`).subscribe({
      next: (res: any) => {
        let data = res;
        if (res.data && res.data.emp_id) data = res.data;
        else if (res.user && res.user.emp_id) data = res.user;
        else if (res.employee && res.employee.emp_id) data = res.employee;
        else if (Array.isArray(res) && res.length > 0) data = res[0];
        else if (res.data && Array.isArray(res.data) && res.data.length > 0) data = res.data[0];
        else if (res.data) data = res.data;
        
        this.profile = data || {};
        
        // NOW fetch the extra details from /details/show to get phone, address, etc.
        this.http.get(`${CONFIG.BASE_URL}/details/show?emp_id=${empId}`).subscribe({
          next: (detailsRes: any) => {
            this.isLoading = false;
            let extraData = detailsRes.data || detailsRes;
            if (Array.isArray(extraData)) extraData = extraData[0];
            
            // Merge the extra data into our profile object so they all display!
            if (extraData) {
              this.profile = { ...this.profile, ...extraData };
            }
          },
          error: (err) => {
            // Even if /auth/details fails, we at least have the base profile
            this.isLoading = false;
            console.warn('Could not fetch extra details from /auth/details. Check backend.', err);
          }
        });

      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to fetch base profile', err);
      }
    });
  }

  goBack() {
    this.location.back();
  }

  get userInitial(): string {
    return this.profile?.emp_name ? this.profile.emp_name.charAt(0).toUpperCase() : 'U';
  }

  openEditModal() {
    // Clone the profile data to editData
    this.editData = { ...this.profile };
    // Ensure emp_role is sent
    if (!this.editData.emp_role) {
      this.editData.emp_role = localStorage.getItem('role') || 'Developer';
    }
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveProfile() {
    if (!this.editData.emp_phone || !this.editData.emp_address) {
      alert('Please fill out all required fields.');
      return;
    }

    this.isSaving = true;

    this.http.put(`${CONFIG.BASE_URL}/auth/details`, this.editData).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.showEditModal = false;
        this.fetchProfile(); // Refresh data
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to update profile', err);
        alert(err.error?.message || 'Failed to update profile details.');
      }
    });
  }
}
