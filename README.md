# User Management System

A professional web application for user registration, authentication, and management with a comprehensive admin panel.

## 🎯 Task Requirements Compliance

This application fulfills ALL requirements from Task #5:

### ✅ First Requirement: UNIQUE INDEX
- **Database has a UNIQUE INDEX on the email column**
- Email uniqueness is guaranteed at the database level
- The index prevents duplicate emails even with concurrent inserts
- No code-level checks for email uniqueness - handled entirely by PostgreSQL

### ✅ Second Requirement: Professional UI
- Table looks like a proper data table with Bootstrap styling
- Toolbar is clearly visible above the table with all required actions
- Professional, business-oriented design (boring but consistent)

### ✅ Third Requirement: Data Sorting
- Users are sorted by `last_login` time in descending order
- Users who never logged in appear at the end (NULLS LAST)
- Database index on `last_login` for performance

### ✅ Fourth Requirement: Multiple Selection
- Checkboxes in leftmost column for row selection
- "Select All" checkbox in table header (without label)
- All checkboxes work as expected

### ✅ Fifth Requirement: Authentication Check
- Every protected request verifies user existence and blocked status
- Middleware checks authentication before each request (except login/register)
- Blocked or deleted users are redirected to login page

## 🚀 Features

- **User Registration**: Instant registration with async email verification
- **User Authentication**: JWT-based secure authentication
- **Email Verification**: Asynchronous email sending with verification links
- **User Management Table**: 
  - View all users with their status
  - Sorted by last login time
  - Multiple selection with checkboxes
- **Toolbar Actions**:
  - Block selected users
  - Unblock selected users
  - Delete selected users (permanent deletion)
  - Delete all unverified users
- **Self-Management**: Any user can block/delete themselves or others
- **Status Messages**: Clear feedback for all operations (no browser alerts)
- **Responsive Design**: Works on desktop and mobile
- **Security**: Blocked users cannot login, deleted users can re-register

## 🛠️ Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **PostgreSQL** - Relational database with unique indexes
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Nodemailer** - Email sending
- **express-validator** - Input validation

### Frontend
- **React 18** with **TypeScript**
- **React Router** - Client-side routing
- **Bootstrap 5** - CSS framework
- **React Bootstrap** - Bootstrap components
- **Axios** - HTTP client
- **Vite** - Build tool

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- SMTP server access (Gmail recommended for testing)

## 🔧 Installation & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd user-management-app
```

### 2. Database Setup

Install and start PostgreSQL, then create the database:

```bash
createdb user_management
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Important .env variables:**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_management
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your-super-secret-key-change-this

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use App Password, not regular password!
EMAIL_FROM=noreply@usermanagement.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Run database migration:**

```bash
npm run migrate
```

This creates:
- Users table with proper schema
- **UNIQUE INDEX on email** (critical requirement!)
- Index on last_login for sorting
- Test admin user (email: admin@example.com, password: admin)

**Start backend server:**

```bash
npm run dev
```

Server runs on http://localhost:5000

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit if needed (default should work)
nano .env

# Start development server
npm run dev
```

Frontend runs on http://localhost:3000

## 🎮 Usage

### Initial Login

Use the test admin account:
- Email: `admin@example.com`
- Password: `admin`

### Register New User

1. Click "Register here" on login page
2. Enter name, email, and any password (even 1 character works!)
3. Registration completes immediately
4. Verification email sent asynchronously (check spam folder)
5. Can login before email verification

### User Management

**Toolbar Actions:**
- **Block**: Prevents selected users from logging in
- **Unblock** (🔓 icon): Allows blocked users to login again
- **Delete** (🗑️ icon): Permanently removes selected users from database
- **Delete Unverified** (👤✖️ icon): Removes all users with unverified status

**Selection:**
- Click checkboxes to select individual users
- Click header checkbox to select/deselect all
- Toolbar shows number of selected users

**Important Notes:**
- Any user can block/delete any other user (including themselves)
- If you delete yourself, you'll be logged out immediately
- Deleted users are REALLY deleted (not just marked)
- Deleted users can re-register with the same email

## 🐳 Docker Deployment

For production deployment with Docker:

```bash
# Update docker-compose.yml with your email settings
nano docker-compose.yml

# Build and start all services
docker-compose up -d

# Run migration (first time only)
docker-compose exec backend npm run migrate

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

## 📧 Email Configuration

### Gmail Setup (Recommended for Testing)

1. Enable 2-Factor Authentication in Google Account
2. Generate App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create new app password
   - Use this password in `EMAIL_PASSWORD` (not your regular Gmail password)

### Other SMTP Providers

Update these in `.env`:
- `EMAIL_HOST` - SMTP server hostname
- `EMAIL_PORT` - Usually 587 for TLS or 465 for SSL
- `EMAIL_USER` - Your SMTP username
- `EMAIL_PASSWORD` - Your SMTP password

## 🔐 Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Protected Routes**: Middleware checks authentication
4. **Blocked User Check**: Server verifies user status on each request
5. **Unique Email Constraint**: Database-level email uniqueness
6. **CORS Protection**: Configured for specific origins
7. **Input Validation**: express-validator on all inputs

## 📊 Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'unverified' CHECK (status IN ('unverified', 'active', 'blocked')),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRITICAL: Unique index on email
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Performance index for sorting
CREATE INDEX idx_users_last_login ON users(last_login DESC NULLS LAST);
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Register new user → See success message immediately
- [ ] Check email → Receive verification email
- [ ] Click verification link → Status changes to "active"
- [ ] Login with unverified account → Works
- [ ] Login with blocked account → Denied
- [ ] Select multiple users → Block → Cannot login
- [ ] Unblock users → Can login again
- [ ] Delete users → Permanently removed
- [ ] Delete yourself → Auto-logout
- [ ] Re-register with deleted email → Works
- [ ] Try duplicate email registration → Error from database
- [ ] Select all checkbox → Selects/deselects all
- [ ] Delete unverified → Only unverified users removed

## 📱 API Endpoints

### Public Endpoints

```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
GET  /api/auth/verify?token=xxx - Verify email
```

### Protected Endpoints (Require JWT)

```
GET  /api/users - Get all users
POST /api/users/block - Block selected users
POST /api/users/unblock - Unblock selected users
POST /api/users/delete - Delete selected users
POST /api/users/delete-unverified - Delete all unverified users
```

## 🐛 Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -l`

### Email Not Sending
- Check SMTP credentials
- For Gmail, use App Password, not regular password
- Check spam folder
- View backend logs for email errors (non-blocking)

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check CORS configuration
- Verify `VITE_API_URL` in frontend `.env`

### User Can't Login After Blocking Themselves
- This is expected behavior
- Another user must unblock them
- Or delete and re-register

## 📄 License

This project is created for educational purposes.

## 👨‍💻 Development Notes

### Code Comments
- Extensive comments with **IMPORTANT**, **NOTE**, and **NOTA BENE** markers
- Small functions are well-documented
- Critical requirements highlighted in code

### Architecture Decisions
- Straightforward relational DB approach (PostgreSQL)
- Database-level constraints over code-level checks
- Async email sending to not block responses
- JWT for stateless authentication
- React with Bootstrap for professional UI

### Future Enhancements
- Rate limiting on API endpoints
- Password strength requirements
- Account lockout after failed login attempts
- Activity sparklines (mentioned as optional in requirements)
- Export users to CSV
- Advanced filtering and search
- Role-based access control
