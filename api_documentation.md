# API Reference Guide

This document lists the complete API endpoints, methods, headers, and request/response payloads for the authentication, user management, repository management, and related services.

---

## 1. Authentication Endpoints (Public)

### User Login
* **Method**: `POST`
* **URL**: `/api/auth/login`
* **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_email": "sagar@email.com", // Can be either email or name
    "emp_pass": "password123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "emp_id": "260701075901",
      "emp_name": "Sagar",
      "emp_email": "sagar@email.com",
      "emp_role": "admin",
      "token": "1|AbCdEfG...", // Bearer Sanctum token
      "needs_details": true   // True if phone/profile details are not yet filled
    }
  }
  ```

---

### Forgot Password (Send OTP)
* **Method**: `POST`
* **URL**: `/api/auth/forgot-password`
* **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_email": "sagar@email.com"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP sent to your email."
  }
  ```

---

### Reset Password (Verify OTP)
* **Method**: `POST`
* **URL**: `/api/auth/reset-password`
* **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_email": "sagar@email.com",
    "otp": "123456",
    "new_password": "newpassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password reset successfully."
  }
  ```

---

## 2. Authentication & Profile Endpoints (Protected)
> All endpoints below require a valid authentication token.

### User Profile
* **Method**: `GET`
* **URL**: `/api/auth/profile`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Payload (Query Parameters)**:
  * `emp_id` (Optional: Fallback lookup if token is not sent, or to fetch specific profile)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "emp_id": "260701075901",
      "emp_name": "Sagar",
      "emp_email": "sagar@email.com",
      "emp_role": "admin",
      "github_username": "sagar-dev",
      "created_at": "2026-07-01T02:24:52.000000Z"
    }
  }
  ```

---

### Get Profile Details
* **Method**: `GET`
* **URL**: `/api/details/show`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Payload (Query Parameters)**:
  * `emp_id` (Required: Employee ID to fetch details)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "emp_id": "260701075901",
      "emp_name": "Sagar",
      "emp_email": "sagar@email.com",
      "emp_phone": "9988776655",
      "emp_address": "Agartala",
      "emp_blood_group": "O+",
      "emp_role": "Developer",
      "emp_position": "Full Stack Dev",
      "emp_work_field": "Engineering",
      "emp_doj": "2026-06-01",
      "emp_tenure": 1,
      "emp_grad": 2024,
      "emp_m_status": "Single",
      "github_username": "sagar-github"
    }
  }
  ```

---

### Update Profile Details
* **Method**: `PUT`
* **URL**: `/api/auth/details`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_id": 260701075901,
    "emp_phone": "9988776655",       // Optional
    "emp_address": "Agartala",        // Optional
    "emp_blood_group": "O+",          // Optional
    "emp_role": "Developer",          // Optional
    "emp_position": "Full Stack Dev", // Optional
    "emp_work_field": "Engineering",  // Optional
    "emp_doj": "2026-06-01",          // Optional
    "emp_tenure": 1,                  // Optional
    "emp_grad": 2024,                 // Optional
    "emp_m_status": "Single",         // Optional
    "github_username": "sagar-github" // Optional
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Employee details updated successfully",
    "data": {
      "emp_id": "260701075901",
      "emp_name": "Sagar",
      "emp_email": "sagar@email.com",
      "emp_phone": "9988776655",
      "emp_address": "Agartala",
      "emp_blood_group": "O+",
      "emp_role": "Developer",
      "emp_position": "Full Stack Dev",
      "emp_work_field": "Engineering",
      "emp_doj": "2026-06-01",
      "emp_tenure": 1,
      "emp_grad": 2024,
      "emp_m_status": "Single",
      "github_username": "sagar-github"
    }
  }
  ```

---

### Request Email Change (Send Verification OTP)
* **Method**: `POST`
* **URL**: `/api/auth/send-email-otp`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP sent to your current email."
  }
  ```

---

### Verify & Change Email
* **Method**: `POST`
* **URL**: `/api/auth/change-email`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "otp": "123456",
    "new_email": "new.email@example.com"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Email updated successfully.",
    "data": {
      "emp_email": "new.email@example.com"
    }
  }
  ```

---

