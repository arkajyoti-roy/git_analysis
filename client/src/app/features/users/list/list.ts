import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { CONFIG } from '../../../config/config';

@Component({
  selector: 'app-list',
  imports: [FormsModule],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit, OnDestroy {
  users: any[] = [];
  isLoading = true;
  editingUserId: number | null = null;
  editingUserRole: string = '';
  userToDelete: any = null;
  private pollInterval: any;

  // Create User Modal State
  showAddUserModal = false;
  emp_name = '';
  emp_email = '';
  emp_pass = '';
  emp_role = '';
  isCreating = false;

  constructor(
    private userService: UserService,
    private toast: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchUsers();
    
    // Auto reload every 1.5 seconds (1500 ms)
    this.pollInterval = setInterval(() => {
      this.fetchUsers(true);
    }, 1500);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  fetchUsers(isPolling = false) {
    if (!isPolling) this.isLoading = true;
    this.userService.getUsers(true).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const data = response.data || response;
        if (Array.isArray(data)) {
          this.users = data;
        }
      },
      error: (error) => {
        if (!isPolling) this.isLoading = false;
        console.error('Error fetching users:', error);
      }
    });
  }

  startEdit(user: any) {
    this.editingUserId = user.emp_id || user.id;
    this.editingUserRole = user.emp_role || user.role;
  }

  cancelEdit() {
    this.editingUserId = null;
  }

  saveEdit(user: any) {
    const id = user.emp_id || user.id;
    if (!this.editingUserRole) {
      this.toast.warning('Role cannot be empty');
      return;
    }
    
    this.userService.updateUser(id, { emp_role: this.editingUserRole }).subscribe({
      next: () => {
        this.toast.success('User role updated successfully');
        if (user.emp_role) user.emp_role = this.editingUserRole;
        if (user.role) user.role = this.editingUserRole;
        this.editingUserId = null;
      },
      error: (err) => {
        console.error('Failed to update role', err);
        this.toast.error('Failed to update role');
      }
    });
  }

  confirmDelete(user: any) {
    this.userToDelete = user;
  }

  cancelDelete() {
    this.userToDelete = null;
  }

  executeDelete() {
    if (!this.userToDelete) return;
    const id = this.userToDelete.emp_id || this.userToDelete.id;
    
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.toast.success('User deleted successfully');
        this.userToDelete = null;
        this.fetchUsers(true);
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.toast.error('Failed to delete user');
        this.userToDelete = null;
      }
    });
  }

  // Create User Methods
  openAddUserModal() {
    this.emp_name = '';
    this.emp_email = '';
    this.emp_pass = '';
    this.emp_role = '';
    this.showAddUserModal = true;
  }

  closeAddUserModal() {
    this.showAddUserModal = false;
  }

  createUser() {
    if (!this.emp_name || !this.emp_email || !this.emp_pass || !this.emp_role) {
      this.toast.warning('Please fill all fields');
      return;
    }

    this.isCreating = true;
    const payload = {
      emp_name: this.emp_name,
      emp_email: this.emp_email,
      emp_pass: this.emp_pass,
      emp_role: this.emp_role
    };

    this.http.post(`${CONFIG.BASE_URL}/auth/register`, payload).subscribe({
      next: (response: any) => {
        this.isCreating = false;
        if(response.success){
          this.toast.success('User Created Successfully');
          this.closeAddUserModal();
          this.fetchUsers(true);
        }
      },
      error: (error) => {
        this.isCreating = false;
        console.error(error);
        this.toast.error(error?.error?.message || 'Failed To Create User');
      }
    });
  }
}
