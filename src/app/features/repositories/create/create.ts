import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, combineLatest } from 'rxjs';
import { CONFIG } from '../../../config/config';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ThemeService } from '../../../core/services/theme.service';
import { RepositoryService } from '../../../core/services/repository.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { TitleCasePipe, NgIf } from '@angular/common';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-create',
  imports: [FormsModule, MonacoEditorModule, RouterLink, TitleCasePipe, QuillModule, NgIf],
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class Create implements OnInit {
methodColors: { [key: string]: string } = {
  GET: '#0CBB52',
  POST: '#FFB400',
  PUT: '#097BED',
  PATCH: '#A359DF',
  DELETE: '#E05353',
  HEAD: '#009688',
  OPTIONS: '#E15599'
};

getMethodColor(method: string): string {
  return this.methodColors[method?.toUpperCase()] || '#000000';
}

  // Edit mode
  isEditMode = false;
  repoId: number | null = null;

  repo_name = '';
  repo_stack: string[] = [];
  repo_status = '';
  repo_branch = 'main';
  repo_arch = '';
  repo_apis: { method: string, path: string, desc: string, headers?: string, payload?: string, response?: string }[] = [];
  repo_schema = '';
  repo_init_author = '';
  repo_init_date = new Date().toISOString().split('T')[0];
  repo_deadline = '';
  repo_issues = '';
  repo_review_log = '';
  repo_major_commits = '';
  repo_code_snippet = '';
  repo_code_snippets: { title: string, code: string }[] = [];
  selectedSnippetIndex = 0;
  repo_getting_started = '';
  repo_env = '';
  repo_deployment = '';
  repo_coding_standards = '';
  repo_architecture_diagram = '';

  repo_access: { emp_id: string, name: string, can: string, role_id?: number | null, role_catagory?: string }[] = [];
  deletedRoles: number[] = [];
  repo_maintainer: string = '';
  availableUsers: any[] = [];
  allUsers: any[] = [];
  roleOptions: { category: string, roles: string[] }[] = [];

  activeTab: string = 'basic';
  isSubmitting = false;

  // Files & Docs staging properties
  stagedFiles: { file: File, name: string, desc: string }[] = [];
  existingFiles: any[] = [];
  newFileName = '';
  newFileDesc = '';
  selectedFileToUpload: File | null = null;
  isUploadingFile = false;

  // Whiteboard property
  whiteboardUrl: SafeResourceUrl | null = null;
  selectedBranchId: number | null = null;

  // Dynamic options tracking (will come from DB)
  stackOptions: { id: number | string, name: string }[] = [];
  statusOptions: { id: number | string, name: string }[] = [];
  archOptions: { id: number | string, name: string }[] = [];
  branchOptions: { id: number | string, name: string }[] = [];
  // Manage Modal State
  showManageModal = false;
  managingType: 'stack' | 'status' | 'arch' | 'branch' | null = null;
  newManageItemName = '';
  itemToDelete: any = null;

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



  get availableAccessUsers() {
    return this.availableUsers.filter(u => 
      !this.repo_access.some(a => a.emp_id === (u.emp_id || u.id))
    );
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
    private toast: ToastService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.editorOptions = {
      ...this.editorOptions,
      theme: this.themeService.isDarkMode ? 'vs-dark' : 'vs'
    };

    // Check if editing
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const branchIdStr = queryParams.get('branch_id');
      if (branchIdStr) {
        this.selectedBranchId = parseInt(branchIdStr, 10);
      } else {
        this.selectedBranchId = null;
      }

      const idStr = params.get('id');
      if (idStr) {
        this.isEditMode = true;
        this.repoId = parseInt(idStr, 10);
        this.loadRepoData(this.repoId);
        this.fetchExistingFiles(this.repoId);
      } else {
        this.repo_init_author = localStorage.getItem('emp_name') || localStorage.getItem('admin_name') || '';
      }
    });

    this.fetchUsers();
    this.fetchStatuses();
    this.fetchArchitectures();
    this.fetchStacks();
    this.fetchBranches();
    this.fetchRoleOptions();
  }

  fetchRoleOptions() {
    this.http.get(`${CONFIG.BASE_URL}/repo-roles/options`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.roleOptions = Object.keys(res.data).map(category => ({
            category,
            roles: res.data[category]
          }));
        }
      },
      error: () => {}
    });
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
      error: () => {}
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
      error: () => {}
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
      error: () => {}
    });
  }

  fetchBranches() {
    this.http.get(`${CONFIG.BASE_URL}/branches`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        let repoBranches = data;
        
        if (this.repoId) {
          // Filter to only show branches for THIS specific repository
          repoBranches = data.filter((item: any) => item.repository_id == this.repoId);
        } else {
          repoBranches = [];
        }

        this.branchOptions = repoBranches.map((item: any) => ({
          id: item.id || Date.now(),
          name: item.repo_branch_name || item.branch_name || item.name || 'Unknown'
        }));
        
        // Ensure the currently selected branch is still an option if it's not in the list
        if (this.repo_branch && !this.branchOptions.some(b => b.name === this.repo_branch)) {
          this.branchOptions.push({ id: Date.now(), name: this.repo_branch });
        }
      },
      error: () => {}
    });
  }

  fetchUsers() {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        const users = Array.isArray(res) ? res : (res.data || []);
        this.allUsers = users;
        // Filter out admins since they have default access
        this.availableUsers = users.filter((u: any) => u.emp_role !== 'admin');
      },
      error: () => {}
    });
  }

  onEnvFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.includes('.env')) {
      this.toast.error('Only .env files are allowed');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      if (this.repo_env) {
        this.repo_env = this.repo_env + '\n' + content;
      } else {
        this.repo_env = content;
      }
      this.toast.success('.env file imported successfully');
    };
    reader.onerror = () => {
      this.toast.error('Failed to read the .env file');
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again if needed
    const target = event.target as HTMLInputElement;
    if (target) target.value = '';
  }

  onSqlFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      this.toast.error('Only .sql files are allowed');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      if (this.repo_schema) {
        this.repo_schema = this.repo_schema + '\n\n' + content;
      } else {
        this.repo_schema = content;
      }
      this.toast.success('.sql file imported successfully');
    };
    reader.onerror = () => {
      this.toast.error('Failed to read the .sql file');
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again if needed
    const target = event.target as HTMLInputElement;
    if (target) target.value = '';
  }

  loadRepoData(id: number) {
    this.repoService.getRepositoryById(id, this.selectedBranchId || undefined).subscribe({
      next: (res: any) => {
        const repo = res.data || res;
        
        // Generate sanitized whiteboard URL
        const rawUrl = `${CONFIG.BASE_URL.replace('/api', '')}/whiteboard.html?repo_id=${id}&token=${localStorage.getItem('token')}&theme=${this.themeService.isDarkMode ? 'dark' : 'light'}`;
        this.whiteboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);

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
        this.repo_code_snippets = repo.repo_code_snippets || [];
        if (this.repo_code_snippets.length === 0 && repo.repo_code_snippet) {
          this.repo_code_snippets = [{ title: 'Main Code Snippet', code: repo.repo_code_snippet }];
        }
        this.selectedSnippetIndex = 0;
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
            desc: api?.desc || '',
            headers: api?.headers || '',
            payload: api?.payload || '',
            response: api?.response || ''
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
          role_id: access.pivot?.id || access.id || null,
          name: access.name || access.emp_name || 'Unknown',
          role_catagory: access.role_catagory || access.pivot?.role_catagory || null,
          can: access.role_name || access.can || access.role || access.repo_role || access.access_level || access.pivot?.can || access.pivot?.role || access.pivot?.role_name || 'view'
        }));

        // Fetch exact roles from repo-roles table to ensure accurate role tracking in edit mode
        this.http.get(`${CONFIG.BASE_URL}/repo-roles`).subscribe({
          next: (roleRes: any) => {
            const data = Array.isArray(roleRes) ? roleRes : (roleRes.data || []);
            const currentRepoRoles = data.filter((r: any) => r.repo_id == id && r.branch_id == this.selectedBranchId);
            
            // Map the actual assigned roles back into the UI state
            this.repo_access.forEach(access => {
              const matchedRole = currentRepoRoles.find((r: any) => r.emp_id == (access.emp_id || (access as any).id));
              if (matchedRole) {
                access.role_id = matchedRole.id;
                access.can = matchedRole.role_name;
                access.role_catagory = matchedRole.role_catagory;
              }
            });

            // Add any missing users that exist in repo-roles but not in the main repo_access array
            currentRepoRoles.forEach((role: any) => {
              if (!this.repo_access.some(a => a.emp_id == role.emp_id)) {
                this.repo_access.push({
                  emp_id: role.emp_id.toString(),
                  role_id: role.id,
                  can: role.role_name,
                  role_catagory: role.role_catagory,
                  name: this.allUsers.find(u => u.emp_id == role.emp_id)?.emp_name || 'Unknown'
                });
              }
            });
          }
        });

        // Handle repo maintainer
        this.repo_maintainer = repo.repo_maintainer ? repo.repo_maintainer.toString() : '';
      },
      error: () => {
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

  confirmDeleteManageItem(item: any) {
    this.itemToDelete = item;
  }

  cancelDeleteManageItem() {
    this.itemToDelete = null;
  }

  executeDeleteManageItem() {
    if (!this.itemToDelete) return;
    const id = this.itemToDelete.id;
    
    if (this.managingType === 'status') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-statuses/${id}`).subscribe({
        next: () => {
          this.toast.success('Status deleted successfully');
          this.itemToDelete = null;
          this.fetchStatuses();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'stack') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-stacks/${id}`).subscribe({
        next: () => {
          this.toast.success('Stack deleted successfully');
          this.itemToDelete = null;
          this.fetchStacks();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'arch') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-architectures/${id}`).subscribe({
        next: () => {
          this.toast.success('Architecture deleted successfully');
          this.itemToDelete = null;
          this.fetchArchitectures();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'branch') {
      this.http.delete(`${CONFIG.BASE_URL}/branches/${id}`).subscribe({
        next: () => {
          this.toast.success('Branch deleted successfully');
          this.itemToDelete = null;
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
        repository_id: this.repoId || 1, // Fallback to 1 if creating new
        repo_branch_name: name,
        repo_branch_initer: localStorage.getItem('emp_id') || 260623102611,
        repo_branch_desc: 'Added from UI',
        repo_branch_commit: 0
      };
      
      this.http.post(`${CONFIG.BASE_URL}/branches`, payload).subscribe({
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
    this.repo_apis.push({ method: 'GET', path: '', desc: '', payload: '', response: '' });
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
        can: '', // default empty so they select a role
        role_id: null
      });
    }
    event.target.value = '';
  }

  removeAccessUser(index: number) {
    const removed = this.repo_access[index];
    if (removed && removed.role_id) {
      this.deletedRoles.push(removed.role_id);
    }
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
      repo_access: this.repo_access.map((a: any) => {
        let category = a.role_catagory || '';
        for (const group of this.roleOptions) {
          if (group.roles.includes(a.can)) {
            category = group.category;
            break;
          }
        }
        if (!category) {
          category = 'Management';
        }
        return {
          emp_id: a.emp_id,
          role_catagory: category,
          role_name: a.can
        };
      }),
      repo_maintainer: this.repo_maintainer || null
    };

    payload.repo_code_snippets = this.repo_code_snippets;

    this.http.post(`${CONFIG.BASE_URL}/repositories`, payload).subscribe({
      next: (res: any) => {
        const newRepoId = res.data?.id || res.id;
        if (newRepoId) {
          this.uploadStagedFilesAndAssignRoles(newRepoId);
        } else {
          this.isSubmitting = false;
          this.toast.error('Failed to resolve new repository ID.');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  uploadStagedFilesAndAssignRoles(newRepoId: number) {
    const fileUploadRequests = this.stagedFiles.map(sf => {
      const formData = new FormData();
      formData.append('file', sf.file);
      formData.append('file_name', sf.name);
      formData.append('file_description', sf.desc);
      return this.http.post(`${CONFIG.BASE_URL}/repositories/${newRepoId}/files`, formData);
    });

    const roleRequests = this.repo_access
      .filter((a: any) => {
        // Only create roles that are in the configured categories
        return this.roleOptions.some(group => group.roles.includes(a.can));
      })
      .map((a: any) => {
        let category = '';
        for (const group of this.roleOptions) {
          if (group.roles.includes(a.can)) {
            category = group.category;
            break;
          }
        }
        return this.http.post(`${CONFIG.BASE_URL}/repo-roles`, { emp_id: a.emp_id, repo_id: newRepoId, branch_id: this.selectedBranchId, role_catagory: category, role_name: a.can });
      });

    const allRequests = [...fileUploadRequests, ...roleRequests];

    if (allRequests.length > 0) {
      forkJoin(allRequests).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Repository created, roles assigned, and files uploaded!');
          this.repoService.clearCache();
          this.router.navigate(['/admin/repositories']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showError(err);
        }
      });
    } else {
      this.isSubmitting = false;
      this.toast.success('Repository created successfully!');
      this.repoService.clearCache();
      this.router.navigate(['/admin/repositories']);
    }
  }

  fetchExistingFiles(id: number) {
    this.http.get(`${CONFIG.BASE_URL}/repositories/${id}/files`).subscribe({
      next: (res: any) => {
        this.existingFiles = res.data || [];
      },
      error: (err) => {
        console.error('Failed to fetch existing files', err);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileToUpload = file;
      if (!this.newFileName.trim()) {
        const dotIndex = file.name.lastIndexOf('.');
        this.newFileName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      }
    }
  }

  stageFile() {
    if (!this.selectedFileToUpload || !this.newFileName.trim()) {
      this.toast.warning('Please select a file and enter a name.');
      return;
    }
    this.stagedFiles.push({
      file: this.selectedFileToUpload,
      name: this.newFileName.trim(),
      desc: this.newFileDesc.trim()
    });
    this.newFileName = '';
    this.newFileDesc = '';
    this.selectedFileToUpload = null;
    const fileInput = document.getElementById('createRepoFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.toast.success('File staged for upload!');
  }

  unstageFile(index: number) {
    this.stagedFiles.splice(index, 1);
    this.toast.success('File removed from staged list.');
  }

  uploadFileDirectly() {
    if (!this.repoId || !this.selectedFileToUpload || !this.newFileName.trim()) {
      this.toast.warning('Please select a file and enter a name.');
      return;
    }

    this.isUploadingFile = true;
    const formData = new FormData();
    formData.append('file', this.selectedFileToUpload);
    formData.append('file_name', this.newFileName.trim());
    formData.append('file_description', this.newFileDesc.trim());

    this.http.post(`${CONFIG.BASE_URL}/repositories/${this.repoId}/files`, formData).subscribe({
      next: (res: any) => {
        this.isUploadingFile = false;
        this.toast.success('File uploaded successfully!');
        this.newFileName = '';
        this.newFileDesc = '';
        this.selectedFileToUpload = null;
        const fileInput = document.getElementById('createRepoFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.fetchExistingFiles(this.repoId!);
      },
      error: (err) => {
        this.isUploadingFile = false;
        this.showError(err);
      }
    });
  }

  deleteExistingFile(fileId: number) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    this.http.delete(`${CONFIG.BASE_URL}/repo-files/${fileId}`).subscribe({
      next: () => {
        this.toast.success('File deleted successfully!');
        if (this.repoId) this.fetchExistingFiles(this.repoId);
      },
      error: (err) => {
        console.error('Failed to delete file', err);
        this.toast.error(err.error?.message || 'Failed to delete file.');
      }
    });
  }

  updateRepo() {
    const payload: any = {
      emp_id: this.getEmpId(),
      branch_id: this.selectedBranchId,
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
      repo_access: this.repo_access.map((a: any) => {
        let category = a.role_catagory || '';
        for (const group of this.roleOptions) {
          if (group.roles.includes(a.can)) {
            category = group.category;
            break;
          }
        }
        if (!category) {
          category = 'Management';
        }
        return {
          emp_id: a.emp_id,
          role_catagory: category,
          role_name: a.can
        };
      }),
      repo_maintainer: this.repo_maintainer || null
    };

    payload.repo_code_snippets = this.repo_code_snippets;

    this.http.put(`${CONFIG.BASE_URL}/repositories/${this.repoId}`, payload).subscribe({
      next: () => {
        const requests: any[] = [];
        
        // Add delete requests for removed roles
        this.deletedRoles.forEach(roleId => {
          requests.push(this.http.delete(`${CONFIG.BASE_URL}/repo-roles/${roleId}`));
        });

        if (payload.repo_access.length > 0) {
          const updateRequests = this.repo_access
            .filter((a: any) => {
              // Only update roles that are in the configured categories
              return this.roleOptions.some(group => group.roles.includes(a.can));
            })
            .map((a: any) => {
              let category = '';
              for (const group of this.roleOptions) {
                if (group.roles.includes(a.can)) {
                  category = group.category;
                  break;
                }
              }
              if (a.role_id) {
                return this.http.put(`${CONFIG.BASE_URL}/repo-roles/${a.role_id}`, { role_catagory: category, role_name: a.can, branch_id: this.selectedBranchId });
              } else {
                return this.http.post(`${CONFIG.BASE_URL}/repo-roles`, { emp_id: a.emp_id, repo_id: this.repoId, branch_id: this.selectedBranchId, role_catagory: category, role_name: a.can });
              }
            });
            requests.push(...updateRequests);
        }

        if (requests.length > 0) {
          forkJoin(requests).subscribe({
            next: () => {
              this.isSubmitting = false;
              this.toast.success('Repository and roles updated successfully!');
              this.repoService.clearCache();
              this.router.navigate(['/admin/repositories', this.repoId]);
            },
            error: (err) => {
              this.isSubmitting = false;
              this.showError(err);
            }
          });
        } else {
          this.isSubmitting = false;
          this.toast.success('Repository updated successfully!');
          this.repoService.clearCache();
          this.router.navigate(['/admin/repositories', this.repoId]);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  downloadEnvFile() {
    if (!this.repo_env || !this.repo_env.trim()) {
      this.toast.warning('No environment variables to download.');
      return;
    }
    const blob = new Blob([this.repo_env], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    link.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('.env file downloaded successfully');
  }

  downloadSqlFile() {
    if (!this.repo_schema || !this.repo_schema.trim()) {
      this.toast.warning('No database schema to download.');
      return;
    }
    const blob = new Blob([this.repo_schema], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.sql';
    link.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('Database schema (.sql) downloaded successfully');
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

  addSnippet() {
    this.repo_code_snippets.push({
      title: 'New Snippet ' + (this.repo_code_snippets.length + 1),
      code: '// Enter code here...'
    });
    this.selectedSnippetIndex = this.repo_code_snippets.length - 1;
  }

  deleteSnippet(index: number) {
    this.repo_code_snippets.splice(index, 1);
    if (this.selectedSnippetIndex >= this.repo_code_snippets.length) {
      this.selectedSnippetIndex = this.repo_code_snippets.length - 1;
    }
  }

  getSelectedSnippetCode(): string {
    if (this.selectedSnippetIndex >= 0 && this.selectedSnippetIndex < this.repo_code_snippets.length) {
      return this.repo_code_snippets[this.selectedSnippetIndex].code;
    }
    return '';
  }

  setSelectedSnippetCode(code: string) {
    if (this.selectedSnippetIndex >= 0 && this.selectedSnippetIndex < this.repo_code_snippets.length) {
      this.repo_code_snippets[this.selectedSnippetIndex].code = code;
    }
  }
}
