import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { RepositoryService } from '../../../core/services/repository.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { Topbar } from '../../../shared/topbar/topbar';
import mermaid from 'mermaid';

@Component({
  selector: 'app-details',
  imports: [CommonModule, DatePipe, RouterLink, MonacoEditorModule, FormsModule, Topbar],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit, OnDestroy {
  getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return '#0CBB52';     // Green
    case 'POST': return '#FFB400';    // Yellow / Gold
    case 'PUT': return '#097BED';     // Blue
    case 'PATCH': return '#A359DF';   // Purple
    case 'DELETE': return '#E05353';  // Red
    case 'HEAD': return '#009688';    // Teal
    case 'OPTIONS': return '#E15599'; // Pink
    default: return '#999999';        // Fallback gray
  }
}

  activeTab = 'overview';
  repoId: number | null = null;
  repo: any = null;
  isLoading = true;
  isDev = false;
  private mermaidRendered = false;
  private pollInterval: any;
  
  commit_message = '';
  selectedBranchId = '';
  repoBranches: any[] = [];
  
  allUsers: any[] = [];
  maintainerName: string = 'None';
  repoRoles: any[] = [];

  // Files & Docs feature properties
  repoFiles: any[] = [];
  newFileName = '';
  newFileDesc = '';
  selectedFileToUpload: File | null = null;
  isUploadingFile = false;

  // Whiteboard property
  whiteboardUrl: SafeResourceUrl | null = null;

  editorOptions = { 
    theme: 'vs', 
    language: 'javascript', 
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    minimap: { enabled: false },
    readOnly: true,
    scrollBeyondLastLine: false,
    padding: { top: 16 }
  };

  @ViewChild('mermaidContainer') mermaidContainer!: ElementRef;

  get parsedInstallSteps(): string[] {
    if (!this.repo?.repo_getting_started) return [];
    return String(this.repo.repo_getting_started).split('\n').filter((s: string) => s.trim() !== '');
  }

  get parsedDeploymentSteps(): string[] {
    if (!this.repo?.repo_deployment) return [];
    return String(this.repo.repo_deployment).split('\n').filter((s: string) => s.trim() !== '');
  }

  get parsedEnvVars(): {key: string, value: string}[] {
    if (!this.repo?.repo_env) return [];
    return String(this.repo.repo_env).split('\n')
      .map((line: string) => {
        const [key, ...val] = line.split('=');
        return { key: (key || '').trim(), value: val.join('=').trim() };
      })
      .filter((e: any) => e.key);
  }

  get parsedApis(): any[] {
    if (!this.repo?.repo_apis) return [];
    try {
      const parsed = typeof this.repo.repo_apis === 'string' 
        ? JSON.parse(this.repo.repo_apis) 
        : this.repo.repo_apis;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ method: 'INFO', path: 'Raw Text', desc: this.repo.repo_apis }];
    }
  }

  constructor(
    private route: ActivatedRoute,
    private repoService: RepositoryService,
    private http: HttpClient,
    public themeService: ThemeService,
    private toast: ToastService,
    private sanitizer: DomSanitizer
  ) {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      securityLevel: 'loose'
    });
  }

  ngOnInit() {
    this.fetchUsers();
    const role = localStorage.getItem('role') || '';
    this.isDev = ['sr-dev', 'jr-dev', 'dev'].includes(role);

    this.editorOptions = {
      ...this.editorOptions,
      theme: this.themeService.isDarkMode ? 'vs-dark' : 'vs'
    };

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.repoId = parseInt(idStr, 10);
        this.fetchRepoDetails(this.repoId);
        this.fetchBranches(this.repoId);
        this.fetchRepoRoles(this.repoId);
        this.fetchRepoFiles(this.repoId);
        
        // Auto reload every 1.5 seconds (1500 ms) as requested
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => {
          if (this.repoId) {
            this.fetchRepoDetails(this.repoId, true);
            this.fetchRepoRoles(this.repoId);
          }
        }, 1500);
      }
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  fetchRepoDetails(id: number, isPolling = false) {
    if (!isPolling && !this.repo) this.isLoading = true;
    this.repoService.getRepositoryById(id).subscribe({
      next: (res: any) => {
        const oldDiagram = this.repo?.repo_architecture_diagram;
        this.repo = res.data || res;
        this.isLoading = false;
        
        this.updateMaintainerName();
        // Generate sanitized whiteboard URL only once to avoid iframe reloads during polling
        if (!this.whiteboardUrl) {
          const rawUrl = `${CONFIG.BASE_URL.replace('/api', '')}/whiteboard.html?repo_id=${id}&token=${localStorage.getItem('token')}&theme=${this.themeService.isDarkMode ? 'dark' : 'light'}`;
          this.whiteboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
        }
        if (oldDiagram !== this.repo.repo_architecture_diagram) {
          this.mermaidRendered = false;
          if (this.activeTab === 'architecture') {
            setTimeout(() => this.renderMermaid(), 100);
          }
        }
      },
      error: (err) => {
        if (!isPolling) this.isLoading = false;
      }
    });
  }

  fetchBranches(id: number) {
    this.http.get(`${CONFIG.BASE_URL}/branches`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.repoBranches = data.filter((item: any) => item.repository_id == id);
      },
      error: () => {}
    });
  }

  fetchRepoRoles(id: number) {
    this.http.get(`${CONFIG.BASE_URL}/repo-roles`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.repoRoles = data.filter((item: any) => item.repo_id == id);
      },
      error: () => {}
    });
  }

  fetchUsers() {
    this.http.get(`${CONFIG.BASE_URL}/users`).subscribe({
      next: (res: any) => {
        this.allUsers = Array.isArray(res) ? res : (res.data || []);
        this.updateMaintainerName();
      },
      error: () => {}
    });
  }

  updateMaintainerName() {
    if (!this.repo?.repo_maintainer || this.allUsers.length === 0) return;
    const mId = this.repo.repo_maintainer.toString();
    const user = this.allUsers.find(u => (u.emp_id || u.id)?.toString() === mId);
    if (user) {
      const designation = user.emp_role || user.designation || user.role || 'No Designation';
      this.maintainerName = `${user.emp_name || user.name || 'Unknown User'} (${designation})`;
    } else {
      this.maintainerName = `Unknown (ID: ${mId})`;
    }
  }

  getUserName(empId: any): string {
    if (!empId || this.allUsers.length === 0) return 'Unknown User';
    const user = this.allUsers.find(u => (u.emp_id || u.id)?.toString() === String(empId));
    return user ? (user.emp_name || user.name || 'Unknown User') : 'Unknown User';
  }

  addCommit() {
    if (!this.commit_message.trim()) {
      this.toast.error('Commit message cannot be empty');
      return;
    }
    
    // Construct commit entry
    const branchName = this.repoBranches.find(b => String(b.id) === String(this.selectedBranchId))?.repo_branch_name || 'main';
    const commitEntry = `[${branchName}] ${this.commit_message.trim()}`;
    
    // Prepare updated array
    let currentCommits = [];
    if (this.repo.repo_major_commits) {
      currentCommits = Array.isArray(this.repo.repo_major_commits) 
        ? [...this.repo.repo_major_commits] 
        : typeof this.repo.repo_major_commits === 'string' 
          ? this.repo.repo_major_commits.split('\n').filter((x: string) => x.trim())
          : [this.repo.repo_major_commits];
    }
    currentCommits.push(commitEntry);

    const payload = {
      repo_major_commits: currentCommits
    };

    if (this.repoId) {
      this.http.put(`${CONFIG.BASE_URL}/repositories/${this.repoId}`, payload).subscribe({
        next: () => {
          this.toast.success('Commit added successfully');
          this.commit_message = '';
          this.fetchRepoDetails(this.repoId!, true);
        },
        error: () => {
          this.toast.error('Failed to add commit');
        }
      });
    }
  }

  onArchitectureTabActive() {
    this.activeTab = 'architecture';
    // Render mermaid after tab switch with a small delay for DOM
    this.mermaidRendered = false;
    setTimeout(() => this.renderMermaid(), 100);
  }

  async renderMermaid() {
    if (this.mermaidRendered || !this.repo?.repo_architecture_diagram) return;
    
    const container = document.getElementById('mermaid-diagram');
    if (!container) return;

    try {
      container.innerHTML = '';
      const { svg } = await mermaid.render('mermaid-svg', this.repo.repo_architecture_diagram);
      container.innerHTML = svg;
      this.mermaidRendered = true;
    } catch (e) {
      console.error('Mermaid render error:', e);
      container.innerHTML = `<pre style="color: #ef4444; padding: 1rem;">Failed to render diagram. Check Mermaid syntax.\n\nRaw:\n${this.repo.repo_architecture_diagram}</pre>`;
    }
  }

  copyToClipboard(text: any) {
    if (!text) return;
    
    // Ensure we are copying a string
    const stringText = typeof text === 'string' ? text : JSON.stringify(text, null, 2);

    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(stringText).then(() => {
        this.toast.success('Copied to clipboard!');
      }).catch(err => {
        console.warn('Clipboard API failed, trying fallback...', err);
        this.fallbackCopyTextToClipboard(stringText);
      });
    } else {
      // Fallback for non-secure contexts (HTTP) or older browsers
      this.fallbackCopyTextToClipboard(stringText);
    }
  }

  private fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Make it invisible and prevent scrolling
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.toast.success('Copied to clipboard!');
      } else {
        this.toast.error('Failed to copy. Please try manually.');
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
      this.toast.error('Failed to copy. Please try manually.');
    }
    
    document.body.removeChild(textArea);
  }

  copyApis() {
    if (!this.parsedApis || this.parsedApis.length === 0) return;
    const text = this.parsedApis.map(api => `[${api.method || 'GET'}] ${api.path || 'N/A'}\nDescription: ${api.desc || 'No description'}`).join('\n\n');
    this.copyToClipboard(text);
  }

  // Files & Docs feature methods
  fetchRepoFiles(id: number) {
    this.http.get(`${CONFIG.BASE_URL}/repositories/${id}/files`).subscribe({
      next: (res: any) => {
        this.repoFiles = res.data || [];
      },
      error: (err) => {
        console.error('Failed to fetch files', err);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileToUpload = file;
      if (!this.newFileName.trim()) {
        // Pre-populate name with the file's original name without extension (cleaner)
        const dotIndex = file.name.lastIndexOf('.');
        this.newFileName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      }
    }
  }

  uploadFile() {
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
        // Reset file input element
        const fileInput = document.getElementById('repoFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.fetchRepoFiles(this.repoId!);
      },
      error: (err) => {
        this.isUploadingFile = false;
        console.error('Failed to upload file', err);
        this.toast.error(err.error?.message || 'Failed to upload file. Please try again.');
      }
    });
  }

  deleteFile(fileId: number) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    this.http.delete(`${CONFIG.BASE_URL}/repo-files/${fileId}`).subscribe({
      next: () => {
        this.toast.success('File deleted successfully!');
        if (this.repoId) this.fetchRepoFiles(this.repoId);
      },
      error: (err) => {
        console.error('Failed to delete file', err);
        this.toast.error(err.error?.message || 'Failed to delete file.');
      }
    });
  }

  downloadEnvFile() {
    if (!this.repo?.repo_env || !this.repo.repo_env.trim()) {
      this.toast.warning('No environment variables to download.');
      return;
    }
    const blob = new Blob([this.repo.repo_env], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    link.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('.env file downloaded successfully');
  }

  downloadSqlFile() {
    if (!this.repo?.repo_schema || !this.repo.repo_schema.trim()) {
      this.toast.warning('No database schema to download.');
      return;
    }
    const blob = new Blob([this.repo.repo_schema], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.sql';
    link.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('Database schema (.sql) downloaded successfully');
  }
}
