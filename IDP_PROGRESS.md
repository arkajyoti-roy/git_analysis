# Internal Developer Portal (IDP) — Progress Tracker

> **Project:** GIT_ANALYSIS  
> **Stack:** Angular (Frontend) + Backend API  
> **Last Updated:** 2026-06-22

---

## ✅ What's Done

### 1. Authentication & Role-Based Access
- [x] Login page with credentials
- [x] Auth guard (prevents unauthenticated access)
- [x] Guest guard (redirects logged-in users away from login)
- [x] Role-based guard — `admin`, `sr-dev`, `jr-dev`, `dev`
- [x] Role-based routing (admin panel vs developer dashboard)

### 2. Admin Dashboard
- [x] Stats cards — Total Users, Total Repositories, Pending Scans
- [x] Quick action buttons — navigate to Users / Repositories
- [x] Recent Users table (ID, Name, Email, Role)
- [x] Recent Repositories table (Name, Stack, Status)

### 3. Developer Dashboard
- [x] Welcome message with logged-in user name
- [x] Role badge (Senior / Junior Developer)
- [x] Assigned Issues widget
- [x] Active Repositories widget
- [x] Senior-only widgets — Pending Code Reviews, System Alerts

### 4. User Management
- [x] Create user form
- [x] User list view
- [x] Role assignment

### 5. Repository Management (CRUD)
- [x] Create repository form with fields:
  - Name, Branch, Architecture, APIs (JSON), DB Schema
  - Initial Author, Init Date, Deadline, Status
  - Stack selection (checkboxes), Issues, Review Log, Major Commits
- [x] Monaco code editor for Code Snippets
- [x] Repository list view
- [x] Repository detail view with tabbed layout

### 6. Repository Detail Tabs (Partial IDP)
- [x] **Overview tab** — Stack, Branch, Author, Dates, Architecture, Issues, Commits, Review Log
- [x] **Getting Started tab** — Parsed install steps displayed as terminal commands
- [x] **Architecture tab** — Shows architecture type as text (e.g. "Microservices")
- [x] **APIs tab** — Table with Method, Endpoint, Description (parsed from JSON)
- [x] **Database tab** — Raw schema text display
- [x] **Environment tab** — Key=Value pairs parsed and displayed

### 7. UI / Shared Components
- [x] Admin layout with sidebar
- [x] Topbar component
- [x] Dark/Light theme toggle (ThemeService)
- [x] CSS variables for theming

### 8. Services
- [x] RepositoryService (with caching)
- [x] UserService
- [x] ThemeService

---

## ❌ What Needs To Be Done

### Step 1: Add Deployment Guide Section
> *Priority: High — Every project needs this*

- [ ] Add `deployment` tab in repository details
- [ ] Add `repo_deployment` field in create form (textarea)
- [ ] Store deployment steps for Dev / Staging / Production
- [ ] Display with structured sections (server details, build process, rollback)
- [ ] Backend: add `repo_deployment` column to database

### Step 2: Add Coding Standards Section
> *Priority: High — Improves code quality across team*

- [ ] Add `coding-standards` tab in repository details
- [ ] Add `repo_coding_standards` field in create form
- [ ] Cover: naming conventions, folder structure, error handling patterns
- [ ] Support markdown rendering for formatted display
- [ ] Backend: add `repo_coding_standards` column to database

### Step 3: Build Troubleshooting Wiki
> *Priority: High — Most valuable section over time*

- [ ] Replace raw `repo_issues` text with structured troubleshooting entries
- [ ] Each entry should have: Error Message, Possible Causes, Solution
- [ ] Add `troubleshooting` tab in repository details
- [ ] Allow adding/editing troubleshooting entries (not just one text blob)
- [ ] Backend: create `troubleshooting` table (repo_id, error, causes, solution)

### Step 4: Add Architecture Diagrams
> *Priority: Medium — Visual understanding of system*

- [ ] Integrate Mermaid.js for diagram rendering
- [ ] Add `repo_architecture_diagram` field (Mermaid syntax textarea)
- [ ] Render diagram in the Architecture tab alongside text description
- [ ] Provide example Mermaid templates in the form placeholder
- [ ] Backend: add `repo_architecture_diagram` column to database

### Step 5: Add Environment Variable Descriptions
> *Priority: Medium — Helps onboarding*

- [ ] Change env format from `KEY=VALUE` to `KEY=VALUE # description`
- [ ] Parse and display description alongside each variable
- [ ] Or: switch to structured JSON format with key, value, description fields

### Step 6: Build Full-Text Search
> *Priority: Medium — Core IDP feature*

- [ ] Add search bar in topbar / sidebar
- [ ] Search across: repo names, APIs, schemas, getting started, issues
- [ ] Highlight matching results
- [ ] Navigate to specific repo + tab on click
- [ ] Backend: implement search API endpoint

### Step 7: Add Team Knowledge Base
> *Priority: Medium — For SOPs and integration notes*

- [ ] Create new feature module: `features/knowledge-base/`
- [ ] CRUD for knowledge articles (title, category, content, author, date)
- [ ] Categories: Integration Notes, Workflows, SOPs, Meeting Minutes
- [ ] Markdown support for article content
- [ ] Link articles to specific repositories
- [ ] Backend: create `knowledge_articles` table
- [ ] Add route + sidebar navigation

### Step 8: Add Versioned Documentation
> *Priority: Low — Nice to have*

- [ ] Track document edit history (who changed what, when)
- [ ] Show version diff / changelog per repository
- [ ] Allow rollback to previous documentation version
- [ ] Backend: create `doc_versions` table (repo_id, field, old_value, new_value, changed_by, timestamp)

### Step 9: Add Team Directory
> *Priority: Low — Existing user list partially covers this*

- [ ] Enhance user list to show: role, assigned repos, contact info, expertise
- [ ] Filter by team / project
- [ ] Show who's responsible for which repository

### Step 10: Add Meeting Minutes / SOP Repository
> *Priority: Low — Can be part of Knowledge Base*

- [ ] Meeting minutes with date, attendees, action items
- [ ] SOP documents with step-by-step procedures
- [ ] Searchable and categorized

---

## 📊 Overall Progress

| Category | Status |
|----------|--------|
| Auth & Guards | ✅ Done |
| Admin Dashboard | ✅ Done |
| Developer Dashboard | ✅ Done |
| User Management | ✅ Done |
| Repository CRUD | ✅ Done |
| Getting Started | ✅ Done |
| API Documentation | ✅ Done |
| Database Schema | ⚠️ Partial (text only) |
| Environment Variables | ⚠️ Partial (no descriptions) |
| Architecture | ⚠️ Partial (no diagrams) |
| Deployment Guide | ❌ Not Started |
| Coding Standards | ❌ Not Started |
| Troubleshooting Wiki | ❌ Not Started |
| Full-Text Search | ❌ Not Started |
| Knowledge Base | ❌ Not Started |
| Versioned Docs | ❌ Not Started |
| Team Directory (enhanced) | ❌ Not Started |

**Estimated completion: ~40-50% of full IDP requirements**

---

## 🛠️ Suggested Order of Implementation

1. **Deployment Guide** — quick win, just add a tab + field
2. **Coding Standards** — same pattern, quick win
3. **Troubleshooting Wiki** — high value, needs new DB table
4. **Architecture Diagrams** — integrate Mermaid.js
5. **Env Variable Descriptions** — small enhancement
6. **Full-Text Search** — medium effort, high impact
7. **Knowledge Base** — new module, medium-high effort
8. **Versioned Docs** — complex, do last
