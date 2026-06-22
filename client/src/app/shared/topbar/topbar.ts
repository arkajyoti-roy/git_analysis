import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../config/config';
// import {Config} from '../../config/config';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {
  userName: string = 'User';
  userInitial: string = 'U';

  showProfilePopup: boolean = false;
  userProfile: any = null;
  isLoadingProfile: boolean = false;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.userName = localStorage.getItem('emp_name') || 'User';
    this.userInitial = this.userName.charAt(0).toUpperCase();

    const adminName = localStorage.getItem('admin_name');
    if (adminName) {
      this.userName = adminName;
      this.userInitial = adminName.charAt(0).toUpperCase();
    }
  }

  toggleProfilePopup() {
    this.showProfilePopup = !this.showProfilePopup;
    
    if (this.showProfilePopup && !this.userProfile) {
      this.fetchProfile();
    }
  }

  fetchProfile() {
    const empId = localStorage.getItem('emp_id') || localStorage.getItem('admin_id');
    if (!empId) return;

    this.isLoadingProfile = true;
    
    this.http.get(`${CONFIG.BASE_URL}/auth/profile?emp_id=${empId}`)
      .subscribe({
        next: (response: any) => {
          this.isLoadingProfile = false;
          if (response.success && response.data) {
             this.userProfile = response.data;
          } else {
             this.userProfile = response;
          }
        },
        error: (err) => {
          console.error('Error fetching profile', err);
          this.isLoadingProfile = false;
        }
      });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}

