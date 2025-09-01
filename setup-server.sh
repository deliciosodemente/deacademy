#/bin/bash
set -e
echo "Configurando Digital English Academy..."

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y nginx certbot python3-certbot-nginx curl

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Crear directorios
sudo mkdir -p /var/www/denglishacademy
sudo chown -R bitnami:bitnami /var/www/denglishacademy

# Parar Apache si está corriendo
sudo /opt/bitnami/ctlscript.sh stop apache 2>/dev/null || true
sudo systemctl disable bitnami 2>/dev/null || true

echo "✅ Servidor configurado"
