import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {
  userName: string = 'User';
  userInitial: string = 'U';

  constructor(private router: Router) {}

  ngOnInit() {
    const adminName = localStorage.getItem('admin_name');
    if (adminName) {
      this.userName = adminName;
      this.userInitial = adminName.charAt(0).toUpperCase();
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
