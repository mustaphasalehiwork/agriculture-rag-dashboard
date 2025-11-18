#!/bin/bash

echo "=== Fixing Traefik Routing Issues ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment variables loaded:"
    echo "  - DOMAIN_NAME: ${DOMAIN_NAME}"
    echo "  - DASHBOARD_SUBDOMAIN: ${DASHBOARD_SUBDOMAIN}"
    echo "  - SUBDOMAIN: ${SUBDOMAIN}"
    echo ""
fi

echo "1. Stopping current services..."
docker-compose down || true
echo ""

echo "2. Cleaning up any conflicting containers..."
docker rm -f agriculture-rag-dashboard agriculture-rag-dashboard-n8n-1 agriculture-rag-dashboard-traefik-1 2>/dev/null || true
echo ""

echo "3. Creating network if not exists..."
docker network create traefik-network 2>/dev/null || echo "Network already exists"
echo ""

echo "4. Creating volumes if not exists..."
docker volume create traefik_data 2>/dev/null || echo "Volume already exists"
docker volume create n8n_data 2>/dev/null || echo "Volume already exists"
echo ""

echo "5. Starting services with fixed configuration..."
docker-compose -f docker-compose.fixed.yml up -d --build
echo ""

echo "6. Waiting for services to start..."
sleep 30
echo ""

echo "7. Checking service status..."
docker-compose -f docker-compose.fixed.yml ps
echo ""

echo "8. Testing local access..."
echo "Testing dashboard locally..."
curl -I http://localhost:3000 2>/dev/null && echo "✓ Dashboard accessible locally" || echo "✗ Dashboard not accessible locally"
echo ""

echo "Testing N8N locally..."
curl -I http://localhost:5678 2>/dev/null && echo "✓ N8N accessible locally" || echo "✗ N8N not accessible locally"
echo ""

echo "9. Checking Traefik logs..."
echo "=== Traefik Logs ==="
docker-compose -f docker-compose.fixed.yml logs traefik --tail=15
echo ""

echo "10. Testing DNS resolution..."
if [ ! -z "${DOMAIN_NAME}" ]; then
    echo "Testing DNS for ${DOMAIN_NAME}..."
    nslookup ${DOMAIN_NAME} >/dev/null 2>&1 && echo "✓ Domain DNS resolves" || echo "✗ Domain DNS failed"

    echo "Testing DNS for ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}..."
    nslookup ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME} >/dev/null 2>&1 && echo "✓ Dashboard subdomain DNS resolves" || echo "✗ Dashboard subdomain DNS failed"

    echo "Testing DNS for ${SUBDOMAIN}.${DOMAIN_NAME}..."
    nslookup ${SUBDOMAIN}.${DOMAIN_NAME} >/dev/null 2>&1 && echo "✓ N8N subdomain DNS resolves" || echo "✗ N8N subdomain DNS failed"
fi
echo ""

echo "11. Testing HTTP access..."
if [ ! -z "${DASHBOARD_SUBDOMAIN}" ] && [ ! -z "${DOMAIN_NAME}" ]; then
    echo "Testing HTTP access to ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}..."
    curl -I http://${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME} 2>/dev/null && echo "✓ HTTP access works (should redirect to HTTPS)" || echo "✗ HTTP access failed"
fi
echo ""

echo "=== Expected URLs ==="
echo "Dashboard: https://${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}"
echo "N8N: https://${SUBDOMAIN}.${DOMAIN_NAME}"
echo "Traefik Dashboard: https://traefik.${DOMAIN_NAME}"
echo ""

echo "=== If still seeing 404, check: ==="
echo "1. DNS A records pointing to server IP"
echo "2. Firewall allows ports 80 and 443"
echo "3. SSL certificate generation (check Traefik logs)"
echo "4. Container health status: docker-compose -f docker-compose.fixed.yml ps"