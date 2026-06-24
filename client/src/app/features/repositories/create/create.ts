import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CONFIG } from '../../../config/config';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ThemeService } from '../../../core/services/theme.service';
import { RepositoryService } from '../../../core/services/repository.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-create',
  imports: [FormsModule, MonacoEditorModule, RouterLink, TitleCasePipe],
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class Create implements OnInit {

  // Edit mode
  isEditMode = false;
  repoId: number | null = null;

  repo_name = '';
  repo_stack: string[] = [];
  repo_status = '';
  repo_branch = '';
  repo_arch = '';
  repo_apis: { method: string, path: string, desc: string }[] = [];
  repo_schema = '';
  repo_init_author = '';
  repo_init_date = new Date().toISOString().split('T')[0];
  repo_deadline = '';
  repo_issues = '';
  repo_review_log = '';
  repo_major_commits = '';
  repo_code_snippet = '';
  repo_getting_started = '';
  repo_env = '';
  repo_deployment = '';
  repo_coding_standards = '';
  repo_architecture_diagram = '';

  repo_access: { emp_id: string, name: string, can: string }[] = [];
  availableUsers: any[] = [];

  isSubmitting = false;

  // Dynamic options tracking (will come from DB)
  stackOptions: { id: number | string, name: string }[] = [];
  statusOptions: { id: number | string, name: string }[] = [];
  archOptions: { id: number | string, name: string }[] = [];
  branchOptions: { id: number | string, name: string }[] = [];
  // Manage Modal State
  showManageModal = false;
  managingType: 'stack' | 'status' | 'arch' | 'branch' | null = null;
  newManageItemName = '';

  get modalTitle(): string {
    if (this.managingType === 'stack') return 'Manage Stack';
    if (this.managingType === 'status') return 'Manage Status';
    if (this.managingType === 'arch') return 'Manage Architecture';
    if (this.managingType === 'branch') return 'Manage Branch';
    return 'Manage Category';
  }

  get currentManageItems(): { id: number | string, name: string }[] {
    if (this.managingType === 'stack') return this.stackOptions;
    if (this.managingType === 'status') return this.statusOptions;
    if (this.managingType === 'arch') return this.archOptions;
    if (this.managingType === 'branch') return this.branchOptions;
    return [];
  }

  get availableStacks(): { id: number | string, name: string }[] {
    return this.stackOptions.filter(s => !this.repo_stack.includes(s.name));
  }



  get availableAccessUsers(): any[] {
    return this.availableUsers.filter(u => !this.repo_access.some(a => a.emp_id === (u.emp_id || u.id)?.toString()));
  }

  editorOptions = { 
    theme: 'vs', 
    language: 'javascript', 
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    minimap: { enabled: true },
    formatOnType: true,
    formatOnPaste: true,
    scrollBeyondLastLine: false,
    padding: { top: 16 },
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on'
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute,
    public themeService: ThemeService,
    private repoService: RepositoryService,
    private userService: UserService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.editorOptions = {
      ...this.editorOptions,
      theme: this.themeService.isDarkMode ? 'vs-dark' : 'vs'
    };

    // Check if editing
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.isEditMode = true;
        this.repoId = parseInt(idStr, 10);
        this.loadRepoData(this.repoId);
      } else {
        this.repo_init_author = localStorage.getItem('emp_name') || localStorage.getItem('admin_name') || '';
      }
    });

    this.fetchUsers();
    this.fetchStatuses();
    this.fetchArchitectures();
    this.fetchStacks();
    this.fetchBranches();
  }

  fetchStatuses() {
    this.http.get(`${CONFIG.BASE_URL}/repo-statuses`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.statusOptions = data.map((item: any) => ({
          id: item.id || item.repo_id || Date.now(),
          name: item.repo_status_name || item.name || item.status_name || 'Unknown'
        }));
      },
      error: (err) => console.error('Failed to fetch statuses', err)
    });
  }

  fetchArchitectures() {
    this.http.get(`${CONFIG.BASE_URL}/repo-architectures`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.archOptions = data.map((item: any) => ({
          id: item.id || Date.now(),
          name: item.repo_arch_name || item.repo_architecture_name || item.architecture_name || item.name || 'Unknown'
        }));
      },
      error: (err) => console.error('Failed to fetch architectures', err)
    });
  }

  fetchStacks() {
    this.http.get(`${CONFIG.BASE_URL}/repo-stacks`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.stackOptions = data.map((item: any) => ({
          id: item.id || Date.now(),
          name: item.repo_stack_name || item.stack_name || item.name || 'Unknown'
        }));
      },
      error: (err) => console.error('Failed to fetch stacks', err)
    });
  }

  fetchBranches() {
    this.http.get(`${CONFIG.BASE_URL}/repo-branches`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.branchOptions = data.map((item: any) => ({
          id: item.id || Date.now(),
          name: item.repo_branch_name || item.branch_name || item.name || 'Unknown'
        }));
      },
      error: (err) => console.error('Failed to fetch branches', err)
    });
  }

  fetchUsers() {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        const users = Array.isArray(res) ? res : (res.data || []);
        // Filter out admins since they have default access
        this.availableUsers = users.filter((u: any) => u.emp_role !== 'admin');
      },
      error: (err) => console.error('Failed to fetch users', err)
    });
  }

  loadRepoData(id: number) {
    this.repoService.getRepositoryById(id).subscribe({
      next: (res: any) => {
        const repo = res.data || res;
        this.repo_name = repo.repo_name || '';
        this.repo_status = repo.repo_status || 'Development Env';
        // Add status to list if it's custom
        if (this.repo_status && !this.statusOptions.some(s => s.name === this.repo_status)) {
          this.statusOptions.push({ id: Date.now(), name: this.repo_status });
        }
        this.repo_branch = repo.repo_branch || '';
        if (this.repo_branch && !this.branchOptions.some(b => b.name === this.repo_branch)) {
          this.branchOptions.push({ id: Date.now(), name: this.repo_branch });
        }
        
        this.repo_arch = repo.repo_arch || '';

        this.repo_schema = repo.repo_schema || '';
        this.repo_init_author = repo.repo_init_author || '';
        this.repo_init_date = repo.repo_init_date || new Date().toISOString().split('T')[0];
        this.repo_deadline = repo.repo_deadline || '';
        this.repo_code_snippet = repo.repo_code_snippet || '';
        this.repo_getting_started = repo.repo_getting_started || '';
        this.repo_env = repo.repo_env || '';
        this.repo_deployment = repo.repo_deployment || '';
        this.repo_coding_standards = repo.repo_coding_standards || '';
        this.repo_architecture_diagram = repo.repo_architecture_diagram || '';

        // Handle array fields
        if (Array.isArray(repo.repo_apis)) {
          this.repo_apis = repo.repo_apis.map((api: any) => ({
            method: api?.method || 'GET',
            path: api?.path || '',
            desc: api?.desc || ''
          }));
        } else if (typeof repo.repo_apis === 'string' && repo.repo_apis.trim() !== '') {
          try {
            const parsed = JSON.parse(repo.repo_apis);
            if (Array.isArray(parsed)) {
              this.repo_apis = parsed;
            } else if (typeof parsed === 'object') {
              this.repo_apis = [parsed];
            } else {
              this.repo_apis = [{ method: 'INFO', path: 'Raw Text', desc: repo.repo_apis }];
            }
          } catch {
            this.repo_apis = [{ method: 'INFO', path: 'Raw Text', desc: repo.repo_apis }];
          }
        } else {
          this.repo_apis = [];
        }

        this.repo_issues = Array.isArray(repo.repo_issues) 
          ? repo.repo_issues.join('\n') 
          : (repo.repo_issues || '');
        this.repo_review_log = Array.isArray(repo.repo_review_log) 
          ? repo.repo_review_log.join('\n') 
          : (repo.repo_review_log || '');
        this.repo_major_commits = Array.isArray(repo.repo_major_commits) 
          ? repo.repo_major_commits.join('\n') 
          : (repo.repo_major_commits || '');

        // Handle stack array
        if (Array.isArray(repo.repo_stack)) {
          this.repo_stack = [...repo.repo_stack];
        } else if (typeof repo.repo_stack === 'string' && repo.repo_stack) {
          this.repo_stack = repo.repo_stack.split(',').map((s: string) => s.trim());
        }

        // Handle repo access
        let parsedAccess: any[] = [];
        if (Array.isArray(repo.repo_access)) {
          parsedAccess = repo.repo_access;
        } else if (typeof repo.repo_access === 'string' && repo.repo_access.trim() !== '') {
          try {
            parsedAccess = JSON.parse(repo.repo_access);
          } catch {
            parsedAccess = [];
          }
        }
        
        // Flatten pivot data if the backend uses Laravel Many-to-Many relationships
        this.repo_access = parsedAccess.map((access: any) => ({
          ...access,
          name: access.name || access.emp_name || 'Unknown',
          can: access.can || access.role || access.repo_role || access.access_level || access.pivot?.can || access.pivot?.role || 'view'
        }));
      },
      error: (err) => {
        console.error('Failed to load repository for editing', err);
        this.toast.error('Failed to load repository data.');
      }
    });
  }

  openManageModal(type: 'stack' | 'status' | 'arch' | 'branch') {
    this.managingType = type;
    this.showManageModal = true;
    this.newManageItemName = '';
  }

  closeManageModal() {
    this.showManageModal = false;
    this.managingType = null;
    this.newManageItemName = '';
  }

  deleteManageItem(id: number | string) {
    if (this.managingType === 'status') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-statuses/${id}`).subscribe({
        next: () => {
          this.toast.success('Status deleted successfully');
          this.fetchStatuses();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'stack') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-stacks/${id}`).subscribe({
        next: () => {
          this.toast.success('Stack deleted successfully');
          this.fetchStacks();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'arch') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-architectures/${id}`).subscribe({
        next: () => {
          this.toast.success('Architecture deleted successfully');
          this.fetchArchitectures();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'branch') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-branches/${id}`).subscribe({
        next: () => {
          this.toast.success('Branch deleted successfully');
          this.fetchBranches();
        },
        error: (err) => this.showError(err)
      });
    }
  }

  saveManageItem() {
    if (!this.newManageItemName.trim()) return;
    const name = this.newManageItemName.trim();
    
    if (this.managingType === 'status') {
      const payload: any = {
        repo_status_name: name
      };
      
      this.http.post(`${CONFIG.BASE_URL}/repo-statuses`, payload).subscribe({
        next: () => {
          this.toast.success('Status added successfully');
          this.newManageItemName = '';
          this.fetchStatuses(); // Refresh from DB
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'stack') {
      const payload: any = {
        repo_stack_name: name
      };
      
      this.http.post(`${CONFIG.BASE_URL}/repo-stacks`, payload).subscribe({
        next: () => {
          this.toast.success('Stack added successfully');
          this.newManageItemName = '';
          this.fetchStacks();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'arch') {
      const payload: any = {
        repo_arch_name: name
      };
      
      this.http.post(`${CONFIG.BASE_URL}/repo-architectures`, payload).subscribe({
        next: () => {
          this.toast.success('Architecture added successfully');
          this.newManageItemName = '';
          this.fetchArchitectures(); // Refresh from DB
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'branch') {
      const payload: any = {
        repo_branch_name: name
      };
      
      this.http.post(`${CONFIG.BASE_URL}/repo-branches`, payload).subscribe({
        next: () => {
          this.toast.success('Branch added successfully');
          this.newManageItemName = '';
          this.fetchBranches();
        },
        error: (err) => this.showError(err)
      });
    }
  }

  addStackFromDropdown(event: any) {
    const val = event.target.value;
    if (val && !this.repo_stack.includes(val)) {
      this.repo_stack.push(val);
    }
    // Reset the select back to default
    event.target.value = "";
  }

  removeStack(stack: string) {
    this.repo_stack = this.repo_stack.filter(s => s !== stack);
  }

  private textToArray(text: string): string[] {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s !== '');
  }

  addApiRow() {
    this.repo_apis.push({ method: 'GET', path: '', desc: '' });
  }

  removeApiRow(index: number) {
    this.repo_apis.splice(index, 1);
  }

  addAccessUser(event: any) {
    const val = event.target.value;
    if (!val) return;
    
    const user = this.availableUsers.find(u => (u.emp_id || u.id)?.toString() === val);
    if (user && !this.repo_access.some(a => a.emp_id === (user.emp_id || user.id)?.toString())) {
      this.repo_access.push({
        emp_id: (user.emp_id || user.id).toString(),
        name: user.emp_name || user.name || 'Unknown User',
        can: 'view' // default
      });
    }
    event.target.value = '';
  }

  removeAccessUser(index: number) {
    this.repo_access.splice(index, 1);
  }

  private getEmpId(): string {
    return localStorage.getItem('emp_id') || localStorage.getItem('admin_id') || '';
  }

  submitRepo() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.isEditMode) {
      this.updateRepo();
    } else {
      this.createRepo();
    }
  }

  createRepo() {
    const payload: any = {
      repo_name: this.repo_name,
      repo_stack: this.repo_stack,
      repo_status: this.repo_status,
      repo_branch: this.repo_branch,
      repo_arch: this.repo_arch,
      repo_apis: this.repo_apis,
      repo_schema: this.repo_schema,
      repo_init_author: this.repo_init_author,
      repo_init_date: this.repo_init_date,
      repo_deadline: this.repo_deadline,
      repo_issues: this.textToArray(this.repo_issues),
      repo_review_log: this.textToArray(this.repo_review_log),
      repo_major_commits: this.textToArray(this.repo_major_commits),
      repo_getting_started: this.repo_getting_started,
      repo_env: this.repo_env,
      repo_deployment: this.repo_deployment,
      repo_coding_standards: this.repo_coding_standards,
      repo_architecture_diagram: this.repo_architecture_diagram,
      repo_access: this.repo_access
    };

    if (this.repo_code_snippet) payload.repo_code_snippet = this.repo_code_snippet;

    this.http.post(`${CONFIG.BASE_URL}/repositories`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Repository created successfully!');
        this.repoService.clearCache();
        this.router.navigate(['/admin/repositories']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  updateRepo() {
    const payload: any = {
      emp_id: this.getEmpId(),
      repo_name: this.repo_name,
      repo_stack: this.repo_stack,
      repo_status: this.repo_status,
      repo_branch: this.repo_branch,
      repo_arch: this.repo_arch,
      repo_apis: this.repo_apis,
      repo_schema: this.repo_schema,
      repo_init_author: this.repo_init_author,
      repo_init_date: this.repo_init_date,
      repo_deadline: this.repo_deadline,
      repo_issues: this.textToArray(this.repo_issues),
      repo_review_log: this.textToArray(this.repo_review_log),
      repo_major_commits: this.textToArray(this.repo_major_commits),
      repo_getting_started: this.repo_getting_started,
      repo_env: this.repo_env,
      repo_deployment: this.repo_deployment,
      repo_coding_standards: this.repo_coding_standards,
      repo_architecture_diagram: this.repo_architecture_diagram,
      repo_access: this.repo_access
    };

    if (this.repo_code_snippet) payload.repo_code_snippet = this.repo_code_snippet;

    this.http.put(`${CONFIG.BASE_URL}/repositories/${this.repoId}`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Repository updated successfully!');
        this.repoService.clearCache();
        this.router.navigate(['/admin/repositories', this.repoId]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  private showError(err: any) {
    console.error('Validation Error Details:', err.error);
    let errorMsg = 'Error saving repository.';
    if (err.error?.errors) {
      const fieldErrors = Object.entries(err.error.errors)
        .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('\n');
      errorMsg += '\n\n' + fieldErrors;
    } else if (err.error?.message) {
      errorMsg += '\n\n' + err.error.message;
    }
    this.toast.error(errorMsg);
  }
}
