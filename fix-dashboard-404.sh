#!/bin/bash

echo "=== Fixing Dashboard 404 Issue ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment variables loaded"
fi

echo "1. Testing current dashboard behavior..."
echo "Testing root path:"
curl -I http://localhost:3000 2>/dev/null | head -3

echo ""
echo "Testing /login path:"
curl -I http://localhost:3000/login 2>/dev/null | head -3

echo ""
echo "2. Checking if Next.js needs HOSTNAME and PORT environment variables..."
DASHBOARD_CONTAINER=$(docker ps -q --filter "name=agriculture-rag-dashboard")

if [ ! -z "$DASHBOARD_CONTAINER" ]; then
    echo "Current environment variables in dashboard container:"
    docker exec $DASHBOARD_CONTAINER env | grep -E "(NODE_ENV|PORT|HOSTNAME|NEXT_PUBLIC)"
fi

echo ""
echo "3. Adding missing environment variables if needed..."
# Check if container already has the right variables
if docker exec $DASHBOARD_CONTAINER env | grep -q "HOSTNAME=0.0.0.0"; then
    echo "✓ HOSTNAME already set correctly"
else
    echo "⚠️ HOSTNAME not set properly - may need to restart container"
fi

echo ""
echo "4. Testing direct IP access vs localhost..."
echo "Testing via container IP:"
CONTAINER_IP=$(docker inspect $DASHBOARD_CONTAINER | jq -r '.[0].NetworkSettings.Networks.agriculture-rag-dashboard_web.IPAddress')
if [ ! -z "$CONTAINER_IP" ] && [ "$CONTAINER_IP" != "null" ]; then
    echo "Container IP: $CONTAINER_IP"
    curl -I http://$CONTAINER_IP:3000 2>/dev/null | head -3 || echo "Cannot access via container IP"
else
    echo "Could not determine container IP"
fi

echo ""
echo "5. Testing Traefik routing rules..."
echo "Current routers:"
curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("dashboard")) | {name: .name, rule: .rule, service: .service, status: .status}' 2>/dev/null || echo "Could not fetch router info"

echo ""
echo "6. Testing with different Host headers..."
echo "Testing dashboard subdomain:"
curl -I -H "Host: dashboard.srv1061858.hstgr.cloud" http://localhost 2>/dev/null | head -3

echo ""
echo "7. Checking if there's a base path issue..."
# Sometimes Next.js apps need to know they're behind a proxy
echo "Testing with absolute URL:"
curl -I -H "Host: dashboard.srv1061858.hstgr.cloud" -H "X-Forwarded-Proto: https" -H "X-Forwarded-Host: dashboard.srv1061858.hstgr.cloud" http://localhost 2>/dev/null | head -3

echo ""
echo "=== QUICK FIXES TO TRY ==="

echo ""
echo "Option 1: Add base URL environment variable"
echo "Add to docker-compose.simple.yml under agriculture-rag-dashboard environment:"
echo "- NEXT_PUBLIC_BASE_URL=https://dashboard.srv1061858.hstgr.cloud"
echo "- VERCEL_URL=https://dashboard.srv1061858.hstgr.cloud"

echo ""
echo "Option 2: Check Next.js configuration"
echo "Verify next.config.js has correct basePath and assetPrefix settings"

echo ""
echo "Option 3: Test different routing configuration"
echo "The issue might be with Next.js internal routing vs Traefik routing"

echo ""
echo "8. Would you like me to apply Option 1? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Applying base URL fix..."

    # Create updated docker-compose with base URL
    cp docker-compose.simple.yml docker-compose.simple.yml.backup

    # Add the environment variables
    sed -i '/HOSTNAME=0.0.0.0/a\      - "NEXT_PUBLIC_BASE_URL=https://${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}"' docker-compose.simple.yml
    sed -i '/NEXT_PUBLIC_BASE_URL=/a\      - "VERCEL_URL=https://${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}"' docker-compose.simple.yml

    echo "Restarting services..."
    docker-compose -f docker-compose.simple.yml down
    docker-compose -f docker-compose.simple.yml up -d

    echo "Waiting for services to start..."
    sleep 30

    echo "Testing HTTPS access again..."
    curl -I https://dashboard.srv1061858.hstgr.cloud 2>/dev/null | head -5
else
    echo "Skipping automatic fix. Please debug manually using the information above."
fi

echo ""
echo "Manual debugging steps:"
echo "1. Run: ./debug-dashboard.sh"
echo "2. Check browser developer tools for redirect chain"
echo "3. Verify what URL the browser is trying to access after redirects"