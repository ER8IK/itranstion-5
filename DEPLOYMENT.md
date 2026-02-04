# Deployment Guide

This guide covers different deployment options for the User Management System.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- SMTP access (Gmail recommended)

### Steps

1. **Setup Database**
```bash
createdb user_management
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and email credentials
npm run migrate  # Creates tables and unique index
npm run dev      # Starts on port 5000
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev      # Starts on port 3000
```

4. **Access Application**
- Open http://localhost:3000
- Login: admin@example.com / admin

## 🐳 Docker Deployment (Recommended for Production)

### One-Command Deploy

```bash
# 1. Update email credentials in docker-compose.yml
nano docker-compose.yml

# 2. Start everything
docker-compose up -d

# 3. Run migration (first time only)
docker-compose exec backend npm run migrate

# 4. Access at http://localhost:3000
```

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

## ☁️ Cloud Deployment Options

### Option 1: Heroku

**Backend:**
```bash
cd backend
heroku create your-app-name-api
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET=your-secret
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set FRONTEND_URL=https://your-frontend.netlify.app
git push heroku main
heroku run npm run migrate
```

**Frontend:**
```bash
cd frontend
# Update VITE_API_URL in .env to Heroku backend URL
npm run build
# Deploy dist/ folder to Netlify or Vercel
```

### Option 2: DigitalOcean App Platform

1. Create PostgreSQL database
2. Create two apps:
   - Backend (Node.js from /backend)
   - Frontend (Static Site from /frontend)
3. Set environment variables
4. Run migration via console

### Option 3: AWS

**RDS for PostgreSQL + EC2 for apps:**

```bash
# Install Node.js on EC2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
sudo apt-get install postgresql-client

# Clone repo
git clone <your-repo>
cd user-management-app

# Setup backend
cd backend
npm install
npm run build
# Run with PM2
npm install -g pm2
pm2 start dist/server.js --name user-api
pm2 save
pm2 startup

# Setup frontend with nginx
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

### Option 4: Railway

1. Create account at railway.app
2. Create new project
3. Add PostgreSQL service
4. Add backend service (from /backend)
5. Add frontend service (from /frontend)
6. Set environment variables
7. Run migration

### Option 5: Render

**Database:**
- Create PostgreSQL instance

**Backend:**
- Create Web Service from /backend
- Build Command: `npm install && npm run build`
- Start Command: `npm run migrate && npm start`
- Add environment variables

**Frontend:**
- Create Static Site from /frontend
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

## 🔐 Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use proper SMTP credentials (not development Gmail)
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (use Let's Encrypt or cloud provider SSL)
- [ ] Configure CORS for specific origins only
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Review database connection pool settings
- [ ] Set appropriate rate limits
- [ ] Use environment-specific .env files
- [ ] Don't commit .env files to git

## 📧 Email Configuration for Production

### Recommended Services

1. **SendGrid** (Free tier: 100 emails/day)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

2. **Mailgun** (Free tier: 5000 emails/month)
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

3. **AWS SES** (Very cheap, reliable)
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-user
EMAIL_PASSWORD=your-ses-smtp-password
```

## 🔍 Environment Variables Reference

### Backend Required Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_management
DB_USER=your_user
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=change-this-to-random-string
JWT_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Frontend
FRONTEND_URL=https://yourapp.com
```

### Frontend Required Variables

```env
# API endpoint
VITE_API_URL=https://api.yourapp.com/api
```

## 🔄 Database Migration in Production

**Important:** Always run migration before starting the backend:

```bash
# Docker
docker-compose exec backend npm run migrate

# Heroku
heroku run npm run migrate -a your-app-name

# SSH/EC2
cd backend && npm run migrate

# Railway/Render
# Add to start command: npm run migrate && npm start
```

## 📊 Monitoring

### Health Check Endpoints

- Backend: `GET /api/health`
- Example response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-04T10:30:00.000Z",
  "environment": "production"
}
```

### Logging

Backend logs include:
- HTTP requests (method, path, timestamp)
- Authentication attempts
- Email sending status
- Database errors
- User actions

Monitor logs:
```bash
# Docker
docker-compose logs -f backend

# PM2
pm2 logs user-api

# Heroku
heroku logs --tail -a your-app-name
```

## 🛡️ Security Best Practices

1. **Always use HTTPS in production**
2. **Never commit .env files**
3. **Rotate JWT_SECRET periodically**
4. **Use prepared statements** (already done with pg parameterized queries)
5. **Validate all inputs** (already done with express-validator)
6. **Rate limit API endpoints** (consider adding express-rate-limit)
7. **Monitor for suspicious activity**
8. **Keep dependencies updated**

## 🔧 Troubleshooting Production Issues

### Cannot connect to database
```bash
# Test connection
psql -h HOST -U USER -d DATABASE -c "SELECT 1"

# Check environment variables
echo $DATABASE_URL
```

### Emails not sending
```bash
# Check logs for email errors
docker-compose logs backend | grep email

# Test SMTP connection
telnet smtp.gmail.com 587
```

### Frontend shows blank page
- Check browser console for errors
- Verify VITE_API_URL is correct
- Check CORS configuration on backend
- Verify backend is accessible

### Database migration fails
```bash
# Check if migration already ran
psql -d user_management -c "SELECT * FROM users LIMIT 1"

# Drop and recreate (CAUTION: loses data)
psql -d user_management -c "DROP TABLE users CASCADE"
npm run migrate
```

## 📱 Scaling Considerations

### Horizontal Scaling

- Use Redis for session storage
- Implement database connection pooling (already done)
- Use load balancer (nginx, AWS ELB)
- Deploy multiple backend instances

### Database Optimization

- Regular VACUUM and ANALYZE
- Monitor slow queries
- Add indexes as needed (already have unique index on email)
- Consider read replicas for high traffic

### Caching

Consider adding:
- Redis for session/token caching
- CDN for frontend static assets
- Database query result caching

## 🆘 Support

For deployment issues:
1. Check logs first
2. Verify all environment variables
3. Test database connection
4. Check firewall/security group rules
5. Verify DNS settings

---

**Good luck with your deployment! 🚀**
