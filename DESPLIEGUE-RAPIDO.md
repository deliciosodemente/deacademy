# 🚀 Despliegue Rápido en AWS Lightsail - denglishacademy.com

## Comandos Rápidos (5 minutos)

### 1. Preparar el Proyecto

```bash
# Clonar o navegar al proyecto
cd digital-english-academy

# Instalar dependencias
npm install

# Build de producción
npm run build:production
```

### 2. Crear Instancia Lightsail

1. Ve a [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click "Create instance"
3. Selecciona:
   - **Platform**: Linux/Unix
   - **Blueprint**: Node.js
   - **Plan**: $10/month (2GB RAM)
   - **Name**: denglishacademy-prod
4. Click "Create instance"
5. **Anota la IP pública** (ej: 3.85.123.45)

### 3. Configurar DNS

En tu proveedor de dominio, configura:

```
Tipo A: denglishacademy.com → TU-IP-LIGHTSAIL
Tipo A: www.denglishacademy.com → TU-IP-LIGHTSAIL
```

### 4. Despliegue Automático

```bash
# Hacer ejecutable el script (en Linux/Mac)
chmod +x deploy/scripts/deploy-lightsail.sh

# Ejecutar despliegue (reemplaza con tu IP)
./deploy/scripts/deploy-lightsail.sh 3.85.123.45 denglishacademy.com
```

### 5. Despliegue Manual (Alternativa)

#### 5.1 Conectar al Servidor

```bash
# Desde Lightsail Console, click "Connect using SSH"
# O descarga la clave SSH y usa:
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@TU-IP
```

#### 5.2 Configurar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx y Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Crear directorio de la app
sudo mkdir -p /var/www/denglishacademy
sudo chown ubuntu:ubuntu /var/www/denglishacademy
```

#### 5.3 Subir Archivos

```bash
# Desde tu máquina local
scp -i ~/.ssh/LightsailDefaultKey-us-east-1.pem -r dist/* ubuntu@TU-IP:/var/www/denglishacademy/
scp -i ~/.ssh/LightsailDefaultKey-us-east-1.pem deploy/server.js ubuntu@TU-IP:/var/www/denglishacademy/
scp -i ~/.ssh/LightsailDefaultKey-us-east-1.pem package.json ubuntu@TU-IP:/var/www/denglishacademy/
```

#### 5.4 Configurar Nginx

```bash
# En el servidor
sudo nano /etc/nginx/sites-available/denglishacademy.com
```

Pegar esta configuración:

```nginx
server {
    listen 80;
    server_name denglishacademy.com www.denglishacademy.com;
    
    root /var/www/denglishacademy;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### 5.5 Configurar SSL

```bash
# Obtener certificado SSL (esperar propagación DNS)
sudo certbot --nginx -d denglishacademy.com -d www.denglishacademy.com

# Configurar renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 5.6 Configurar Backend

```bash
cd /var/www/denglishacademy

# Instalar dependencias
npm init -y
npm install express cors

# Iniciar con PM2
pm2 start server.js --name "denglishacademy-api"
pm2 startup
pm2 save
```

## Verificación Final

### Checklist ✅

- [ ] Sitio accesible en <https://denglishacademy.com>
- [ ] Certificado SSL válido (candado verde)
- [ ] Todas las páginas cargan
- [ ] Navegación funciona
- [ ] Responsive en móvil
- [ ] API responde en /api/health

### Comandos de Verificación

```bash
# Verificar servicios
sudo systemctl status nginx
pm2 status

# Verificar logs
sudo tail -f /var/log/nginx/error.log
pm2 logs

# Test SSL
curl -I https://denglishacademy.com

# Test API
curl https://denglishacademy.com/api/health
```

## Configuración Post-Despliegue

### Auth0 (Requerido para login)

1. Ve a [Auth0 Dashboard](https://manage.auth0.com/)
2. En tu aplicación, configura:
   - **Allowed Callback URLs**: `https://denglishacademy.com`
   - **Allowed Logout URLs**: `https://denglishacademy.com`
   - **Allowed Web Origins**: `https://denglishacademy.com`

### Stripe (Requerido para pagos)

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Configura webhooks:
   - **Endpoint URL**: `https://denglishacademy.com/api/webhooks/stripe`
   - **Events**: `checkout.session.completed`, `invoice.payment_succeeded`

### Variables de Entorno

Crear `.env` en el servidor:

```bash
nano /var/www/denglishacademy/.env
```

```env
NODE_ENV=production
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=tu-client-id
STRIPE_PUBLISHABLE_KEY=pk_live_tu-clave
MONGODB_CONNECTION_STRING=mongodb+srv://...
```

## Mantenimiento

### Actualizar la Aplicación

```bash
# En tu máquina local
npm run build:production
scp -i ~/.ssh/LightsailDefaultKey-us-east-1.pem -r dist/* ubuntu@TU-IP:/var/www/denglishacademy/

# En el servidor
pm2 restart denglishacademy-api
sudo systemctl reload nginx
```

### Backup Manual

```bash
# En el servidor
cd /home/ubuntu
tar -czf backup_$(date +%Y%m%d).tar.gz -C /var/www/denglishacademy .
```

### Monitoreo

```bash
# Verificar recursos
htop
df -h
free -h

# Logs en tiempo real
pm2 logs --lines 50
sudo tail -f /var/log/nginx/access.log
```

## Costos AWS Lightsail

- **Instancia $10/mes**: 2GB RAM, 1 vCPU, 60GB SSD
- **Transferencia**: 3TB incluidos
- **IP estática**: Incluida
- **SSL**: Gratis (Let's Encrypt)

**Total: $10 USD/mes** 💰

## Soporte

- 📧 **Email**: <soporte@denglishacademy.com>
- 💬 **Chat**: Disponible en la plataforma
- 📚 **Docs**: <https://denglishacademy.com/docs/>

## Troubleshooting Rápido

### Error 502 Bad Gateway

```bash
pm2 restart all
sudo systemctl restart nginx
```

### Certificado SSL no válido

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Sitio no carga

```bash
# Verificar DNS
nslookup denglishacademy.com

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

¡Tu Digital English Academy estará online en minutos! 🎉

---

**Tiempo estimado de despliegue**: 15-30 minutos
**Dificultad**: Principiante
**Costo mensual**: $10 USD
