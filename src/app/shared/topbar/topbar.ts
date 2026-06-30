import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../config/config';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {
  userName: string = 'User';
  userInitial: string = 'U';
  pageTitle: string = 'Dashboard';

  showProfilePopup: boolean = false;
  userProfile: any = null;
  isLoadingProfile: boolean = false;

  get profileRoute(): string {
    const role = localStorage.getItem('role') || 'dev';
    return role === 'admin' ? '/admin/profile' : '/developer/profile';
  }

  get settingsRoute(): string {
    const role = localStorage.getItem('role') || 'dev';
    return role === 'admin' ? '/admin/settings' : '/developer/settings';
  }

  constructor(
    private router: Router,
    private http: HttpClient,
    public themeService: ThemeService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('emp_name') || 'User';
    this.userInitial = this.userName.charAt(0).toUpperCase();

    const adminName = localStorage.getItem('admin_name');
    if (adminName) {
      this.userName = adminName;
      this.userInitial = adminName.charAt(0).toUpperCase();
    }

    // Dynamic page title based on role
    const role = localStorage.getItem('role') || '';
    if (role === 'admin') {
      this.pageTitle = 'Admin Panel';
    } else if (role === 'sr-dev') {
      this.pageTitle = 'Senior Developer';
    } else if (role === 'jr-dev') {
      this.pageTitle = 'Junior Developer';
    } else {
      this.pageTitle = 'Developer';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.showProfilePopup && !this.elementRef.nativeElement.contains(event.target)) {
      this.showProfilePopup = false;
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
          let data = response.success ? response.data : response;
          if (Array.isArray(data)) {
            data = data.length > 0 ? data[0] : null;
          }
          this.userProfile = data;
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