### Change Password
* **Method**: `POST`
* **URL**: `/api/auth/change-password`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "current_password": "oldpassword123",
    "new_password": "newpassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully."
  }
  ```

---

### Logout
* **Method**: `POST`
* **URL**: `/api/auth/logout`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 3. User Management Endpoints (Requires Admin Auth)

### Register User (Admins Only)
* **Method**: `POST`
* **URL**: `/api/auth/register`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_name": "John Developer",
    "emp_email": "john@example.com",
    "emp_pass": "password123",
    "emp_role": "jr-dev" // Optional: "admin", "sr-dev", "jr-dev" (defaults to "jr-dev")
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "emp_id": "260701075901",
      "emp_name": "John Developer",
      "emp_email": "john@example.com",
      "emp_role": "jr-dev"
    }
  }
  ```

---

### List All Users (Admins Only)
* **Method**: `GET`
* **URL**: `/api/users`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "emp_id": "260701075901",
        "emp_name": "Sagar",
        "emp_email": "sagar@email.com",
        "emp_role": "admin",
        "github_username": "sagar-dev"
      }
    ]
  }
  ```

---

### Create User (Admins Only)
* **Method**: `POST`
* **URL**: `/api/users`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_name": "Alice Developer",
    "emp_email": "alice.dev@example.com",
    "emp_pass": "password123",
    "emp_role": "jr-dev" // "admin", "sr-dev", "jr-dev"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "emp_id": "260701075902",
      "emp_name": "Alice Developer",
      "emp_email": "alice.dev@example.com",
      "emp_role": "jr-dev"
    }
  }
  ```

---

### Update User (Admins Only)
* **Method**: `PUT`
* **URL**: `/api/users/{emp_id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_name": "Alice Admin",            // Optional
    "emp_email": "alice.admin@example.com",// Optional
    "emp_pass": "newsecurepass123",       // Optional
    "emp_role": "admin",                  // Optional
    "github_username": "alice-github"     // Optional
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User updated successfully",
    "data": {
      "emp_id": "260701075902",
      "emp_name": "Alice Admin",
      "emp_email": "alice.admin@example.com",
      "emp_role": "admin",
      "github_username": "alice-github"
    }
  }
  ```

---

### Delete User (Admins Only)
* **Method**: `DELETE`
* **URL**: `/api/users/{emp_id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User deleted successfully"
  }
  ```

---

## 4. Repository Endpoints (Requires Auth)

