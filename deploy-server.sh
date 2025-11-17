#!/bin/bash

echo "🚀 Starting deployment on server..."

# Check if .env.production.docker exists
if [ ! -f .env.production.docker ]; then
    echo "❌ Error: .env.production.docker file not found!"
    echo "Please create this file with your production environment variables."
    exit 1
fi

# Copy the production environment file to .env for docker-compose
echo "📝 Setting up environment variables..."
cp .env.production.docker .env

# Create Docker networks if they don't exist
echo "🔗 Creating Docker networks..."
docker network create traefik-network 2>/dev/null || true

# Create Docker volumes if they don't exist
echo "💾 Creating Docker volumes..."
docker volume create traefik_data 2>/dev/null || true
docker volume create n8n_data 2>/dev/null || true

# Pull latest changes (if git repository)
if [ -d .git ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Check if containers are running
echo "✅ Checking container status..."
sleep 10
docker-compose ps

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Access your applications:"
echo "   Dashboard: http://dashboard.$(grep DOMAIN_NAME .env | cut -d'=' -f2)"
echo "   n8n:       http://n8n.$(grep DOMAIN_NAME .env | cut -d'=' -f2)"
echo ""
echo "🔍 Check logs with: docker-compose logs -f"