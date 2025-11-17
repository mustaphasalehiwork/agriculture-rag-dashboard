#!/bin/bash

echo "🚀 Fix 404 Error Script"
echo "======================"

# Step 1: Stop everything
echo "🛑 Stopping all containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.fixed.yml down

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

# Step 3: Clean up networks and volumes
echo "🧹 Cleaning up Docker resources..."
docker network prune -f
docker system prune -f

# Step 4: Recreate infrastructure
echo "🔗 Recreating Docker infrastructure..."
docker network create traefik-network
docker volume create traefik_data
docker volume create n8n_data
docker volume create n8n_files
docker volume create dashboard_uploads

# Step 5: Start with fixed configuration
echo "🔧 Starting with fixed configuration..."
docker-compose -f docker-compose.fixed.yml up -d --build

# Step 6: Wait and check
echo "⏳ Waiting for containers to start..."
sleep 30

echo "📊 Checking container status..."
docker-compose -f docker-compose.fixed.yml ps

# Step 7: Test internal connectivity
echo "🧪 Testing internal connectivity..."
if docker ps | grep -q agriculture-rag-dashboard; then
    echo "Checking if agriculture-rag-dashboard is running..."
    docker exec agriculture-rag-dashboard ps aux | grep node || echo "❌ Node.js not running"

    echo "Testing internal HTTP connection..."
    docker exec agriculture-rag-dashboard wget --spider http://localhost:3000 2>&1 && echo "✅ App responds internally" || echo "❌ App not responding internally"

    echo "Checking logs for any errors..."
    docker-compose -f docker-compose.fixed.yml logs --tail=10 agriculture-rag-dashboard
fi

# Step 8: Test Traefik
echo "🌐 Testing Traefik..."
if docker ps | grep -q traefik; then
    echo "Traefik is running, checking logs..."
    docker-compose -f docker-compose.fixed.yml logs --tail=10 traefik
fi

echo ""
echo "🎯 Manual Tests to Run:"
echo "======================"
echo "1. Test locally: curl -k https://dashboard.srv1061858.hstgr.cloud"
echo "2. Check Traefik: curl -k https://srv1061858.hstgr.cloud/dashboard/"
echo "3. Check logs: docker-compose -f docker-compose.fixed.yml logs -f"
echo "4. Check container: docker exec -it agriculture-rag-dashboard sh"
echo ""
echo "📱 URLs to Test:"
echo "- Dashboard: https://dashboard.srv1061858.hstgr.cloud"
echo "- n8n: https://n8n.srv1061858.hstgr.cloud"
echo ""
echo "🔍 If still 404, run: ./diagnose-404.sh"