#!/bin/bash

# Server Setup Script for Agriculture RAG Dashboard
# This script should be run once on the server to prepare it for deployment

set -e

echo "🚀 Starting server setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    htop

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Add user to docker group
    sudo usermod -aG docker $USER
    print_status "Added $USER to docker group. You may need to logout and login again."
else
    print_status "Docker is already installed."
fi

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Create Docker networks and volumes
print_status "Creating Docker networks and volumes..."
docker network create traefik-network 2>/dev/null || print_warning "traefik-network already exists."

docker volume create traefik_data 2>/dev/null || print_warning "traefik_data volume already exists."
docker volume create n8n_data 2>/dev/null || print_warning "n8n_data volume already exists."
docker volume create n8n_files 2>/dev/null || print_warning "n8n_files volume already exists."
docker volume create dashboard_uploads 2>/dev/null || print_warning "dashboard_uploads volume already exists."

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Setup deployment directory
print_status "Creating deployment directory..."
mkdir -p ~/agriculture-rag-dashboard
mkdir -p ~/logs

# Setup log rotation for Docker containers
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers << 'EOF'
~/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        docker restart $(docker ps -q) || true
    endscript
}
EOF

# Install helpful utilities
print_status "Installing helpful utilities..."
sudo apt install -y docker-compose

# Create backup script
print_status "Creating backup script..."
cat > ~/backup-docker-data.sh << 'EOF'
#!/bin/bash
# Backup script for Docker volumes

BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Creating backup of Docker volumes..."

# Backup volumes
docker run --rm -v n8n_data:/data -v "$BACKUP_DIR":/backup alpine tar czf "/backup/n8n_data_$DATE.tar.gz" -C /data .
docker run --rm -v traefik_data:/data -v "$BACKUP_DIR":/backup alpine tar czf "/backup/traefik_data_$DATE.tar.gz" -C /data .
docker run --rm -v dashboard_uploads:/data -v "$BACKUP_DIR":/backup alpine tar czf "/backup/dashboard_uploads_$DATE.tar.gz" -C /data .

echo "Backup completed: $BACKUP_DIR"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x ~/backup-docker-data.sh

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup-docker-data.sh") | crontab -

# Create monitoring script
print_status "Creating monitoring script..."
cat > ~/check-services.sh << 'EOF'
#!/bin/bash
# Simple monitoring script

echo "=== Docker Services Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== Disk Usage ==="
df -h

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== Docker System Usage ==="
docker system df
EOF

chmod +x ~/check-services.sh

# Create update script
print_status "Creating update script..."
cat > ~/update-system.sh << 'EOF'
#!/bin/bash
# System update script

echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "Updating Docker containers..."
cd ~/agriculture-rag-dashboard
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

echo "Cleaning up Docker..."
docker system prune -f

echo "Update completed!"
EOF

chmod +x ~/update-system.sh

print_status "Server setup completed successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Setup SSH keys for GitHub Actions:"
print_status "   - Run: ssh-keygen -t ed25519 -C 'github-actions-deploy'"
print_status "   - Copy public key to GitHub repository as Deploy Key"
print_status "   - Copy private key to GitHub repository as Secret (SSH_PRIVATE_KEY)"
print_status ""
print_status "2. Configure GitHub Secrets in your repository:"
print_status "   - SERVER_HOST: $(curl -s ifconfig.me)"
print_status "   - SERVER_USER: $USER"
print_status "   - SSH_PRIVATE_KEY: (from the key generated above)"
print_status "   - And all environment variables from .env.production"
print_status ""
print_status "3. Don't forget to logout and login again for Docker group to take effect."
print_status ""
print_status "Useful scripts created:"
print_status "- ~/check-services.sh - Check services status"
print_status "- ~/backup-docker-data.sh - Backup Docker data (runs daily at 2 AM)"
print_status "- ~/update-system.sh - Update system and containers"

echo -e "\n${GREEN}✅ Setup completed successfully!${NC}"