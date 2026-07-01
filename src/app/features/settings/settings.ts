import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../config/config';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  isDev = false;
  // Email state
  newEmail = '';
  otp = '';
  isEmailLoading = false;
  emailStep: 'input' | 'otp' = 'input';

  // Password state
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isPasswordLoading = false;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private location: Location
  ) {}

  ngOnInit() {
    const role = localStorage.getItem('role') || 'dev';
    this.isDev = role === 'dev' || role === 'sr-dev' || role === 'jr-dev';
  }

  goBack() {
    this.location.back();
  }

  // --- Email Change ---
  sendEmailOtp() {
    if (!this.newEmail) {
      this.toast.warning('Please enter a new email address');
      return;
    }
    
    this.isEmailLoading = true;
    this.http.post(`${CONFIG.BASE_URL}/auth/send-email-otp`, {
      new_email: this.newEmail
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (res: any) => {
        this.isEmailLoading = false;
        if (res.success) {
          this.toast.success('OTP sent to both current and new email addresses');
          this.emailStep = 'otp';
        } else {
          this.toast.error(res.message || 'Failed to send OTP');
        }
      },
      error: (err) => {
        this.isEmailLoading = false;
        let errMsg = err.error?.message || 'Error sending OTP';
        if (err.error?.errors) {
          errMsg = Object.values(err.error.errors)
            .map((msgs: any) => Array.isArray(msgs) ? msgs.join(', ') : msgs)
            .join('\n');
        }
        this.toast.error(errMsg);
      }
    });
  }

  changeEmail() {
    if (!this.otp || this.otp.length !== 6) {
      this.toast.warning('Please enter a valid 6-digit OTP');
      return;
    }

    this.isEmailLoading = true;
    this.http.post(`${CONFIG.BASE_URL}/auth/change-email`, {
      otp: this.otp,
      new_email: this.newEmail
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (res: any) => {
        this.isEmailLoading = false;
        if (res.success) {
          this.toast.success('Email updated successfully');
          localStorage.setItem('emp_email', this.newEmail);
          this.emailStep = 'input';
          this.newEmail = '';
          this.otp = '';
        } else {
          this.toast.error(res.message || 'Failed to update email');
        }
      },
      error: (err) => {
        this.isEmailLoading = false;
        let errMsg = err.error?.message || 'Error updating email';
        if (err.error?.errors) {
          errMsg = Object.values(err.error.errors)
            .map((msgs: any) => Array.isArray(msgs) ? msgs.join(', ') : msgs)
            .join('\n');
        }
        this.toast.error(errMsg);
      }
    });
  }

  // --- Password Change ---
  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.toast.warning('Please fill all password fields');
      return;
    }
    if (this.newPassword.length < 8) {
      this.toast.warning('New password must be at least 8 characters');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.warning('New passwords do not match');
      return;
    }

    this.isPasswordLoading = true;
    this.http.post(`${CONFIG.BASE_URL}/auth/change-password`, {
      current_password: this.currentPassword,
      new_password: this.newPassword
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (res: any) => {
        this.isPasswordLoading = false;
        if (res.success) {
          this.toast.success('Password updated successfully');
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        } else {
          this.toast.error(res.message || 'Failed to update password');
        }
      },
      error: (err) => {
        this.isPasswordLoading = false;
        this.toast.error(err.error?.message || 'Error updating password');
      }
    });
  }
}
