# 🚀 Despliegue en AWS Lightsail - denglishacademy.com

## Guía Completa de Despliegue

### Paso 1: Preparar el Proyecto para Producción

#### 1.1 Configurar Variables de Entorno

```bash
# Crear archivo .env.production
cp .env.example .env.production
```

Editar `.env.production`:

```env
NODE_ENV=production
AUTH0_DOMAIN=denglishacademy.auth0.com
AUTH0_CLIENT_ID=tu-client-id-produccion
STRIPE_PUBLISHABLE_KEY=pk_live_tu-clave-stripe
STRIPE_PAYMENT_LINK=https://buy.stripe.com/tu-link-produccion
MONGODB_CONNECTION_STRING=mongodb+srv://user:pass@cluster.mongodb.net/denglishacademy_prod
```

#### 1.2 Build de Producción

```bash
npm run build:production
```

### Paso 2: Crear Instancia en AWS Lightsail

#### 2.1 Acceder a AWS Lightsail

1. Ve a [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Haz clic en "Create instance"

#### 2.2 Configurar la Instancia

- **Platform**: Linux/Unix
- **Blueprint**: Node.js
- **Instance plan**: $10 USD/month (2 GB RAM, 1 vCPU, 60 GB SSD)
- **Instance name**: `denglishacademy-prod`

#### 2.3 Configurar Networking

1. En la instancia creada, ve a "Networking"
2. Crear reglas de firewall:
   - HTTP (port 80) - Anywhere
   - HTTPS (port 443) - Anywhere
   - SSH (port 22) - Your IP only

### Paso 3: Configurar el Servidor

#### 3.1 Conectar por SSH

```bash
# Desde Lightsail Console, usar "Connect using SSH"
# O descargar la clave SSH y usar:
ssh -i LightsailDefaultKey-us-east-1.pem ubuntu@tu-ip-publica
```

#### 3.2 Actualizar el Sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx certbot python3-certbot-nginx -y
```

#### 3.3 Configurar Node.js y PM2

```bash
# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalación
node --version
npm --version
pm2 --version
```

### Paso 4: Subir y Configurar la Aplicación

#### 4.1 Crear Directorio de la Aplicación

```bash
sudo mkdir -p /var/www/denglishacademy
sudo chown ubuntu:ubuntu /var/www/denglishacademy
cd /var/www/denglishacademy
```

#### 4.2 Subir Archivos (Opción 1: SCP)

```bash
# Desde tu máquina local
scp -i LightsailDefaultKey-us-east-1.pem -r dist/* ubuntu@tu-ip-publica:/var/www/denglishacademy/
```

#### 4.2 Subir Archivos (Opción 2: Git)

```bash
# En el servidor
git clone https://github.com/tu-usuario/digital-english-academy.git .
npm install --production
npm run build:production
```

### Paso 5: Configurar Nginx

#### 5.1 Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/denglishacademy.com
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name denglishacademy.com www.denglishacademy.com;
    
    root /var/www/denglishacademy/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy (si tienes backend)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5.2 Habilitar el Sitio

```bash
sudo ln -s /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 6: Configurar SSL con Let's Encrypt

#### 6.1 Obtener Certificado SSL

```bash
sudo certbot --nginx -d denglishacademy.com -d www.denglishacademy.com
```

#### 6.2 Configurar Renovación Automática

```bash
sudo crontab -e
# Agregar esta línea:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Paso 7: Configurar el Dominio

#### 7.1 En tu Proveedor de Dominio

Configurar los siguientes registros DNS:

```
Tipo    Nombre                  Valor
A       denglishacademy.com     TU-IP-LIGHTSAIL
A       www.denglishacademy.com TU-IP-LIGHTSAIL
```

#### 7.2 Verificar Propagación DNS

```bash
# Verificar desde tu máquina local
nslookup denglishacademy.com
dig denglishacademy.com
```

### Paso 8: Configurar Backend (Opcional)

#### 8.1 Crear Servidor Express Simple

```bash
cd /var/www/denglishacademy
nano server.js
```

Contenido de `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.post('/api/ai/chat', (req, res) => {
  // Fallback response
  res.json({ 
    content: 'Servicio de IA temporalmente no disponible. Funcionalidad básica activa.' 
  });
});

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 8.2 Instalar Dependencias y Ejecutar

```bash
npm init -y
npm install express cors
pm2 start server.js --name "denglishacademy-api"
pm2 startup
pm2 save
```

### Paso 9: Configurar Monitoreo

#### 9.1 Configurar PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

#### 9.2 Configurar Logs de Nginx

```bash
sudo nano /etc/logrotate.d/nginx
```

### Paso 10: Configurar Backup Automático

#### 10.1 Script de Backup

```bash
nano /home/ubuntu/backup.sh
```

Contenido:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/var/www/denglishacademy"

mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: app_$DATE.tar.gz"
```

```bash
chmod +x /home/ubuntu/backup.sh
crontab -e
# Agregar: 0 2 * * * /home/ubuntu/backup.sh
```

### Paso 11: Verificación Final

#### 11.1 Checklist de Verificación

- [ ] Sitio accesible en <https://denglishacademy.com>
- [ ] Certificado SSL válido
- [ ] Redirección HTTP a HTTPS
- [ ] Todas las páginas cargan correctamente
- [ ] Formularios funcionan
- [ ] Responsive design en móvil
- [ ] Velocidad de carga < 3 segundos

#### 11.2 Comandos de Verificación

```bash
# Verificar estado de servicios
sudo systemctl status nginx
pm2 status

# Verificar logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
pm2 logs

# Verificar SSL
curl -I https://denglishacademy.com
```

### Paso 12: Configuración de Producción Final

#### 12.1 Actualizar Configuración de Auth0

En Auth0 Dashboard:

- Allowed Callback URLs: `https://denglishacademy.com`
- Allowed Logout URLs: `https://denglishacademy.com`
- Allowed Web Origins: `https://denglishacademy.com`

#### 12.2 Actualizar Configuración de Stripe

En Stripe Dashboard:

- Webhook endpoints: `https://denglishacademy.com/api/webhooks/stripe`
- Success URL: `https://denglishacademy.com/#/payment-success`
- Cancel URL: `https://denglishacademy.com/#/payment-cancel`

### Costos Estimados AWS Lightsail

- **Instancia $10/mes**: 2GB RAM, 1 vCPU, 60GB SSD, 3TB transferencia
- **IP estática**: Incluida
- **Certificado SSL**: Gratis (Let's Encrypt)
- **Backup automático**: $1/mes (opcional)

**Total: ~$11 USD/mes**

### Comandos de Mantenimiento

```bash
# Actualizar aplicación
cd /var/www/denglishacademy
git pull origin main
npm run build:production
sudo systemctl reload nginx

# Reiniciar servicios
sudo systemctl restart nginx
pm2 restart all

# Verificar espacio en disco
df -h

# Verificar memoria
free -h

# Verificar procesos
htop
```

### Soporte y Troubleshooting

#### Problemas Comunes

1. **Error 502 Bad Gateway**

   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

2. **Certificado SSL no válido**

   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload nginx
   ```

3. **Sitio lento**

   ```bash
   # Verificar recursos
   htop
   # Optimizar Nginx
   sudo nano /etc/nginx/nginx.conf
   ```

### Contacto de Soporte

- 📧 Email: <soporte@denglishacademy.com>
- 🔧 Documentación: <https://denglishacademy.com/docs/>
- 💬 Chat: Disponible en la plataforma

¡Tu plataforma estará lista para recibir estudiantes! 🎉
