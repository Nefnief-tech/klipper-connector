# Klipper Printer Gateway Design

> **Date:** 2026-03-17
> **Status:** Approved

## Overview

A web gateway that provides authenticated access to multiple Klipper 3D printer interfaces. Users can log in via a secure web interface, manage their printers, and access printer UIs through reverse proxy routing.

## Architecture

The system consists of:
- **Node.js + Express Backend**: Handles authentication, user management, printer configuration, and reverse proxy routing
- **React SPA Frontend**: Provides login, dashboard, printer management, and proxy view
- **Database**: Stores users and printer configurations
- **Reverse Proxy Middleware**: Routes authenticated requests to printer interfaces on subpaths

**Request Flow:**
```
User Browser → Gateway (www.example.com)
              ├─ /login → React Login Page
              ├─ /dashboard → React Dashboard
              ├─ /api/* → Express API (auth, printers)
              └─ /printer/:name/* → Reverse Proxy to Printer
```

## Technology Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (or MongoDB)
- JWT for authentication
- http-proxy-middleware for reverse proxy
- bcrypt for password hashing
- Prisma or Knex.js for database

**Frontend:**
- React + React Router
- Vite for build tooling
- Axios for API calls
- TailwindCSS (optional, for styling)

## Data Models

### Users Table
```javascript
{
  id: UUID,
  username: String (unique, indexed),
  password_hash: String (bcrypt),
  created_at: Timestamp,
  is_active: Boolean
}
```

### Printers Table
```javascript
{
  id: UUID,
  name: String,
  host_url: String,
  port: Number,
  path: String,  // e.g., "/printer1"
  description: String,
  status: String (active/inactive),
  last_accessed: Timestamp
}
```

## API Endpoints

**Authentication:**
- `POST /api/register` - Create new user
- `POST /api/login` - Login, return JWT tokens
- `POST /api/logout` - Invalidate session
- `POST /api/refresh-token` - Refresh access token
- `GET /api/me` - Get current user info

**Printers:**
- `GET /api/printers` - List all printers (authenticated)
- `POST /api/printers` - Add new printer (authenticated)
- `PUT /api/printers/:id` - Update printer (authenticated)
- `DELETE /api/printers/:id` - Delete printer (authenticated)
- `GET /api/printers/:id` - Get specific printer (authenticated)

**Proxy:**
- `GET/POST/PUT/DELETE /printer/:name/*` - Proxy to printer interface (authenticated)

## Security

- HTTPS required for all production deployments
- Passwords stored as bcrypt hashes (12-15 salt rounds)
- JWT access tokens: 15-30 minute expiration
- JWT refresh tokens: 7-30 day expiration
- JWT rotation on refresh
- SameSite cookies for CSRF protection
- Content-Security-Policy headers
- Parameterized queries to prevent SQL injection
- Input validation for printer URLs

## Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── Dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── Printers/
│   │   │   ├── PrinterList.jsx
│   │   │   ├── PrinterForm.jsx
│   │   │   └── PrinterCard.jsx
│   │   └── Layout/
│   │       ├── Navbar.jsx
│   │       └── Sidebar.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   └── PrinterView.jsx
│   ├── services/
│   │   ├── api.js          - Axios instance with auth interceptors
│   │   ├── auth.js         - Auth service
│   │   └── printers.js     - Printer API calls
│   ├── router/
│   │   └── index.jsx       - React Router setup
│   ├── context/
│   │   └── AuthContext.jsx - Auth state management
│   └── App.jsx
```

## Authentication Flow (Frontend)

1. Check localStorage for token on app load
2. If token exists → verify with `/api/me` endpoint
3. If valid → set AuthContext and redirect to dashboard
4. If invalid → clear token and show login page
5. Protected routes wrap components with ProtectedRoute

## Proxy Configuration

The reverse proxy will:
1. Intercept requests to `/printer/:name/*`
2. Validate JWT token in Authorization header
3. Lookup printer configuration by name
4. Forward request to printer's `host_url:port/path`
5. Return response to client

**Example:**
- User requests: `www.example.com/printer1/api/status`
- Gateway looks up "printer1" → `192.168.1.100:7125`
- Proxy forwards to: `http://192.168.1.100:7125/api/status`
- Response returned to browser