### List All Repositories
* **Method**: `GET`
* **URL**: `/api/repositories`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Query Parameters**:
  * `branch_id` (Optional): Filter repositories by branch ID
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repo_name": "Project Alpha",
        "repo_github_url": "https://github.com/org/project-alpha",
        "repo_stack": ["React", "Node.js", "MongoDB"],
        "repo_status": "Development Env",
        "repo_branch": "main",
        "repo_arch": "Microservices",
        "repo_init_author": "Sagar",
        "repo_init_date": "2026-06-01",
        "repo_deadline": "2026-12-31",
        "repo_maintainer": "260701075901",
        "created_at": "2026-07-01T02:24:52.000000Z",
        "updated_at": "2026-07-01T02:24:52.000000Z"
      }
    ]
  }
  ```

---

### Get Repository by ID
* **Method**: `GET`
* **URL**: `/api/repositories/{id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Query Parameters**:
  * `branch_id` (Optional): Get repository details for specific branch
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "repo_name": "Project Alpha",
      "repo_github_url": "https://github.com/org/project-alpha",
      "repo_stack": ["React", "Node.js", "MongoDB"],
      "repo_status": "Development Env",
      "repo_branch": "main",
      "repo_arch": "Microservices",
      "repo_apis": [
        {
          "method": "GET",
          "path": "/api/users",
          "desc": "Get all users",
          "headers": "Authorization: Bearer token",
          "payload": "",
          "response": "{...}"
        }
      ],
      "repo_schema": "CREATE TABLE users (...);",
      "repo_init_author": "Sagar",
      "repo_init_date": "2026-06-01",
      "repo_deadline": "2026-12-31",
      "repo_issues": "Issue 1\nIssue 2",
      "repo_review_log": "Review 1\nReview 2",
      "repo_major_commits": ["[main] Initial commit", "[main] Add auth"],
      "repo_getting_started": "Step 1: Clone repo\nStep 2: Install dependencies",
      "repo_env": "DB_HOST=localhost\nDB_PORT=5432",
      "repo_deployment": "Step 1: Build\nStep 2: Deploy",
      "repo_coding_standards": "Follow PSR-12",
      "repo_architecture_diagram": "<mermaid diagram code>",
      "repo_code_snippets": [
        {
          "title": "Main Snippet",
          "code": "const app = express();"
        }
      ],
      "repo_access": [
        {
          "emp_id": "260701075901",
          "name": "Sagar",
          "emp_role": "admin",
          "role_catagory": "Management",
          "role_name": "Admin",
          "permission": "EDIT"
        }
      ],
      "repo_maintainer": "260701075901",
      "active_branch": {
        "id": 1,
        "repo_branch_name": "main"
      }
    }
  }
  ```

---

### Create Repository
* **Method**: `POST`
* **URL**: `/api/repositories`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "repo_name": "Project Alpha",
    "repo_github_url": "https://github.com/org/project-alpha",
    "repo_stack": ["React", "Node.js", "MongoDB"],
    "repo_status": "Development Env",
    "repo_branch": "main",
    "repo_arch": "Microservices",
    "repo_apis": [
      {
        "method": "GET",
        "path": "/api/users",
        "desc": "Get all users",
        "headers": "Authorization: Bearer token",
        "payload": "",
        "response": "{...}"
      }
    ],
    "repo_schema": "CREATE TABLE users (...);",
    "repo_init_author": "Sagar",
    "repo_init_date": "2026-06-01",
    "repo_deadline": "2026-12-31",
    "repo_issues": ["Issue 1", "Issue 2"],
    "repo_review_log": ["Review 1", "Review 2"],
    "repo_major_commits": ["[main] Initial commit"],
    "repo_getting_started": "Step 1: Clone repo\nStep 2: Install dependencies",
    "repo_env": "DB_HOST=localhost\nDB_PORT=5432",
    "repo_deployment": "Step 1: Build\nStep 2: Deploy",
    "repo_coding_standards": "Follow PSR-12",
    "repo_architecture_diagram": "<mermaid diagram code>",
    "repo_code_snippets": [
      {
        "title": "Main Snippet",
        "code": "const app = express();"
      }
    ],
    "repo_access": [
      {
        "emp_id": "260701075901",
        "role_catagory": "Management",
        "role_name": "Admin",
        "permission": "EDIT"
      }
    ],
    "repo_maintainer": "260701075901"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Repository created successfully",
    "data": {
      "id": 1,
      "repo_name": "Project Alpha",
      "repo_github_url": "https://github.com/org/project-alpha",
      "repo_stack": ["React", "Node.js", "MongoDB"],
      "repo_status": "Development Env",
      "repo_branch": "main",
      "repo_arch": "Microservices"
    }
  }
  ```

---

### Update Repository
* **Method**: `PUT`
* **URL**: `/api/repositories/{id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)** (All fields optional - only include fields to update):
  ```json
  {
    "emp_id": "260701075901",
    "branch_id": 1,
    "repo_name": "Project Alpha Updated",
    "repo_github_url": "https://github.com/org/project-alpha",
    "repo_stack": ["React", "Node.js"],
    "repo_status": "Production",
    "repo_branch": "main",
    "repo_arch": "Microservices",
    "repo_apis": [...],
    "repo_schema": "...",
    "repo_init_author": "Sagar",
    "repo_init_date": "2026-06-01",
    "repo_deadline": "2026-12-31",
    "repo_issues": [...],
    "repo_review_log": [...],
    "repo_major_commits": [...],
    "repo_getting_started": "...",
    "repo_env": "...",
    "repo_deployment": "...",
    "repo_coding_standards": "...",
    "repo_architecture_diagram": "...",
    "repo_code_snippets": [...],
    "repo_access": [...],
    "repo_maintainer": "260701075901"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Repository updated successfully"
  }
  ```

---

### Delete Repository
* **Method**: `DELETE`
* **URL**: `/api/repositories/{id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Repository deleted successfully"
  }
  ```

---

## 5. Repository Files Endpoints (Requires Auth)

### List Repository Files
* **Method**: `GET`
* **URL**: `/api/repositories/{repo_id}/files`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repo_id": 1,
        "file_name": "documentation.pdf",
        "file_description": "Project documentation",
        "file_path": "uploads/repositories/1/documentation.pdf",
        "created_at": "2026-07-01T02:24:52.000000Z"
      }
    ]
  }
  ```

---

