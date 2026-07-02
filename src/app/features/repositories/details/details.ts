import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { RepositoryService } from '../../../core/services/repository.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import mermaid from 'mermaid';

@Component({
  selector: 'app-details',
  imports: [CommonModule, DatePipe, RouterLink, MonacoEditorModule, FormsModule],
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
  selectedBranchId: any = null;
  repoBranches: any[] = [];
  
  allUsers: any[] = [];
  maintainerName: string = 'None';
  repoRoles: any[] = [];
  activityLogs: any[] = [];

  // Branch creation properties
  showCreateBranchModal = false;
  newBranchName = '';
  newBranchDesc = '';

  // Conversation/Chat properties
  chatMessages: any[] = [];
  newChatMessage = '';
  private chatInterval: any;
  private lastLoadedBranchId: any = null;
  
  // Mentions
  showMentions = false;
  mentionOptions: any[] = [];
  filteredMentionOptions: any[] = [];
  mentionSearchText = '';
  mentionCursorPosition = 0;

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
  selectedSnippetIndex: number = 0;
  isFullscreenView: boolean = false;
  isFullscreenWhiteboard: boolean = false;
  isFullscreenMermaid: boolean = false;

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

  // DB Diagram state
  dbDiagramSvg: SafeHtml | null = null;
  showDbDiagram = false;
  showRawSql = false;

  // Pan and Zoom state for Diagrams
  zoomScale = 1;
  panX = 0;
  panY = 0;
  isDragging = false;
  startX = 0;
  startY = 0;

  resetPanZoom() {
    this.zoomScale = 1;
    this.panX = 0;
    this.panY = 0;
  }

  onWheel(event: WheelEvent, container: HTMLElement) {
    const isFullscreen = this.isFullscreenMermaid || this.isFullscreenView;
    if (!isFullscreen) return;

    event.preventDefault();
    const zoomDelta = event.deltaY < 0 ? 0.1 : -0.1;
    this.zoomScale = Math.max(0.2, Math.min(5, this.zoomScale + zoomDelta));
    this.updateTransform(container);
  }

  onMouseDown(event: MouseEvent) {
    const isFullscreen = this.isFullscreenMermaid || this.isFullscreenView;
    if (!isFullscreen) return;
    this.isDragging = true;
    this.startX = event.clientX - this.panX;
    this.startY = event.clientY - this.panY;
  }

  onMouseMove(event: MouseEvent, container: HTMLElement) {
    if (!this.isDragging) return;
    this.panX = event.clientX - this.startX;
    this.panY = event.clientY - this.startY;
    this.updateTransform(container);
  }

  onMouseUp() {
    this.isDragging = false;
  }

  updateTransform(container: HTMLElement) {
    const svg = container.querySelector('svg');
    if (svg) {
      // Ensuring the SVG can be moved freely without clipping
      svg.style.overflow = 'visible';
      svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomScale})`;
      svg.style.transformOrigin = 'center center';
      svg.style.transition = this.isDragging ? 'none' : 'transform 0.1s ease';
    }
  }

  
  parseSqlToMermaid(sql: string): string {
    let mermaidStr = 'erDiagram\n';
    
    let cleanSql = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/IF NOT EXISTS/gi, '')
      .replace(/[`'"]/g, '');
      
    const relationships = new Set<string>();
    const tableNameMap = new Map<string, string>();
    const tableData: any[] = [];

    const alterTableRegex = /ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+(?:CONSTRAINT\s+[a-zA-Z0-9_]+\s+)?FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([a-zA-Z0-9_]+)/gi;
    let match;
    while ((match = alterTableRegex.exec(cleanSql)) !== null) {
      let srcTable = match[1];
      let refTable = match[2];
      if (/^[0-9]/.test(srcTable)) srcTable = 't_' + srcTable;
      if (/^[0-9]/.test(refTable)) refTable = 't_' + refTable;
      relationships.add(`${srcTable} }o--|| ${refTable} : "references"`);
    }
    
    const chunks = cleanSql.split(/CREATE\s+TABLE/i);
    
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      const tableNameMatch = chunk.match(/^([a-zA-Z0-9_]+)/);
      if (!tableNameMatch) continue;
      let tableName = tableNameMatch[1];
      tableNameMap.set(tableName.toLowerCase(), tableName);
      
      const openIdx = chunk.indexOf('(');
      const closeIdx = chunk.lastIndexOf(')');
      if (openIdx === -1 || closeIdx === -1 || closeIdx < openIdx) continue;
      
      let body = chunk.substring(openIdx + 1, closeIdx);
      body = body.replace(/\([^)]+\)/g, (m) => m.replace(/,/g, ' '));
      
      tableData.push({ originalName: tableName, body });
    }

    if (tableData.length === 0) return '';

    tableData.forEach(table => {
      let tableName = table.originalName;
      if (/^[0-9]/.test(tableName)) tableName = 't_' + tableName;
      
      mermaidStr += `  ${tableName} {\n`;
      const lines = table.body.split(',').map((l: string) => l.trim()).filter((l: string) => l);
      
      lines.forEach((line: string) => {
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([a-zA-Z0-9_]+)/i);
        if (fkMatch) {
          let refTable = fkMatch[1];
          if (/^[0-9]/.test(refTable)) refTable = 't_' + refTable;
          relationships.add(`${tableName} }o--|| ${refTable} : "references"`);
          return;
        }

        if (line.match(/^(PRIMARY|UNIQUE|KEY|CONSTRAINT|FULLTEXT|INDEX)/i)) return;

        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          let colName = parts[0].replace(/[^a-zA-Z0-9_]/g, '');
          let colType = parts[1].replace(/[^a-zA-Z0-9_]/g, ''); 
          if (!colName || !colType) return;
          
          const originalColName = colName;
          
          if (/^[0-9]/.test(colName)) colName = 'c_' + colName;
          if (/^[0-9]/.test(colType)) colType = 't_' + colType;

          let keyMarker = '';
          if (line.match(/PRIMARY\s+KEY/i)) keyMarker = 'PK';

          const inlineFk = line.match(/REFERENCES\s+([a-zA-Z0-9_]+)/i);
          if (inlineFk) {
            let refTable = inlineFk[1];
            if (/^[0-9]/.test(refTable)) refTable = 't_' + refTable;
            relationships.add(`${tableName} }o--|| ${refTable} : "references"`);
            keyMarker = 'FK';
          } else if (originalColName.toLowerCase().endsWith('_id')) {
            const possibleRef1 = originalColName.toLowerCase().slice(0, -3);
            const possibleRef2 = possibleRef1 + 's';
            const possibleRef3 = possibleRef1 + 'es';
            
            let foundRef = null;
            if (tableNameMap.has(possibleRef1)) foundRef = tableNameMap.get(possibleRef1);
            else if (tableNameMap.has(possibleRef2)) foundRef = tableNameMap.get(possibleRef2);
            else if (tableNameMap.has(possibleRef3)) foundRef = tableNameMap.get(possibleRef3);
            
            if (foundRef && foundRef.toLowerCase() !== table.originalName.toLowerCase()) {
               let refTable = foundRef;
               if (/^[0-9]/.test(refTable)) refTable = 't_' + refTable;
               relationships.add(`${tableName} }o--|| ${refTable} : "inferred"`);
               if (!keyMarker) keyMarker = 'FK';
            }
          }

          mermaidStr += `    ${colType} ${colName} ${keyMarker}\n`;
        }
      });
      mermaidStr += `  }\n`;
    });

    relationships.forEach(rel => {
      mermaidStr += `  ${rel}\n`;
    });

    return mermaidStr;
  }

  async previewDbDiagram() {
    if (!this.repo?.repo_schema) {
      this.showDbDiagram = false;
      return;
    }
    
    const mermaidSyntax = this.parseSqlToMermaid(this.repo.repo_schema);
    if (!mermaidSyntax) {
      this.showDbDiagram = false;
      return;
    }

    try {
      // re-initialize with current theme just in case
      mermaid.initialize({ startOnLoad: false, theme: this.themeService.isDarkMode ? 'dark' : 'default', securityLevel: 'loose' });
      const id = 'mermaid-db-diagram-' + Date.now();
      const { svg } = await mermaid.render(id, mermaidSyntax);
      this.dbDiagramSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.showDbDiagram = true;
    } catch (err: any) {
      console.error('Mermaid render error:', err);
      console.error('Generated syntax:', mermaidSyntax);
      this.showDbDiagram = false;
    }
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
    private sanitizer: DomSanitizer,
    private location: Location
  ) {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      securityLevel: 'loose'
    });
  }

  get rolePrefix(): string {
    const role = localStorage.getItem('role') || 'dev';
    return role === 'admin' ? '/admin' : '/developer';
  }

  goBack() {
    this.location.back();
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
            if (this.activeTab === 'activity') {
              this.fetchActivityLogs();
            }
          }
        }, 1500);
      }
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
    }
  }

  fetchRepoDetails(id: number, isPolling = false) {
    if (!isPolling && !this.repo) this.isLoading = true;
    this.repoService.getRepositoryById(id, this.selectedBranchId || undefined).subscribe({
      next: (res: any) => {
        const oldDiagram = this.repo?.repo_architecture_diagram;
        this.repo = res.data || res;
        this.isLoading = false;
        
        if (!this.selectedBranchId && this.repo.active_branch?.id) {
          this.selectedBranchId = this.repo.active_branch.id;
        }

        this.updateMaintainerName();
        // Generate sanitized whiteboard URL when selected branch changes
        if (this.lastLoadedBranchId !== this.selectedBranchId || !this.whiteboardUrl) {
          this.lastLoadedBranchId = this.selectedBranchId;
          const rawUrl = `${CONFIG.BASE_URL.replace('/api', '')}/whiteboard.html?repo_id=${id}&branch_id=${this.selectedBranchId || ''}&token=${localStorage.getItem('token')}&theme=${this.themeService.isDarkMode ? 'dark' : 'light'}`;
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

  getGitHubUsername(empId: any): string {
    if (!empId || this.allUsers.length === 0) return '';
    const user = this.allUsers.find(u => (u.emp_id || u.id)?.toString() === String(empId));
    return user ? (user.github_username || '') : '';
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

  onDatabaseTabActive() {
    this.activeTab = 'database';
    // We only preview if we haven't already or if we want to ensure it renders immediately
    setTimeout(() => {
      this.previewDbDiagram();
    }, 100);
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

  onBranchChange(branchId: any) {
    this.selectedBranchId = branchId;
    this.selectedSnippetIndex = 0;
    this.fetchRepoDetails(this.repoId!);
  }

  onActivityTabActive() {
    this.activeTab = 'activity';
    this.fetchActivityLogs();
  }

  fetchActivityLogs() {
    if (!this.repoId) return;
    this.http.get(`${CONFIG.BASE_URL}/repositories/${this.repoId}/activity-logs`).subscribe({
      next: (res: any) => {
        this.activityLogs = res.data || res;
      },
      error: (err) => {
        console.error('Failed to fetch activity logs', err);
      }
    });
  }

  getLoggedEmpId(): string {
    return localStorage.getItem('emp_id') || '';
  }

  makeDefaultBranch() {
    if (!this.repoId || !this.selectedBranchId) return;
    this.http.put(`${CONFIG.BASE_URL}/repositories/${this.repoId}`, {
      repo_branch: this.selectedBranchId
    }).subscribe({
      next: () => {
        this.toast.success('Default branch updated successfully');
        this.fetchRepoDetails(this.repoId!);
      },
      error: (err) => {
        this.toast.error('Failed to update default branch');
      }
    });
  }

  openCreateBranchModal() {
    this.newBranchName = '';
    this.newBranchDesc = '';
    this.showCreateBranchModal = true;
  }

  closeCreateBranchModal() {
    this.showCreateBranchModal = false;
  }

  submitCreateBranch() {
    if (!this.newBranchName.trim()) {
      this.toast.error('Branch name is required');
      return;
    }

    const payload = {
      repository_id: this.repoId,
      branch_name: this.newBranchName.trim(),
      repo_branch_desc: this.newBranchDesc.trim(),
      branch_initer: localStorage.getItem('emp_id')
    };

    this.http.post(`${CONFIG.BASE_URL}/branches`, payload).subscribe({
      next: (res: any) => {
        this.toast.success('Branch created successfully!');
        this.showCreateBranchModal = false;
        this.fetchBranches(this.repoId!);
        if (res.data?.id) {
          this.onBranchChange(res.data.id);
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to create branch');
      }
    });
  }

  onConversationTabActive() {
    this.activeTab = 'conversation';
    this.fetchConversation();
    if (this.chatInterval) clearInterval(this.chatInterval);
    this.chatInterval = setInterval(() => {
      if (this.activeTab === 'conversation') {
        this.fetchConversation(true);
      }
    }, 2000);
  }

  fetchConversation(isPolling = false) {
    if (!this.repoId) return;
    this.http.get(`${CONFIG.BASE_URL}/repositories/${this.repoId}/conversations`).subscribe({
      next: (res: any) => {
        this.chatMessages = res.data || [];
      },
      error: () => {}
    });
  }

  sendChatMessage() {
    if (!this.newChatMessage.trim() || !this.repoId) return;
    const msg = this.newChatMessage.trim();
    this.newChatMessage = '';
    this.showMentions = false;

    this.http.post(`${CONFIG.BASE_URL}/repositories/${this.repoId}/conversations`, {
      message: msg
    }).subscribe({
      next: () => {
        this.fetchConversation();
      },
      error: () => {
        this.toast.error('Failed to send message');
      }
    });
  }

  populateMentionOptions() {
    this.mentionOptions = [];
    
    this.allUsers.forEach(user => {
      this.mentionOptions.push({
        type: 'User',
        name: user.emp_name || user.name || user.emp_id,
        id: user.emp_id
      });
    });

    this.repoBranches.forEach(branch => {
      this.mentionOptions.push({
        type: 'Branch',
        name: branch.repo_branch_name,
        id: branch.id
      });
    });
  }

  onChatInput(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value || '';
    const cursor = input.selectionStart || 0;
    
    const textBeforeCursor = value.substring(0, cursor);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      if (lastAtSymbol === 0 || textBeforeCursor[lastAtSymbol - 1] === ' ') {
        this.showMentions = true;
        this.mentionCursorPosition = lastAtSymbol;
        this.mentionSearchText = textBeforeCursor.substring(lastAtSymbol + 1);
        
        if (this.mentionOptions.length === 0) {
          this.populateMentionOptions();
        }
        
        const search = this.mentionSearchText.toLowerCase();
        this.filteredMentionOptions = this.mentionOptions.filter(opt => 
          opt.name.toLowerCase().includes(search)
        );
        return;
      }
    }
    
    this.showMentions = false;
  }

  selectMention(option: any) {
    const value = this.newChatMessage || '';
    const beforeMention = value.substring(0, this.mentionCursorPosition);
    let endOfMention = this.mentionCursorPosition + 1 + this.mentionSearchText.length;
    const afterMention = value.substring(endOfMention);
    
    this.newChatMessage = `${beforeMention}@${option.name} ${afterMention}`;
    this.showMentions = false;
  }

  getSelectedBranchName(): string {
    const selected = this.repoBranches.find(b => b.id == this.selectedBranchId);
    return selected ? selected.repo_branch_name : (this.repo?.repo_branch || 'None');
  }

  getDisplayStack(): string {
    if (!this.repo?.repo_stack) return 'None';
    if (Array.isArray(this.repo.repo_stack)) {
      return this.repo.repo_stack.join(', ');
    }
    try {
      const parsed = JSON.parse(this.repo.repo_stack);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch {}
    return this.repo.repo_stack;
  }
}
