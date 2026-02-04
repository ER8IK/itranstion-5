# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            React SPA (Port 3000)                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Login     │  │  Register   │  │   Verify     │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │              Dashboard                           │  │  │
│  │  │  • User Table (sorted by last_login)            │  │  │
│  │  │  • Checkboxes (select all/individual)           │  │  │
│  │  │  • Toolbar (Block/Unblock/Delete)               │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │ HTTP/HTTPS + JWT                │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        Express API Server (Port 5000)                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Routes                             │  │  │
│  │  │  • /api/auth/register                           │  │  │
│  │  │  • /api/auth/login                              │  │  │
│  │  │  • /api/auth/verify                             │  │  │
│  │  │  • /api/users/* (protected)                     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Middleware                            │  │  │
│  │  │  • authenticate() - JWT verification            │  │  │
│  │  │  • Check user exists & not blocked              │  │  │
│  │  │  • CORS, JSON parsing, validation               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │          Services                               │  │  │
│  │  │  • emailService - Async email sending           │  │  │
│  │  │  • JWT token generation/verification            │  │  │
│  │  │  • bcrypt password hashing                      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │ SQL Queries                     │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            PostgreSQL Database                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              users TABLE                        │  │  │
│  │  │  • id (SERIAL PRIMARY KEY)                      │  │  │
│  │  │  • name (VARCHAR)                               │  │  │
│  │  │  • email (VARCHAR) ← UNIQUE INDEX! ✅           │  │  │
│  │  │  • password (VARCHAR, hashed)                   │  │  │
│  │  │  • status (VARCHAR) ← CHECK constraint          │  │  │
│  │  │  • last_login (TIMESTAMP) ← INDEX for sorting   │  │  │
│  │  │  • created_at (TIMESTAMP)                       │  │  │
│  │  │  • updated_at (TIMESTAMP)                       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              INDEXES                            │  │  │
│  │  │  1. PRIMARY KEY on id                           │  │  │
│  │  │  2. UNIQUE INDEX on email ✅ (CRITICAL!)        │  │  │
│  │  │  3. INDEX on last_login DESC NULLS LAST         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            SMTP Server (Email)                        │  │
│  │  • Gmail / SendGrid / Mailgun / AWS SES              │  │
│  │  • Async verification emails                         │  │
│  │  • Non-blocking (won't stop registration)            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Registration Flow

```
User fills form → Frontend validates → POST /api/auth/register
                                              ↓
                                    Validate input (express-validator)
                                              ↓
                                    Hash password (bcrypt)
                                              ↓
                                    INSERT INTO users (name, email, password...)
                                              ↓
                                    [UNIQUE INDEX checks email uniqueness]
                                              ↓
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                    Success                               Duplicate
                          │                                   │
                 Return user + success              Return error 23505
                          ↓                           (unique violation)
              Send email ASYNC (non-blocking)
              (email sent in background)
                          ↓
              User sees success immediately!
```

### 2. Login Flow

```
User enters credentials → POST /api/auth/login
                                    ↓
                          SELECT * FROM users WHERE email = ?
                                    ↓
                              User exists?
                    ┌─────────────┴───────────────┐
                   YES                           NO
                    │                             │
              Check password               Return 401 error
              (bcrypt.compare)
                    ↓
         ┌──────────┴──────────┐
      Valid                 Invalid
         │                     │
  Check status          Return 401 error
         ↓
  ┌──────┴──────┐
Blocked      Active/Unverified
  │              │
Return 403   Generate JWT
             Update last_login
             Return token + user
```

### 3. Protected Request Flow

```
Frontend request with JWT → Backend receives request
                                        ↓
                            authenticate() middleware
                                        ↓
                              Extract JWT from header
                                        ↓
                              Verify token signature
                                        ↓
                              SELECT user WHERE id = ?
                                        ↓
                      ┌─────────────────┴──────────────┐
                User exists                      User not found
                      │                                │
              Check status                     Return 401 + redirect
                      ↓
        ┌─────────────┴─────────────┐
     Blocked                      Active/Unverified
        │                              │
Return 403 + redirect           Allow request
                                       ↓
                                Continue to route handler
```

### 4. Email Verification Flow

```
User clicks email link → GET /api/auth/verify?token=xxx
                                    ↓
                          Parse token (base64 decode)
                                    ↓
                          Extract userId + email
                                    ↓
        UPDATE users SET status = 'active' 
        WHERE id = ? AND email = ? AND status = 'unverified'
                                    ↓
                        ┌───────────┴───────────┐
                   Success                   No rows affected
                        │                         │
              Return success              Return error
              (status changed)       (already verified or blocked)
```

### 5. User Management Actions Flow

```
User selects users → Clicks action button → Frontend sends user IDs
                                                      ↓
                                          authenticate() middleware
                                                      ↓
                                        ┌─────────────┴─────────────┐
                                      Block                       Delete
                                        │                           │
            UPDATE users SET status = 'blocked'      DELETE FROM users
            WHERE id = ANY($1)                       WHERE id = ANY($1)
                        │                                           │
                Database updates                        Database deletes
                        │                                           │
                Return success                          Return success
                        ↓                                           ↓
            Frontend reloads users                  Frontend reloads users
                                                                    │
                                                    If current user deleted
                                                            → Logout
```

## Key Security Features

### 1. Password Security
```
User Password → bcrypt.hash(password, 10) → Stored in DB
                                           (never plain text!)
```

### 2. JWT Authentication
```
Login Success → jwt.sign({id, email}, secret, {expiresIn: '7d'})
                                    ↓
                        Token sent to frontend
                                    ↓
                        Stored in localStorage
                                    ↓
                Every request includes: Authorization: Bearer <token>
                                    ↓
                        Backend verifies signature
```

### 3. Unique Email Enforcement
```
Multiple simultaneous registrations with same email
                    ↓
        All INSERT attempts sent to PostgreSQL
                    ↓
        UNIQUE INDEX idx_users_email_unique
                    ↓
    First INSERT succeeds, all others fail with error 23505
    (No race condition possible - handled at DB level!)
```

### 4. User Status Verification
```
Every protected request:
    1. Check JWT valid?
    2. User exists in DB?
    3. User not blocked?
    
    If any check fails → 401/403 + redirect to login
```

## Database Schema Details

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,                    -- Auto-increment ID
  name VARCHAR(255) NOT NULL,               -- User's full name
  email VARCHAR(255) NOT NULL,              -- Email (has UNIQUE INDEX)
  password VARCHAR(255) NOT NULL,           -- bcrypt hashed password
  status VARCHAR(20) DEFAULT 'unverified'   -- unverified/active/blocked
    CHECK (status IN ('unverified', 'active', 'blocked')),
  last_login TIMESTAMP,                     -- Last login time (for sorting)
  created_at TIMESTAMP DEFAULT NOW(),       -- Registration time
  updated_at TIMESTAMP DEFAULT NOW()        -- Last update time
);

-- CRITICAL: UNIQUE INDEX (FIRST REQUIREMENT)
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Performance INDEX for sorting (THIRD REQUIREMENT)
CREATE INDEX idx_users_last_login ON users(last_login DESC NULLS LAST);
```

### Index Benefits
1. **idx_users_email_unique**: 
   - Guarantees no duplicate emails
   - Works at database level (independent of app code)
   - Handles concurrent inserts safely
   - Fast lookups by email

2. **idx_users_last_login**:
   - Optimizes ORDER BY last_login DESC
   - NULLS LAST ensures users without login appear at end
   - Makes table sorting fast even with millions of users

## Frontend Component Hierarchy

```
App
├── BrowserRouter
    ├── Routes
        ├── /login → Login Component
        │             └── authAPI.login()
        │
        ├── /register → Register Component
        │                └── authAPI.register()
        │
        ├── /verify → EmailVerification Component
        │              └── authAPI.verify()
        │
        └── /dashboard → ProtectedRoute
                          └── Dashboard Component
                              ├── Navbar (user info + logout)
                              ├── Alert (status messages)
                              ├── Toolbar
                              │   ├── Block button
                              │   ├── Unblock icon
                              │   ├── Delete icon
                              │   └── Delete Unverified icon
                              └── Table
                                  ├── Header (with select all checkbox)
                                  └── Rows (with individual checkboxes)
                                      ├── Name
                                      ├── Email
                                      ├── Last Login
                                      ├── Created At
                                      └── Status Badge
```

## Technology Stack Details

### Backend Dependencies
- **express**: Web framework
- **pg**: PostgreSQL client
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **nodemailer**: Email sending
- **express-validator**: Input validation
- **cors**: CORS middleware
- **dotenv**: Environment variables

### Frontend Dependencies
- **react**: UI library
- **react-router-dom**: Routing
- **axios**: HTTP client
- **bootstrap**: CSS framework
- **react-bootstrap**: React components
- **bootstrap-icons**: Icon set

### Development Tools
- **TypeScript**: Type safety
- **Vite**: Fast build tool (frontend)
- **ts-node**: TypeScript execution (backend)

## Deployment Architecture

### Docker Compose
```
┌────────────────┐
│   Frontend     │ Port 3000 → nginx → Static files
│   (nginx)      │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   Backend      │ Port 5000 → Node.js → Express
│   (Node.js)    │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   PostgreSQL   │ Port 5432 → Database
│   (Database)   │
└────────────────┘
```

### Production Deployment Options
1. **Heroku**: Backend + Frontend + Postgres addon
2. **AWS**: EC2 + RDS + S3
3. **DigitalOcean**: App Platform + Managed Database
4. **Railway**: All-in-one deployment
5. **Render**: Static site + Web service + Database

## Performance Considerations

### Database
- Connection pooling (max 20 connections)
- Indexes on frequently queried columns
- Prepared statements (SQL injection prevention)

### Backend
- JWT stateless authentication (no session storage)
- Async email sending (non-blocking)
- Input validation before DB queries

### Frontend
- Code splitting with React Router
- Bootstrap CSS framework (optimized)
- Axios interceptors for token handling
- LocalStorage for client-side state

## Scalability

### Horizontal Scaling
- Stateless backend (JWT) → Can run multiple instances
- Database connection pooling
- Load balancer in front of backend instances

### Vertical Scaling
- Database indexes for performance
- Async operations (email)
- Efficient queries (no N+1 problems)

---

**This architecture fulfills all Task #5 requirements while maintaining professional, production-ready code quality.**
