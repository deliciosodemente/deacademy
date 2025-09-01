#/bin/bash
set -e

echo "Setting up Digital English Academy on Bitnami..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install additional packages
sudo apt install -y nginx certbot python3-certbot-nginx

# Check if Node.js is installed, if not install it
if  command -v node &>/dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /opt/bitnami/apps/denglishacademy
sudo chown bitnami:bitnami /opt/bitnami/apps/denglishacademy

# Stop default Apache if running
sudo /opt/bitnami/ctlscript.sh stop apache 2>/dev/null || true
sudo systemctl disable bitnami 2>/dev/null || true

echo "Bitnami setup completed"
