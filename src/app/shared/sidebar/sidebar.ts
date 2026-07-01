import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  collapsed = false;

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  get rolePrefix(): string {
    const role = localStorage.getItem('role') || 'dev';
    return role === 'admin' ? '/admin' : '/developer';
  }

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }
}