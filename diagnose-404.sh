#!/bin/bash

echo "🔍 404 Error Diagnosis Script"
echo "================================"

# Step 1: Check if containers are running
echo "1️⃣ Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "2️⃣ Checking detailed container info..."
docker ps -a --filter "name=agriculture" --filter "name=traefik"

echo ""
echo "3️⃣ Checking networks..."
docker network ls | grep traefik

if docker network ls | grep -q traefik-network; then
    echo "✅ traefik-network exists"
    docker network inspect traefik-network | grep -A 10 "Containers"
else
    echo "❌ traefik-network does not exist!"
fi

echo ""
echo "4️⃣ Checking Traefik logs..."
docker-compose -f docker-compose.prod.yml logs --tail=20 traefik

echo ""
echo "5️⃣ Checking dashboard logs..."
docker-compose -f docker-compose.prod.yml logs --tail=20 agriculture-rag-dashboard

echo ""
echo "6️⃣ Testing internal connectivity..."
if docker ps | grep -q agriculture-rag-dashboard; then
    echo "Testing if app responds internally..."
    docker exec agriculture-rag-dashboard wget --spider http://localhost:3000 2>&1 || echo "❌ App not responding on port 3000"

    echo "Testing process inside container..."
    docker exec agriculture-rag-dashboard ps aux || echo "❌ Cannot list processes"

    echo "Checking if Node.js is running..."
    docker exec agriculture-rag-dashboard pgrep node || echo "❌ Node.js process not found"
else
    echo "❌ agriculture-rag-dashboard container is not running!"
fi

echo ""
echo "7️⃣ Checking DNS resolution..."
if command -v nslookup >/dev/null 2>&1; then
    nslookup dashboard.srv1061858.hstgr.cloud || echo "❌ DNS resolution failed"
else
    echo "⚠️ nslookup not available, trying ping..."
    ping -c 1 dashboard.srv1061858.hstgr.cloud 2>/dev/null || echo "❌ Cannot resolve hostname"
fi

echo ""
echo "8️⃣ Testing direct HTTP connection..."
if command -v curl >/dev/null 2>&1; then
    echo "Testing HTTP to dashboard..."
    curl -I http://dashboard.srv1061858.hstgr.cloud 2>&1 || echo "❌ HTTP connection failed"

    echo "Testing HTTPS to dashboard..."
    curl -k -I https://dashboard.srv1061858.hstgr.cloud 2>&1 || echo "❌ HTTPS connection failed"

    echo "Testing Traefik dashboard..."
    curl -k -I http://srv1061858.hstgr.cloud 2>&1 || echo "❌ Cannot reach Traefik"
else
    echo "⚠️ curl not available"
fi

echo ""
echo "🎯 Quick Fix Attempts..."
echo "========================"

# Fix 1: Restart agriculture-rag-dashboard
echo "Attempting to restart agriculture-rag-dashboard..."
docker-compose -f docker-compose.prod.yml restart agriculture-rag-dashboard

sleep 10

# Fix 2: Check if it's working now
echo "Testing again after restart..."
if docker ps | grep -q agriculture-rag-dashboard; then
    docker exec agriculture-rag-dashboard wget --spider http://localhost:3000 && echo "✅ App is responding!" || echo "❌ Still not responding"
fi

echo ""
echo "📊 Final Status Check..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔧 Recommended Actions:"
echo "1. If container is not running: docker-compose -f docker-compose.prod.yml up -d agriculture-rag-dashboard"
echo "2. If app is not responding: docker-compose -f docker-compose.prod.yml logs agriculture-rag-dashboard"
echo "3. If network issue: docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d"
echo "4. Try accessing: http://srv1061858.hstgr.cloud (should show Traefik or 404)"