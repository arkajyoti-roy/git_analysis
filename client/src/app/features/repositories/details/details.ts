import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RepositoryService } from '../../../core/services/repository.service';

@Component({
  selector: 'app-details',
  imports: [DatePipe],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  activeTab = 'overview';
  repoId: number | null = null;
  repo: any = null;
  isLoading = true;

  // Generated dynamic data
  installSteps: string[] = [];
  envVars: { key: string, value: string }[] = [];
  apiEndpoints: { method: string, path: string, desc: string }[] = [];
  archDescription: string = '';

  constructor(
    private route: ActivatedRoute,
    private repoService: RepositoryService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.repoId = parseInt(idStr, 10);
        this.fetchRepoDetails(this.repoId);
      }
    });
  }

  fetchRepoDetails(id: number) {
    this.isLoading = true;
    this.repoService.getRepositoryById(id).subscribe({
      next: (res: any) => {
        this.repo = res.data || res;
        this.generateDynamicContent();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load repository', err);
        this.isLoading = false;
      }
    });
  }

  generateDynamicContent() {
    if (!this.repo) return;
    const stack = (this.repo.repo_stack || '').toLowerCase();
    
    // 1. Getting Started
    if (stack.includes('laravel') || stack.includes('php')) {
      this.installSteps = ['composer install', 'cp .env.example .env', 'php artisan key:generate', 'php artisan migrate', 'php artisan serve'];
    } else if (stack.includes('react') || stack.includes('angular') || stack.includes('node') || stack.includes('mern')) {
      this.installSteps = ['npm install', 'cp .env.example .env', 'npm run build', 'npm start'];
    } else if (stack.includes('python')) {
      this.installSteps = ['python -m venv venv', 'source venv/bin/activate', 'pip install -r requirements.txt', 'python app.py'];
    } else {
      this.installSteps = ['Clone the repository', 'Install dependencies based on stack', 'Run the startup script'];
    }

    // 2. Environment Variables
    this.envVars = [
      { key: 'PORT', value: '8000' },
      { key: 'APP_ENV', value: this.repo.repo_status === 'production up' ? 'production' : 'development' }
    ];
    if (stack.includes('laravel') || stack.includes('php')) {
      this.envVars.push({ key: 'DB_CONNECTION', value: 'mysql' });
      this.envVars.push({ key: 'DB_DATABASE', value: 'app_db' });
    }
    if (stack.includes('mongo') || stack.includes('mern') || stack.includes('node')) {
      this.envVars.push({ key: 'MONGO_URI', value: 'mongodb://localhost:27017/db' });
    }
    this.envVars.push({ key: 'JWT_SECRET', value: 'your-super-secret-key' });

    // 3. API Endpoints
    let apiCount = parseInt(this.repo.repo_apis) || 5;
    if (apiCount > 10) apiCount = 10; // Cap to 10 for UI mock
    
    this.apiEndpoints = [];
    const resources = ['users', 'auth', 'products', 'settings', 'reports'];
    
    for (let i = 0; i < apiCount; i++) {
      const resource = resources[i % resources.length];
      const method = i % 3 === 0 ? 'POST' : (i % 2 === 0 ? 'PUT' : 'GET');
      this.apiEndpoints.push({
        method: method,
        path: `/api/v1/${resource}${method === 'GET' ? '/:id' : ''}`,
        desc: `${method} operation for ${resource}`
      });
    }

    // 4. Architecture
    const arch = this.repo.repo_arch || 'Monolith';
    if (arch.toLowerCase().includes('microservice')) {
      this.archDescription = 'This project relies on a distributed Microservices architecture, allowing independent scaling and decoupled deployments across different bounded contexts.';
    } else {
      this.archDescription = `This project uses a standard ${arch} architecture, centralizing logic for easier development and deployment.`;
    }
  }
}