### Upload File to Repository
* **Method**: `POST`
* **URL**: `/api/repositories/{repo_id}/files`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Payload (Body)**: `multipart/form-data`
  * `file` (Required): The file to upload
  * `file_name` (Required): Name for the file
  * `file_description` (Optional): Description of the file
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "data": {
      "id": 1,
      "repo_id": 1,
      "file_name": "documentation.pdf",
      "file_description": "Project documentation",
      "file_path": "uploads/repositories/1/documentation.pdf"
    }
  }
  ```

---

### Delete Repository File
* **Method**: `DELETE`
* **URL**: `/api/repo-files/{file_id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "File deleted successfully"
  }
  ```

---

## 6. Repository Activity Logs Endpoints (Requires Auth)

### Get Repository Activity Logs
* **Method**: `GET`
* **URL**: `/api/repositories/{repo_id}/activity-logs`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repo_id": 1,
        "user_id": "260701075901",
        "action": "updated_repository",
        "details": "Updated repository details",
        "created_at": "2026-07-01T02:24:52.000000Z"
      }
    ]
  }
  ```

---

## 7. Repository Conversations/Chat Endpoints (Requires Auth)

### Get Repository Conversations
* **Method**: `GET`
* **URL**: `/api/repositories/{repo_id}/conversations`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repo_id": 1,
        "user_id": "260701075901",
        "message": "Hey team, let's discuss the API design",
        "created_at": "2026-07-01T02:24:52.000000Z"
      }
    ]
  }
  ```

---

### Send Message to Repository Conversation
* **Method**: `POST`
* **URL**: `/api/repositories/{repo_id}/conversations`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "message": "Hey team, let's discuss the API design"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Message sent successfully",
    "data": {
      "id": 2,
      "repo_id": 1,
      "user_id": "260701075901",
      "message": "Hey team, let's discuss the API design",
      "created_at": "2026-07-01T02:25:00.000000Z"
    }
  }
  ```

---

## 8. Repository Roles & Permissions Endpoints (Requires Auth)

### Get Repository Role Options
* **Method**: `GET`
* **URL**: `/api/repo-roles/options`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "Management": ["Admin", "Manager", "Lead"],
      "Development": ["Senior Dev", "Junior Dev", "Intern"],
      "Permission": ["Editor", "Viewer"]
    }
  }
  ```

---

### Get All Repository Roles
* **Method**: `GET`
* **URL**: `/api/repo-roles`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Query Parameters**:
  * `repo_id` (Optional): Filter roles by repository ID
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "emp_id": "260701075901",
        "repo_id": 1,
        "branch_id": null,
        "role_catagory": "Management",
        "role_name": "Admin",
        "permission": "EDIT",
        "created_at": "2026-07-01T02:24:52.000000Z"
      }
    ]
  }
  ```

---

### Assign Role to User for Repository
* **Method**: `POST`
* **URL**: `/api/repo-roles`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "emp_id": "260701075902",
    "repo_id": 1,
    "branch_id": null,
    "role_catagory": "Development",
    "role_name": "Senior Dev",
    "permission": "EDIT"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Role assigned successfully",
    "data": {
      "id": 2,
      "emp_id": "260701075902",
      "repo_id": 1,
      "branch_id": null,
      "role_catagory": "Development",
      "role_name": "Senior Dev",
      "permission": "EDIT"
    }
  }
  ```

---

### Update Repository Role
* **Method**: `PUT`
* **URL**: `/api/repo-roles/{role_id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "role_catagory": "Development",
    "role_name": "Junior Dev",
    "branch_id": null,
    "permission": "VIEW"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Role updated successfully",
    "data": {
      "id": 2,
      "emp_id": "260701075902",
      "repo_id": 1,
      "role_catagory": "Development",
      "role_name": "Junior Dev",
      "permission": "VIEW"
    }
  }
  ```

---

### Delete Repository Role
* **Method**: `DELETE`
* **URL**: `/api/repo-roles/{role_id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Role deleted successfully"
  }
  ```

---

## 9. Repository Configuration Endpoints (Requires Auth)

### Get All Repository Statuses
* **Method**: `GET`
* **URL**: `/api/repo-statuses`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repo_status_name": "Development Env"
      },
      {
        "id": 2,
        "repo_status_name": "Production"
      }
    ]
  }
  ```

---

