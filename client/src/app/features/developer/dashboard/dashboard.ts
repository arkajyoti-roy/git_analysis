import { Component, OnInit } from '@angular/core';
import { Topbar } from '../../../shared/topbar/topbar';

@Component({
  selector: 'app-dashboard',
  imports: [Topbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DEVDashboard implements OnInit {
  isSrDev: boolean = false;
  isJrDev: boolean = false;
  userName: string = 'Developer';

  // Common Mock Data
  activeRepos = [
    { name: 'Auth Service', status: 'Active', branch: 'main' },
    { name: 'Frontend Client', status: 'Active', branch: 'develop' }
  ];
  
  assignedIssues = [
    { id: '#142', title: 'Fix JWT Token Expiration Bug', priority: 'High' },
    { id: '#145', title: 'Implement Dark Mode Toggle', priority: 'Medium' }
  ];

  // Senior Dev Mock Data
  pendingReviews = [
    { pr: '#89', author: 'Jane Jr', title: 'Added new repository form' },
    { pr: '#91', author: 'Bob Intern', title: 'Updated README' }
  ];

  systemAlerts = [
    { type: 'Warning', message: 'High memory usage on Auth Staging server.' }
  ];

  ngOnInit() {
    const role = localStorage.getItem('role');
    this.userName = localStorage.getItem('emp_name') || 'Developer';
    
    if (role === 'sr-dev') {
      this.isSrDev = true;
    } else if (role === 'jr-dev' || role === 'dev') {
      this.isJrDev = true;
    }
  }
}
