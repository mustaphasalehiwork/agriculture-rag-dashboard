#!/bin/bash

echo "=== Quick Fix for Routing Issues ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "1. Stopping all services..."
docker-compose -f docker-compose.fixed.yml down
echo ""

echo "2. Removing containers to force fresh recreation..."
docker rm -f agriculture-rag-dashboard agriculture-rag-dashboard_n8n_1 agriculture-rag-dashboard_traefik_1 2>/dev/null || true
echo ""

echo "3. Starting services with corrected port mappings..."
docker-compose -f docker-compose.fixed.yml up -d
echo ""

echo "4. Waiting for services to start..."
sleep 45
echo ""

echo "5. Checking container status..."
docker-compose -f docker-compose.fixed.yml ps
echo ""

echo "6. Testing local access (should work now)..."
echo "Testing dashboard on port 3000..."
curl -I http://127.0.0.1:3000 2>/dev/null && echo "✓ Dashboard accessible locally" || echo "✗ Dashboard still not accessible locally"

echo "Testing N8N on port 5678..."
curl -I http://127.0.0.1:5678 2>/dev/null && echo "✓ N8N accessible locally" || echo "✗ N8N still not accessible locally"
echo ""

echo "7. Testing container connectivity..."
echo "Testing dashboard from Traefik container..."
docker exec agriculture-rag-dashboard_traefik_1 wget -q --spider http://172.18.0.2:3000 2>/dev/null && echo "✓ Traefik can reach dashboard" || echo "✗ Traefik cannot reach dashboard"

echo "Testing N8N from Traefik container..."
docker exec agriculture-rag-dashboard_traefik_1 wget -q --spider http://172.18.0.4:5678 2>/dev/null && echo "✓ Traefik can reach N8N" || echo "✗ Traefik cannot reach N8N"
echo ""

echo "8. Checking container logs..."
echo "=== Dashboard Logs ==="
docker logs agriculture-rag-dashboard --tail=10

echo ""
echo "=== N8N Logs ==="
docker logs agriculture-rag-dashboard_n8n_1 --tail=10

echo ""
echo "=== Traefik Logs ==="
docker logs agriculture-rag-dashboard_traefik_1 --tail=10
echo ""

echo "9. Testing HTTPS access..."
if [ ! -z "${DASHBOARD_SUBDOMAIN}" ] && [ ! -z "${DOMAIN_NAME}" ]; then
    echo "Testing HTTPS access to ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}..."
    timeout 10 curl -I https://${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME} 2>/dev/null && echo "✓ HTTPS access works" || echo "✗ HTTPS access failed (check SSL certificate)"
fi

echo ""
echo "=== If local access works but HTTPS doesn't: ==="
echo "1. Check SSL certificate generation in Traefik logs"
echo "2. Verify domain A records point to this server"
echo "3. Check firewall allows ports 80 and 443"
echo ""
echo "Next steps if still not working:"
echo "- Run: docker logs agriculture-rag-dashboard_traefik_1"
echo "- Run: docker-compose -f docker-compose.fixed.yml logs"