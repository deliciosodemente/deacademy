#/bin/bash
set -e

# Performance optimizations
echo "net.core.rmem_max = 16777216" | sudo tee -a /etc/sysctl.conf
echo "net.core.wmem_max = 16777216" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Update system with optimizations
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx curl htop iotop

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 with optimizations
sudo npm install -g pm2@latest

# Create optimized app directory structure
sudo mkdir -p /var/www/denglishacademy/{app,logs,backups}
sudo chown -R ubuntu:ubuntu /var/www/denglishacademy

# Setup log rotation
sudo tee /etc/logrotate.d/denglishacademy <<EOF
/var/www/denglishacademy/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reload denglishacademy-api
    endscript
}
EOF

echo "Optimized server setup completed"
