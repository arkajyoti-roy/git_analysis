# API Reference Guide

This document lists the complete API endpoints, methods, headers, and request/response payloads for the authentication and user management services.

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

## 3. User Management Endpoints (Requires Auth)

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
