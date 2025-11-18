#!/bin/bash

echo "=== Debugging Dashboard Access ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "1. Testing dashboard root path locally..."
echo "Request: http://localhost:3000"
curl -v http://localhost:3000 2>&1 | head -20
echo ""

echo "2. Testing dashboard login path locally..."
echo "Request: http://localhost:3000/login"
curl -v http://localhost:3000/login 2>&1 | head -20
echo ""

echo "3. Testing dashboard through Traefik locally..."
echo "Request: http://localhost (should redirect to https://dashboard.srv1061858.hstgr.cloud)"
curl -v -H "Host: dashboard.srv1061858.hstgr.cloud" http://localhost 2>&1 | head -20
echo ""

echo "4. Testing dashboard through HTTPS..."
echo "Request: https://dashboard.srv1061858.hstgr.cloud"
curl -v https://dashboard.srv1061858.hstgr.cloud 2>&1 | head -20
echo ""

echo "5. Checking current Traefik routers..."
echo "Available routers:"
curl -s http://localhost:8080/api/http/routers | grep -o '"name":"[^"]*"' | sort
echo ""

echo "6. Checking dashboard router configuration..."
curl -s http://localhost:8080/api/http/routers | grep -A 10 -B 5 "dashboard" || echo "Dashboard router not found"
echo ""

echo "7. Checking dashboard service configuration..."
curl -s http://localhost:8080/api/http/services | grep -A 5 -B 5 "dashboard" || echo "Dashboard service not found"
echo ""

echo "8. Container network inspection..."
echo "Containers in web network:"
docker network inspect agriculture-rag-dashboard_web --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}} {{end}}'
echo ""

echo "9. Direct container communication test..."
DASHBOARD_CONTAINER=$(docker ps -q --filter "name=agriculture-rag-dashboard")
TRAEFIK_CONTAINER=$(docker ps -q --filter "name=traefik")

if [ ! -z "$DASHBOARD_CONTAINER" ]; then
    echo "Testing dashboard container health..."
    docker exec $DASHBOARD_CONTAINER wget -q --spider http://localhost:3000 && echo "✓ Container can reach itself" || echo "✗ Container cannot reach itself"

    echo "Testing dashboard container response..."
    docker exec $DASHBOARD_CONTAINER curl -I http://localhost:3000 2>/dev/null | head -3
fi

echo ""
echo "=== Recommended Fixes ==="
echo "If dashboard shows 307 redirects but 404 on final destination:"
echo "1. Check Next.js routing configuration"
echo "2. Verify BASE_URL or NEXT_PUBLIC_URL environment variables"
echo "3. Check if application expects a specific base path"