### Create Repository Status
* **Method**: `POST`
* **URL**: `/api/repo-statuses`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "repo_status_name": "Testing"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Status created successfully",
    "data": {
      "id": 3,
      "repo_status_name": "Testing"
    }
  }
  ```

---

### Delete Repository Status
* **Method**: `DELETE`
* **URL**: `/api/repo-statuses/{id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Status deleted successfully"
  }
  ```

---

### Get All Repository Stacks
* **Method**: `GET`
* **URL**: `/api/repo-stacks`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repo_stack_name": "React"
      },
      {
        "id": 2,
        "repo_stack_name": "Node.js"
      }
    ]
  }
  ```

---

### Create Repository Stack
* **Method**: `POST`
* **URL**: `/api/repo-stacks`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "repo_stack_name": "Python"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Stack created successfully",
    "data": {
      "id": 3,
      "repo_stack_name": "Python"
    }
  }
  ```

---

### Delete Repository Stack
* **Method**: `DELETE`
* **URL**: `/api/repo-stacks/{id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Stack deleted successfully"
  }
  ```

---

### Get All Repository Architectures
* **Method**: `GET`
* **URL**: `/api/repo-architectures`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repo_arch_name": "Microservices"
      },
      {
        "id": 2,
        "repo_arch_name": "Monolithic"
      }
    ]
  }
  ```

---

### Create Repository Architecture
* **Method**: `POST`
* **URL**: `/api/repo-architectures`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "repo_arch_name": "Serverless"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Architecture created successfully",
    "data": {
      "id": 3,
      "repo_arch_name": "Serverless"
    }
  }
  ```

---

### Delete Repository Architecture
* **Method**: `DELETE`
* **URL**: `/api/repo-architectures/{id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Architecture deleted successfully"
  }
  ```

---

## 10. Branch Endpoints (Requires Auth)

### Get All Branches
* **Method**: `GET`
* **URL**: `/api/branches`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Query Parameters**:
  * `repository_id` (Optional): Filter branches by repository ID
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "repository_id": 1,
        "repo_branch_name": "main",
        "repo_branch_desc": "Main production branch",
        "repo_branch_initer": "260701075901",
        "repo_branch_commit": 15,
        "created_at": "2026-07-01T02:24:52.000000Z"
      }
    ]
  }
  ```

---

### Create Branch
* **Method**: `POST`
* **URL**: `/api/branches`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Content-Type: application/json
  Accept: application/json
  ```
* **Payload (Body)**:
  ```json
  {
    "repository_id": 1,
    "branch_name": "feature/new-api",
    "repo_branch_desc": "New API implementation",
    "branch_initer": "260701075901"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Branch created successfully",
    "data": {
      "id": 2,
      "repository_id": 1,
      "repo_branch_name": "feature/new-api",
      "repo_branch_desc": "New API implementation",
      "repo_branch_initer": "260701075901",
      "repo_branch_commit": 0
    }
  }
  ```

---

### Delete Branch
* **Method**: `DELETE`
* **URL**: `/api/branches/{id}`
* **Headers**:
  ```http
  Authorization: Bearer <your_token>
  Accept: application/json
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Branch deleted successfully"
  }
  ```

---

## 11. Whiteboard Endpoint (Public with Token)

### Access Whiteboard
* **Method**: `GET`
* **URL**: `/whiteboard.html?repo_id={id}&token={token}&theme={theme}`
* **Headers**:
  ```http
  Accept: text/html
  ```
* **Query Parameters**:
  * `repo_id` (Required): Repository ID
  * `token` (Required): Authentication token
  * `theme` (Optional): "dark" or "light" (default: "light")
  * `branch_id` (Optional): Branch ID for branch-specific whiteboard
* **Success Response (200 OK)**: Returns HTML page with whiteboard interface

---

## Notes

1. **Authentication**: Most endpoints require a Bearer token obtained from the login endpoint. Include it in the `Authorization` header.
2. **Base URL**: All API endpoints are prefixed with `/api` (e.g., `/api/repositories`, `/api/users`).
3. **Response Format**: All responses follow a consistent format with `success`, `message` (optional), and `data` fields.
4. **Error Responses**: Error responses typically include:
   ```json
   {
     "success": false,
     "message": "Error description",
     "errors": {
       "field_name": ["Validation error message"]
     }
   }
   ```
5. **File Uploads**: File upload endpoints use `multipart/form-data` content type.
6. **Array Fields**: Fields like `repo_stack`, `repo_issues`, `repo_apis`, etc., can be sent as arrays or comma-separated strings.
7. **Permissions**: Repository access is controlled via the `repo-roles` endpoints with categories like "Management", "Development", and permissions like "EDIT" or "VIEW".