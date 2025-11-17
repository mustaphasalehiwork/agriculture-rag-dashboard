#!/bin/bash

echo "🔧 Fix and Deploy Script"

# Step 1: Clean up
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Step 2: Create .env file
echo "📝 Creating .env file..."
cat > .env << EOF
DOMAIN_NAME=srv1061858.hstgr.cloud
SUBDOMAIN=n8n
DASHBOARD_SUBDOMAIN=dashboard
SSL_EMAIL=user@srv1061858.hstgr.cloud
GENERIC_TIMEZONE=Europe/Berlin
SUPABASE_URL=https://usdczcysugyjfywdrqrw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGN6Y3lzdWd5amZ5d2RycXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDk1MjAsImV4cCI6MjA3NjYyNTUyMH0.0myp3XDlPVqFd2U32PBFN0rsiJ5RVVy6JgPYAmqJYGs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGN6Y3lzdWd5amZ5d2RycXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA0OTUyMCwiZXhwIjoyMDc2NjI1NTIwfQ.ZxThZrJ4vwmMJHLKzsRi-tyrIM6806T-9Kok_-qYlD0
JWT_SECRET=78981ee1ef0f0f653bf2c617f38fa74ff8f773e9260249839a570f8d2e39300f7e6a7fb7f4ac683b5b42e1b3f1f4d668c14df48cdf5ee6fdba18882bb8091861
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
SESSION_SECRET=9a5df49991116d7f9687e7f4de89d91ba3e1043829e2d35d9b0d0371b77055bb
EOF

# Step 3: Setup network and volumes
echo "🔗 Setting up Docker infrastructure..."
docker network create traefik-network 2>/dev/null || echo "Network exists"
docker volume create traefik_data 2>/dev/null || echo "Volume exists"
docker volume create n8n_data 2>/dev/null || echo "Volume exists"
docker volume create n8n_files 2>/dev/null || echo "Volume exists"
docker volume create dashboard_uploads 2>/dev/null || echo "Volume exists"

# Step 4: Test with simple config first
echo "🧪 Testing deployment..."

# Start with building and starting just our app first
echo "Building agriculture-rag-dashboard..."
docker-compose -f docker-compose.prod.yml build agriculture-rag-dashboard

echo "Starting agriculture-rag-dashboard..."
docker-compose -f docker-compose.prod.yml up -d agriculture-rag-dashboard

# Wait a bit
sleep 10

echo "Checking if app is running internally..."
docker exec agriculture-rag-dashboard wget --spider http://localhost:3000 || echo "App not responding internally"

# Step 5: Start full stack
echo "🚀 Starting full stack..."
docker-compose -f docker-compose.prod.yml up -d

# Step 6: Show status and logs
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📋 Recent Logs:"
echo "=== Traefik Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 traefik

echo "=== Dashboard Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 agriculture-rag-dashboard

echo ""
echo "🌐 Access URLs:"
echo "   Dashboard: https://dashboard.srv1061858.hstgr.cloud"
echo "   n8n:       https://n8n.srv1061858.hstgr.cloud"
echo ""
echo "🔍 To check logs: docker-compose -f docker-compose.prod.yml logs -f [service_name]"