#!/bin/bash

echo "🚨 Emergency Fix Script"
echo "======================="

# Step 1: Clean up everything
echo "🧹 Cleaning up all containers..."
docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"

# Step 2: Clean up networks
echo "🔗 Cleaning up networks..."
docker network prune -f

# Step 3: Create fresh .env
echo "📝 Creating fresh .env file..."
cat > .env << 'EOF'
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

# Step 4: Recreate infrastructure
echo "🏗️ Recreating Docker infrastructure..."
docker network create traefik-network
docker volume create traefik_data
docker volume create n8n_data
docker volume create n8n_files
docker volume create dashboard_uploads

# Step 5: Test agriculture-rag-dashboard alone first
echo "🧪 Testing agriculture-rag-dashboard standalone..."
docker run -d --name test-dashboard \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SUPABASE_URL=https://usdczcysugyjfywdrqrw.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGN6Y3lzdWd5amZ5d2RycXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDk1MjAsImV4cCI6MjA3NjYyNTUyMH0.0myp3XDlPVqFd2U32PBFN0rsiJ5RVVy6JgPYAmqJYGs \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGN6Y3lzdWd5amZ5d2RycXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA0OTUyMCwiZXhwIjoyMDc2NjI1NTIwfQ.ZxThZrJ4vwmMJHLKzsRi-tyrIM6806T-9Kok_-qYlD0 \
  -e JWT_SECRET=78981ee1ef0f0f653bf2c617f38fa74ff8f773e9260249839a570f8d2e39300f7e6a7fb7f4ac683b5b42e1b3f1f4d668c14df48cdf5ee6fdba18882bb8091861 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin \
  -e SESSION_SECRET=9a5df49991116d7f9687e7f4de89d91ba3e1043829e2d35d9b0d0371b77055bb \
  agriculture-rag-dashboard

echo "⏳ Waiting for test container to start..."
sleep 20

echo "🔍 Testing standalone container..."
docker ps -a | grep test-dashboard

echo "📋 Checking logs..."
docker logs test-dashboard

echo "🌐 Testing HTTP connection..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ App is working on port 3000!"
    docker stop test-dashboard
    docker rm test-dashboard

    echo "🚀 Starting full stack with working app..."
    docker-compose -f docker-compose.fixed.yml up -d --build

else
    echo "❌ App is not working even standalone"
    echo "🔍 Debugging further..."
    docker exec test-dashboard ps aux || echo "Cannot exec into container"
    docker logs test-dashboard --tail 50
fi

sleep 20

echo "📊 Final status check..."
docker-compose -f docker-compose.fixed.yml ps

echo "🌐 Testing URLs..."
echo "Testing HTTP: http://srv1061858.hstgr.cloud:3000"
curl -I http://srv1061858.hstgr.cloud:3000 2>/dev/null || echo "❌ Direct connection failed"

echo "Testing HTTPS: https://dashboard.srv1061858.hstgr.cloud"
curl -k -I https://dashboard.srv1061858.hstgr.cloud 2>/dev/null || echo "❌ HTTPS connection failed"

echo ""
echo "📝 Manual commands to run:"
echo "1. Check containers: docker-compose -f docker-compose.fixed.yml ps"
echo "2. Check logs: docker-compose -f docker-compose.fixed.yml logs [service]"
echo "3. Access Traefik: https://srv1061858.hstgr.cloud/dashboard/ (if Traefik works)"
echo "4. Access app: http://srv1061858.hstgr.cloud:3000 (direct port)"
echo "5. Restart everything: docker-compose -f docker-compose.fixed.yml restart"