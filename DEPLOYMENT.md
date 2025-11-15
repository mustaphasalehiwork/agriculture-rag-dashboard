# Deployment Guide - Agriculture RAG Dashboard

This guide will help you deploy the Agriculture RAG Dashboard to production using PM2.

## Prerequisites on Server

- Node.js 18+ installed
- PM2 installed globally (`npm install -g pm2`)
- Git installed
- Access to the server via SSH
- Supabase account and project

## Deployment Steps

### 1. Local Setup ✓

The following files have been configured:
- ✅ `next.config.ts` - Configured for standalone output
- ✅ `ecosystem.config.js` - PM2 configuration file
- ✅ `.env.example` - Environment variables template

### 2. On Your Server

#### Step 1: Clone the Repository

```bash
# Navigate to your web directory
cd /var/www

# Clone the repository
git clone <your-repository-url> agriculture-rag-dashboard

# Navigate to the project
cd agriculture-rag-dashboard
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the environment file with your actual credentials
nano .env.local
```

**Required Environment Variables:**

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3001

# Authentication
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=generate_a_32_character_random_string

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# File Storage
UPLOAD_DIR=/var/www/uploads

# Optional: n8n Webhooks
N8N_WEBHOOK_URL=http://localhost:5678
N8N_UPLOAD_WEBHOOK=/webhook/upload
N8N_DELETE_WEBHOOK=/webhook/delete
```

**Generate a secure SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 4: Setup Supabase Database

1. Create a new project in [Supabase](https://supabase.com)
2. Go to SQL Editor and run the following query:

```sql
CREATE TABLE ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  total_chunks INTEGER,
  chunks_processed INTEGER DEFAULT 0,
  current_step TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  document_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy (adjust based on your security needs)
CREATE POLICY "Enable all operations for all users" ON ingestion_jobs FOR ALL;
```

#### Step 5: Create Upload Directory

```bash
sudo mkdir -p /var/www/uploads
sudo chown -R $USER:$USER /var/www/uploads
chmod 755 /var/www/uploads
```

#### Step 6: Build the Application

```bash
npm run build
```

#### Step 7: Create PM2 Log Directory

```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

#### Step 8: Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save the PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup
# Follow the instructions from the output
```

#### Step 9: Verify Deployment

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs agriculture-rag-dashboard

# Monitor in real-time
pm2 monit
```

The dashboard should now be running on `http://YOUR_SERVER_IP:3001`

### 3. Setup Nginx Reverse Proxy (Optional but Recommended)

Create an Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/agriculture-rag-dashboard
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/agriculture-rag-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Setup SSL with Certbot (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## PM2 Commands Reference

```bash
# View application status
pm2 status

# View logs
pm2 logs agriculture-rag-dashboard

# View only error logs
pm2 logs agriculture-rag-dashboard --err

# Restart application
pm2 restart agriculture-rag-dashboard

# Stop application
pm2 stop agriculture-rag-dashboard

# Delete from PM2
pm2 delete agriculture-rag-dashboard

# Monitor CPU/Memory
pm2 monit

# Show detailed info
pm2 show agriculture-rag-dashboard
```

## Updating the Application

When you push updates to your repository:

```bash
# On server
cd /var/www/agriculture-rag-dashboard

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart agriculture-rag-dashboard
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, change it in:
1. `.env.local` file
2. `ecosystem.config.js` file

### Permission Errors for Upload Directory

```bash
sudo chown -R $USER:$USER /var/www/uploads
chmod 755 /var/www/uploads
```

### Application Won't Start

Check logs:
```bash
pm2 logs agriculture-rag-dashboard --lines 100
```

Check environment variables:
```bash
pm2 show agriculture-rag-dashboard
```

### Database Connection Issues

Verify Supabase credentials and network connectivity:
```bash
curl -I https://your-project.supabase.co
```

## Security Checklist

- ✅ Change default admin password
- ✅ Use strong SESSION_SECRET
- ✅ Configure firewall to only allow necessary ports
- ✅ Use HTTPS in production (via Nginx + Certbot)
- ✅ Keep dependencies updated (`npm audit`)
- ✅ Restrict file upload directory permissions
- ✅ Configure proper CORS if needed

## Monitoring

Set up PM2 monitoring:

```bash
# Enable PM2 monitoring
pm2 plus

# Or use PM2 logs with log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Support

For issues, check:
1. PM2 logs: `pm2 logs agriculture-rag-dashboard`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. System logs: `journalctl -u pm2-$USER -f`

---

**Access URL:** `http://YOUR_SERVER_IP:3001` (or your configured domain)
**Default Username:** Set in `.env.local`
**Default Password:** Set in `.env.local`