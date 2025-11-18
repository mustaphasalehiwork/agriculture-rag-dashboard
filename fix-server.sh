#!/bin/bash

echo "=== Fix Docker Compose Issues on Server ==="
echo ""

# Check Docker and Docker Compose versions
echo "1. Checking Docker versions:"
docker --version
docker-compose --version
echo ""

# Clean up existing containers and images that might cause conflicts
echo "2. Cleaning up existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f
echo ""

# Remove any conflicting containers
echo "3. Removing any existing containers..."
docker rm -f agriculture-rag-dashboard agriculture-rag-dashboard-n8n-1 agriculture-rag-dashboard-traefik-1 2>/dev/null || true
echo ""

# Create network if it doesn't exist
echo "4. Creating traefik-network..."
docker network create traefik-network 2>/dev/null || echo "Network already exists"
echo ""

# Create volumes if they don't exist
echo "5. Creating volumes..."
docker volume create traefik_data 2>/dev/null || echo "Volume already exists"
docker volume create n8n_data 2>/dev/null || echo "Volume already exists"
echo ""

echo "6. Building and starting services with server-optimized configuration..."
docker-compose -f docker-compose.server.yml up -d --build
echo ""

echo "7. Checking service status..."
docker-compose -f docker-compose.server.yml ps
echo ""

echo "8. Checking logs for any errors..."
echo "=== Traefik Logs ==="
docker-compose -f docker-compose.server.yml logs traefik --tail=10
echo ""
echo "=== N8N Logs ==="
docker-compose -f docker-compose.server.yml logs n8n --tail=10
echo ""
echo "=== Dashboard Logs ==="
docker-compose -f docker-compose.server.yml logs agriculture-rag-dashboard --tail=10

echo ""
echo "=== Deployment Complete ==="
echo "Services should be accessible at:"
echo "- Traefik Dashboard: https://traefik.${DOMAIN_NAME:-your-domain.com}"
echo "- N8N: https://n8n.${DOMAIN_NAME:-your-domain.com}"
echo "- Agriculture Dashboard: https://dashboard.${DOMAIN_NAME:-your-domain.com}"
echo ""
echo "Local access (if needed):"
echo "- Dashboard: http://localhost:3000"
echo "- N8N: http://localhost:5678"