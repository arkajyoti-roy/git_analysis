import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  step: 'email' | 'otp' | 'password' = 'email';
  email = '';
  otp = '';
  newPassword = '';
  isLoading = false;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private router: Router
  ) {}

  sendOtp() {
    if (!this.email) {
      this.toast.warning('Please enter your email address');
      return;
    }
    this.isLoading = true;
    this.http.post(`${CONFIG.BASE_URL}/auth/forgot-password`, { emp_email: this.email }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.toast.success('OTP sent to your email');
          this.step = 'otp';
        } else {
          this.toast.error(res.message || 'Failed to send OTP');
        }
      },
      error: (err) => {
        this.isLoading = false;
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

  verifyOtp() {
    if (!this.otp || this.otp.length !== 6) {
      this.toast.warning('Please enter a valid 6-digit OTP');
      return;
    }
    this.step = 'password';
  }

  resetPassword() {
    if (!this.newPassword || this.newPassword.length < 8) {
      this.toast.warning('Password must be at least 8 characters');
      return;
    }
    this.isLoading = true;
    this.http.post(`${CONFIG.BASE_URL}/auth/reset-password`, {
      emp_email: this.email,
      otp: this.otp,
      new_password: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.toast.success('Password reset successfully');
          this.router.navigate(['/auth/login']);
        } else {
          this.toast.error(res.message || 'Failed to reset password');
        }
      },
      error: (err) => {
        this.isLoading = false;
        let errMsg = err.error?.message || 'Error resetting password';
        if (err.error?.errors) {
          errMsg = Object.values(err.error.errors)
            .map((msgs: any) => Array.isArray(msgs) ? msgs.join(', ') : msgs)
            .join('\n');
        }
        this.toast.error(errMsg);
      }
    });
  }
}
