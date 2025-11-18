#!/bin/bash

echo "=== Diagnosing Traefik Routing Issues ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "Environment variables loaded:"
    echo "- DOMAIN_NAME: ${DOMAIN_NAME}"
    echo "- DASHBOARD_SUBDOMAIN: ${DASHBOARD_SUBDOMAIN}"
    echo "- SUBDOMAIN: ${SUBDOMAIN}"
    echo ""
fi

echo "1. Checking container status..."
docker-compose ps
echo ""

echo "2. Testing direct IP access to dashboard..."
curl -I http://127.0.0.1:3000 || echo "Dashboard not accessible locally"
echo ""

echo "3. Testing direct IP access to N8N..."
curl -I http://127.0.0.1:5678 || echo "N8N not accessible locally"
echo ""

echo "4. Checking Traefik logs for routing errors..."
docker-compose logs traefik --tail=20
echo ""

echo "5. Checking dashboard logs..."
docker-compose logs agriculture-rag-dashboard --tail=10
echo ""

echo "6. Checking network connectivity..."
echo "Containers in traefik-network:"
docker network inspect traefik-network --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}} {{end}}'
echo ""

echo "7. Testing DNS resolution..."
if [ ! -z "${DOMAIN_NAME}" ]; then
    echo "Testing DNS for ${DOMAIN_NAME}..."
    nslookup ${DOMAIN_NAME} || echo "DNS resolution failed for ${DOMAIN_NAME}"
    echo ""
    if [ ! -z "${DASHBOARD_SUBDOMAIN}" ]; then
        echo "Testing DNS for ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}..."
        nslookup ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME} || echo "DNS resolution failed for ${DASHBOARD_SUBDOMAIN}.${DOMAIN_NAME}"
    fi
else
    echo "DOMAIN_NAME not set in environment variables"
fi
echo ""

echo "8. Checking Traefik dashboard access..."
echo "Traefik should be accessible at: http://localhost:8080/dashboard/"
curl -I http://localhost:8080/dashboard/ || echo "Traefik dashboard not accessible"
echo ""

echo "9. Checking SSL certificate status..."
docker exec $(docker-compose ps -q traefik) ls -la /letsencrypt/ 2>/dev/null || echo "Cannot access LetsEncrypt directory"
echo ""

echo "=== End of Diagnosis ==="