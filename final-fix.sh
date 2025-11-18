#!/bin/bash

echo "=== FINAL FIX - Clean Deployment ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment variables loaded"
fi

echo "1. Complete cleanup..."
docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.fixed.yml down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true

echo "Removing all containers..."
docker rm -f agriculture-rag-dashboard agriculture-rag-dashboard_n8n_1 agriculture-rag-dashboard_traefik_1 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=agriculture") 2>/dev/null || true

echo "Removing old networks..."
docker network rm traefik-network 2>/dev/null || true
docker network rm agriculture-rag-dashboard_web 2>/dev/null || true
echo ""

echo "2. Creating fresh network..."
docker network create web
echo ""

echo "3. Starting with simple configuration..."
docker-compose -f docker-compose.simple.yml up -d --build
echo ""

echo "4. Waiting for services to start (this may take 2-3 minutes)..."
sleep 90
echo ""

echo "5. Checking container status..."
docker-compose -f docker-compose.simple.yml ps
echo ""

echo "6. Testing direct local access..."
echo "Testing dashboard on port 3000..."
curl -I http://localhost:3000 2>/dev/null | head -1 && echo "✓ Dashboard accessible locally" || echo "✗ Dashboard not accessible locally"

echo "Testing N8N on port 5678..."
curl -I http://localhost:5678 2>/dev/null | head -1 && echo "✓ N8N accessible locally" || echo "✗ N8N not accessible locally"
echo ""

echo "7. Testing Traefik dashboard on port 8080..."
curl -I http://localhost:8080 2>/dev/null | head -1 && echo "✓ Traefik dashboard accessible locally" || echo "✗ Traefik dashboard not accessible locally"
echo ""

echo "8. Testing container connectivity..."
DASHBOARD_CONTAINER=$(docker ps -q --filter "name=agriculture-rag-dashboard")
TRAEFIK_CONTAINER=$(docker ps -q --filter "name=traefik")

if [ ! -z "$DASHBOARD_CONTAINER" ] && [ ! -z "$TRAEFIK_CONTAINER" ]; then
    echo "Testing dashboard from Traefik..."
    docker exec $TRAEFIK_CONTAINER wget -q --spider http://agriculture-rag-dashboard:3000 2>/dev/null && echo "✓ Traefik can reach dashboard" || echo "✗ Traefik cannot reach dashboard"
else
    echo "⚠️ Could not find containers for connectivity test"
fi
echo ""

echo "9. Checking service logs..."
echo "=== Traefik Logs (last 10 lines) ==="
docker-compose -f docker-compose.simple.yml logs traefik --tail=10 2>/dev/null || docker logs $(docker ps -q --filter "name=traefik") --tail=10

echo ""
echo "=== Dashboard Logs (last 10 lines) ==="
docker-compose -f docker-compose.simple.yml logs agriculture-rag-dashboard --tail=10 2>/dev/null || docker logs $DASHBOARD_CONTAINER --tail=10
echo ""

echo "10. Testing HTTPS access (if local access works)..."
if [ ! -z "${DASHBOARD_SUBDOMAIN}" ] && [ ! -z "${DOMAIN_NAME}" ]; then
    echo "Testing HTTPS to ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}..."
    timeout 15 curl -I https://${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME} 2>/dev/null | head -1 && echo "✓ HTTPS access works!" || echo "✗ HTTPS access failed"

    echo "Testing HTTPS to ${SUBDOMAIN}.${DOMAIN_NAME}..."
    timeout 15 curl -I https://${SUBDOMAIN}.${DOMAIN_NAME} 2>/dev/null | head -1 && echo "✓ N8N HTTPS works!" || echo "✗ N8N HTTPS access failed"
fi

echo ""
echo "=== FINAL STATUS ==="
echo "If local access (ports 3000, 5678, 8080) works but HTTPS doesn't:"
echo "1. ✅ Application containers are working correctly"
echo "2. ❌ SSL certificate or DNS configuration needs attention"
echo ""
echo "If local access doesn't work:"
echo "1. ❌ Application containers have issues"
echo "2. Check container logs above for errors"
echo ""
echo "Expected URLs:"
echo "- Dashboard: https://${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}"
echo "- N8N: https://${SUBDOMAIN}.${DOMAIN_NAME}"
echo "- Traefik Dashboard: http://localhost:8080"