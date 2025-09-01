# 📚 Digital English Academy - Guía Completa de Despliegue

## 🎯 Guía Maestra para Implementación Enterprise

Esta guía proporciona instrucciones completas para desplegar Digital English Academy en cualquier entorno, desde desarrollo hasta producción enterprise con monitoreo avanzado y auto-escalado.

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos del Sistema](#prerrequisitos)
2. [Configuración del Entorno](#configuracion)
3. [Despliegue Local](#despliegue-local)
4. [Despliegue en AWS Lightsail](#aws-lightsail)
5. [Despliegue Enterprise](#enterprise)
6. [Monitoreo y Observabilidad](#monitoreo)
7. [Auto-escalado](#auto-escalado)
8. [Backups y Recuperación](#backups)
9. [Seguridad](#seguridad)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerrequisitos del Sistema {#prerrequisitos}

### Requisitos Mínimos

#### Para Desarrollo

- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 8GB mínimo, 16GB recomendado
- **CPU**: 4 cores mínimo
- **Almacenamiento**: 50GB libres
- **Node.js**: v18.0.0+
- **Docker**: v20.10.0+
- **Docker Compose**: v2.0.0+

#### Para Producción

- **RAM**: 16GB mínimo, 32GB+ recomendado
- **CPU**: 8 cores mínimo, 16+ recomendado
- **Almacenamiento**: 200GB+ SSD
- **Ancho de Banda**: 1Gbps+
- **OS**: Ubuntu 20.04 LTS (recomendado)

### Software Requerido

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget git unzip htop nginx certbot

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalaciones
docker --version
docker-compose --version
node --version
npm --version
```

---

## ⚙️ Configuración del Entorno {#configuracion}

### Variables de Entorno

#### Desarrollo (.env.development)

```bash
# Aplicación
NODE_ENV=development
PORT=3000
DOMAIN=localhost

# Base de Datos
MONGODB_URL=mongodb://localhost:27017/dea_dev
REDIS_URL=redis://localhost:6379

# Auth0 (Desarrollo)
AUTH0_DOMAIN=dev-dea.auth0.com
AUTH0_CLIENT_ID=dev_client_id
AUTH0_CLIENT_SECRET=dev_client_secret

# Stripe (Test)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Características
ENABLE_DEBUG=true
ENABLE_HOT_RELOAD=true
LOG_LEVEL=debug
```

#### Producción (.env.production)

```bash
# Aplicación
NODE_ENV=production
PORT=3000
DOMAIN=denglishacademy.com

# Base de Datos
MONGODB_URL=mongodb://admin:secure_password@mongodb-primary:27017/digitalenglishacademy?authSource=admin
REDIS_URL=redis://:secure_redis_password@redis-cluster:6379

# Auth0 (Producción)
AUTH0_DOMAIN=denglishacademy.auth0.com
AUTH0_CLIENT_ID=prod_client_id
AUTH0_CLIENT_SECRET=prod_client_secret
AUTH0_AUDIENCE=https://api.denglishacademy.com

# Stripe (Live)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoreo
GRAFANA_PASSWORD=secure_grafana_password
PROMETHEUS_RETENTION=30d

# Backup
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
BACKUP_S3_BUCKET=dea-backups

# Seguridad
JWT_SECRET=your_jwt_secret_32_chars_minimum
SESSION_SECRET=your_session_secret_32_chars
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Características
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
ENABLE_AUTO_SCALING=true
LOG_LEVEL=info
```

---

## 🏠 Despliegue Local {#despliegue-local}

### Desarrollo Rápido

```bash
# 1. Clonar repositorio
git clone https://github.com/your-org/digital-english-academy.git
cd digital-english-academy

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.development.example .env.development
# Editar .env.development con tus valores

# 4. Iniciar servicios de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# 5. Ejecutar aplicación
npm run dev
```

### Desarrollo con Docker Completo

```bash
# 1. Build y ejecutar todo con Docker
docker-compose -f docker-compose.dev.yml up --build

# 2. Acceder a la aplicación
# http://localhost:3000 - Aplicación principal
# http://localhost:3001 - Grafana (admin/admin)
# http://localhost:9090 - Prometheus
# http://localhost:8080 - cAdvisor
```

### Scripts de Desarrollo Disponibles

```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo
npm run build                  # Build para producción
npm run test                   # Ejecutar tests
npm run test:watch            # Tests en modo watch
npm run lint                   # Linting
npm run format                 # Formatear código

# Docker local
npm run docker:dev            # Desarrollo con Docker
npm run docker:build          # Build imagen Docker
npm run docker:logs           # Ver logs
```

---

## ☁️ Despliegue en AWS Lightsail {#aws-lightsail}

### Configuración Automática

```bash
# 1. Configurar AWS CLI
aws configure
# Ingresar Access Key, Secret Key, Region (us-east-1)

# 2. Ejecutar script de despliegue
chmod +x deploy/aws-lightsail/deploy-demo.sh
./deploy/aws-lightsail/deploy-demo.sh

# 3. Esperar confirmación (5-10 minutos)
# El script creará:
# - Instancia Lightsail (2 vCPU, 4GB RAM)
# - IP estática
# - Firewall configurado
# - Certificado SSL (opcional)
```

### Configuración Manual

#### Crear Instancia

```bash
# Crear instancia
aws lightsail create-instances \
    --instance-names "dea-demo" \
    --availability-zone "us-east-1a" \
    --blueprint-id "ubuntu_20_04" \
    --bundle-id "medium_2_0"

# Crear IP estática
aws lightsail allocate-static-ip \
    --static-ip-name "dea-demo-ip"

# Asignar IP estática
aws lightsail attach-static-ip \
    --static-ip-name "dea-demo-ip" \
    --instance-name "dea-demo"
```

#### Configurar Firewall

```bash
aws lightsail put-instance-public-ports \
    --instance-name "dea-demo" \
    --port-infos \
        fromPort=22,toPort=22,protocol=TCP \
        fromPort=80,toPort=80,protocol=TCP \
        fromPort=443,toPort=443,protocol=TCP \
        fromPort=3001,toPort=3001,protocol=TCP \
        fromPort=9090,toPort=9090,protocol=TCP
```

#### Conectar y Configurar

```bash
# Obtener IP pública
PUBLIC_IP=$(aws lightsail get-static-ip \
    --static-ip-name "dea-demo-ip" \
    --query 'staticIp.ipAddress' \
    --output text)

# Conectar por SSH
ssh ubuntu@$PUBLIC_IP

# En el servidor, clonar y configurar
git clone https://github.com/your-org/digital-english-academy.git
cd digital-english-academy

# Configurar entorno
cp .env.production.example .env.production
nano .env.production  # Editar con valores reales

# Desplegar
npm run deploy:docker-prod
```

### URLs de Acceso

- **Aplicación**: http://YOUR_IP
- **Grafana**: http://YOUR_IP:3001 (admin/demo_grafana_2024)
- **Prometheus**: http://YOUR_IP:9090

---

## 🏢 Despliegue Enterprise {#enterprise}

### Arquitectura Multi-Región

#### AWS EKS (Kubernetes)

```bash
# 1. Crear cluster EKS
eksctl create cluster \
    --name dea-production \
    --region us-east-1 \
    --nodes 3 \
    --nodes-min 2 \
    --nodes-max 10 \
    --node-type m5.xlarge

# 2. Configurar kubectl
aws eks update-kubeconfig --region us-east-1 --name dea-production

# 3. Desplegar aplicación
kubectl apply -f deploy/k8s/

# 4. Configurar auto-scaling
kubectl apply -f deploy/k8s/hpa.yaml
```

#### Docker Swarm

```bash
# 1. Inicializar Swarm
docker swarm init

# 2. Agregar nodos workers
# En cada nodo worker:
docker swarm join --token SWMTKN-... MANAGER_IP:2377

# 3. Desplegar stack
docker stack deploy -c deploy/docker-compose.production.yml dea

# 4. Verificar servicios
docker service ls
```

### Configuración de Load Balancer

#### Nginx (Recomendado)

```nginx
# /etc/nginx/sites-available/denglishacademy.com
upstream dea_backend {
    least_conn;
    server app-1:3000 max_fails=3 fail_timeout=30s;
    server app-2:3000 max_fails=3 fail_timeout=30s;
    server app-3:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name denglishacademy.com;
    
    ssl_certificate /etc/ssl/certs/denglishacademy.com.crt;
    ssl_certificate_key /etc/ssl/private/denglishacademy.com.key;
    
    location / {
        proxy_pass http://dea_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }
}
```

#### AWS Application Load Balancer

```bash
# Crear ALB
aws elbv2 create-load-balancer \
    --name dea-alb \
    --subnets subnet-12345 subnet-67890 \
    --security-groups sg-12345

# Crear target group
aws elbv2 create-target-group \
    --name dea-targets \
    --protocol HTTP \
    --port 3000 \
    --vpc-id vpc-12345 \
    --health-check-path /health
```

---

## 📊 Monitoreo y Observabilidad {#monitoreo}

### Stack de Monitoreo

#### Prometheus + Grafana + Loki

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_password
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yaml
      - loki-data:/loki

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
```

### Configuración de Métricas

#### Prometheus (prometheus.yml)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'dea-app'
    static_configs:
      - targets: ['app-1:3000', 'app-2:3000', 'app-3:3000']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Dashboards de Grafana

#### Dashboard Principal

```json
{
  "dashboard": {
    "title": "Digital English Academy - Overview",
    "panels": [
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [{"expr": "dea_active_users"}]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [{"expr": "histogram_quantile(0.95, dea_http_request_duration_seconds_bucket)"}]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [{"expr": "rate(dea_http_requests_total{status=~\"5..\"}[5m])"}]
      }
    ]
  }
}
```

### Alertas

#### Alertmanager (alertmanager.yml)

```yaml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@denglishacademy.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@denglishacademy.com'
    subject: 'DEA Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
```

#### Reglas de Alerta (alerts.yml)

```yaml
groups:
- name: dea.rules
  rules:
  - alert: HighErrorRate
    expr: rate(dea_http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, dea_http_request_duration_seconds_bucket) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }} seconds"
```

---

## ⚡ Auto-escalado {#auto-escalado}

### Kubernetes HPA

#### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dea-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dea-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### Docker Compose Auto-scaling

#### Script de Auto-escalado

```bash
#!/bin/bash
# auto-scale.sh

COMPOSE_FILE="docker-compose.production.yml"
MIN_INSTANCES=2
MAX_INSTANCES=10
CPU_THRESHOLD=70
MEMORY_THRESHOLD=80

while true; do
    # Obtener métricas actuales
    CPU_USAGE=$(docker stats --no-stream --format "table {{.CPUPerc}}" | grep -v CPU | sed 's/%//' | awk '{sum+=$1} END {print sum/NR}')
    MEMORY_USAGE=$(docker stats --no-stream --format "table {{.MemPerc}}" | grep -v MEM | sed 's/%//' | awk '{sum+=$1} END {print sum/NR}')
    CURRENT_INSTANCES=$(docker-compose -f $COMPOSE_FILE ps -q app | wc -l)
    
    echo "CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Instances: ${CURRENT_INSTANCES}"
    
    # Lógica de escalado
    if (( $(echo "$CPU_USAGE > $CPU_THRESHOLD" | bc -l) )) && (( CURRENT_INSTANCES < MAX_INSTANCES )); then
        echo "Scaling up due to high CPU usage"
        docker-compose -f $COMPOSE_FILE up -d --scale app=$((CURRENT_INSTANCES + 1))
    elif (( $(echo "$CPU_USAGE < 30" | bc -l) )) && (( CURRENT_INSTANCES > MIN_INSTANCES )); then
        echo "Scaling down due to low CPU usage"
        docker-compose -f $COMPOSE_FILE up -d --scale app=$((CURRENT_INSTANCES - 1))
    fi
    
    sleep 60
done
```

### Métricas Personalizadas

#### Escalado basado en Usuarios Activos

```javascript
// metrics.js - En la aplicación
const prometheus = require('prom-client');

const activeUsersGauge = new prometheus.Gauge({
    name: 'dea_active_users',
    help: 'Number of active users'
});

const httpRequestDuration = new prometheus.Histogram({
    name: 'dea_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});

// Middleware para métricas
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration
            .labels(req.method, req.route?.path || req.path, res.statusCode)
            .observe(duration);
    });
    
    next();
});

// Endpoint de métricas
app.get('/metrics', (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(prometheus.register.metrics());
});
```

---

## 💾 Backups y Recuperación {#backups}

### Estrategia de Backup

#### Backup Automático

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/dea/backups"
S3_BUCKET="dea-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# MongoDB Backup
docker exec mongodb mongodump --out /tmp/backup
docker cp mongodb:/tmp/backup $BACKUP_DIR/mongodb_$TIMESTAMP

# Redis Backup
docker exec redis redis-cli BGSAVE
docker cp redis:/data/dump.rdb $BACKUP_DIR/redis_$TIMESTAMP.rdb

# Grafana Backup
docker cp grafana:/var/lib/grafana $BACKUP_DIR/grafana_$TIMESTAMP

# Comprimir y subir a S3
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz $BACKUP_DIR/*_$TIMESTAMP*
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.tar.gz s3://$S3_BUCKET/

# Limpiar backups locales antiguos
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

#### Cron Job para Backups

```bash
# Agregar a crontab
crontab -e

# Backup cada 6 horas
0 */6 * * * /opt/dea/scripts/backup.sh

# Backup completo diario a las 2 AM
0 2 * * * /opt/dea/scripts/backup-full.sh
```

### Recuperación de Desastres

#### Procedimiento de Recuperación

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
RESTORE_DIR="/opt/dea/restore"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Descargar backup de S3
aws s3 cp s3://dea-backups/$BACKUP_FILE $RESTORE_DIR/

# Extraer backup
tar -xzf $RESTORE_DIR/$BACKUP_FILE -C $RESTORE_DIR/

# Detener servicios
docker-compose -f docker-compose.production.yml down

# Restaurar MongoDB
docker run --rm -v $RESTORE_DIR/mongodb:/backup -v mongodb-data:/data/db mongo:6 \
    bash -c "mongorestore --drop /backup"

# Restaurar Redis
cp $RESTORE_DIR/redis.rdb /opt/dea/data/redis/dump.rdb

# Restaurar Grafana
cp -r $RESTORE_DIR/grafana/* /opt/dea/data/grafana/

# Reiniciar servicios
docker-compose -f docker-compose.production.yml up -d

echo "Restore completed successfully"
```

### Pruebas de Recuperación

#### Script de Prueba Mensual

```bash
#!/bin/bash
# test-restore.sh

# Crear entorno de prueba
docker-compose -f docker-compose.test.yml up -d

# Restaurar último backup
LATEST_BACKUP=$(aws s3 ls s3://dea-backups/ | sort | tail -n 1 | awk '{print $4}')
./restore.sh $LATEST_BACKUP

# Ejecutar tests de integridad
npm run test:integration

# Limpiar entorno de prueba
docker-compose -f docker-compose.test.yml down -v

echo "Restore test completed"
```

---

## 🔒 Seguridad {#seguridad}

### Configuración SSL/TLS

#### Let's Encrypt con Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d denglishacademy.com -d www.denglishacademy.com

# Auto-renovación
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Configuración Nginx SSL

```nginx
server {
    listen 443 ssl http2;
    server_name denglishacademy.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/denglishacademy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/denglishacademy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP Header
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.auth0.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com;" always;
}
```

### Firewall y Rate Limiting

#### UFW Firewall

```bash
# Configurar UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Rate Limiting con Nginx

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

server {
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
    
    # Login rate limiting
    location /auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend;
    }
}
```

### Monitoreo de Seguridad

#### Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt install fail2ban

# Configurar jail local
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
```

---

## 🔍 Troubleshooting {#troubleshooting}

### Problemas Comunes

#### 1. Aplicación no inicia

```bash
# Verificar logs
docker-compose logs app

# Verificar variables de entorno
docker-compose exec app env

# Verificar conectividad a base de datos
docker-compose exec app nc -zv mongodb 27017
```

#### 2. Alta latencia

```bash
# Verificar métricas de sistema
htop
iotop
nethogs

# Verificar logs de Nginx
tail -f /var/log/nginx/access.log

# Verificar métricas de aplicación
curl http://localhost:3000/metrics
```

#### 3. Problemas de memoria

```bash
# Verificar uso de memoria por contenedor
docker stats

# Verificar logs de OOM
dmesg | grep -i "killed process"

# Ajustar límites de memoria
docker-compose.yml:
  services:
    app:
      deploy:
        resources:
          limits:
            memory: 1G
```

#### 4. Problemas de SSL

```bash
# Verificar certificado
openssl x509 -in /etc/letsencrypt/live/domain/fullchain.pem -text -noout

# Renovar certificado
sudo certbot renew --force-renewal

# Verificar configuración Nginx
sudo nginx -t
```

### Scripts de Diagnóstico

#### Health Check Completo

```bash
#!/bin/bash
# health-check.sh

echo "=== Digital English Academy Health Check ==="

# Verificar servicios Docker
echo "Docker Services:"
docker-compose ps

# Verificar conectividad
echo -e "\nConnectivity Tests:"
curl -f http://localhost/health || echo "App health check failed"
curl -f http://localhost:3001/api/health || echo "Grafana health check failed"

# Verificar métricas
echo -e "\nSystem Metrics:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"

# Verificar logs de errores
echo -e "\nRecent Errors:"
docker-compose logs --tail=10 | grep -i error || echo "No recent errors found"

echo -e "\n=== Health Check Complete ==="
```

### Comandos Útiles

#### Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar servicio específico
docker-compose restart app

# Ejecutar comando en contenedor
docker-compose exec app bash

# Ver estadísticas de recursos
docker stats

# Limpiar recursos no utilizados
docker system prune -a
```

#### Monitoreo

```bash
# Verificar métricas de Prometheus
curl http://localhost:9090/api/v1/query?query=up

# Verificar alertas activas
curl http://localhost:9093/api/v1/alerts

# Exportar dashboard de Grafana
curl -H "Authorization: Bearer $API_KEY" \
     http://localhost:3001/api/dashboards/uid/dashboard-uid
```

#### Base de Datos

```bash
# Conectar a MongoDB
docker-compose exec mongodb mongosh

# Verificar estado de replica set
rs.status()

# Verificar índices
db.users.getIndexes()

# Conectar a Redis
docker-compose exec redis redis-cli

# Verificar memoria de Redis
INFO memory
```

---

## 🚀 Preparación del SaaS como Producto Comercial {#producto-comercial}

Esta sección proporciona una guía completa para transformar la plataforma Digital English Academy de un proyecto técnico a un producto SaaS listo para comercialización.

### 📊 Estrategia de Precios y Planes de Suscripción

#### Estructura de Planes Recomendada

| Plan | Precio Mensual | Precio Anual | Características |
|------|---------------|--------------|----------------|
| Básico | $9.99 | $99.90 | Acceso a cursos básicos, 1 profesor virtual, práctica limitada |
| Premium | $19.99 | $199.90 | Todos los cursos, profesores ilimitados, práctica ilimitada |
| Enterprise | Personalizado | Personalizado | SSO, panel admin, API, soporte dedicado |

#### Implementación en Stripe

```bash
# Crear productos y planes en Stripe
stripe products create --name "DEA Basic" --description "Plan básico de Digital English Academy"
stripe prices create --product=prod_XXX --unit-amount=999 --currency=usd --recurring=interval=month

stripe products create --name "DEA Premium" --description "Plan premium de Digital English Academy"
stripe prices create --product=prod_YYY --unit-amount=1999 --currency=usd --recurring=interval=month

# Configurar webhooks
stripe listen --forward-to https://denglishacademy.com/api/webhooks/stripe
```

### 🧩 Onboarding y Experiencia del Cliente

#### Flujo de Onboarding Recomendado

1. **Registro**: Formulario simplificado (email + contraseña)
2. **Evaluación**: Test de nivel (15 minutos)
3. **Personalización**: Selección de objetivos y áreas de interés
4. **Tour Guiado**: Introducción a las características principales
5. **Primera Lección**: Experiencia de éxito rápido (5-10 minutos)

#### Implementación Técnica

```javascript
// Ejemplo de configuración de onboarding en frontend
const onboardingSteps = [
  {
    id: 'registration',
    component: RegistrationForm,
    validationRules: {...}
  },
  {
    id: 'assessment',
    component: LevelAssessment,
    dataEndpoint: '/api/assessment'
  },
  // Más pasos...
];

// Tracking de conversión
function trackOnboardingProgress(step, completed) {
  analytics.track('onboarding_progress', {
    step_id: step.id,
    completed: completed,
    time_spent: calculateTimeSpent(step)
  });
}
```

### 📜 Cumplimiento Legal y Protección de Datos

#### Documentos Legales Requeridos

- **Términos de Servicio**: [docs.denglishacademy.com/legal/terms](https://docs.denglishacademy.com/legal/terms)
- **Política de Privacidad**: [docs.denglishacademy.com/legal/privacy](https://docs.denglishacademy.com/legal/privacy)
- **Política de Cookies**: [docs.denglishacademy.com/legal/cookies](https://docs.denglishacademy.com/legal/cookies)
- **Acuerdo de Nivel de Servicio (SLA)**: [docs.denglishacademy.com/legal/sla](https://docs.denglishacademy.com/legal/sla)

#### Configuración de Cumplimiento GDPR

```bash
# Implementar endpoints para derechos GDPR
POST /api/user/data-export      # Exportación de datos
POST /api/user/data-deletion    # Solicitud de eliminación
GET  /api/user/data-processing  # Información de procesamiento

# Configurar retención de datos
mongodb-retention-policy --collection=user_sessions --days=30
mongodb-retention-policy --collection=user_activities --days=90
```

### 📣 Marketing y Adquisición de Clientes

#### Canales de Adquisición Recomendados

- **SEO**: Optimización para keywords de aprendizaje de inglés
- **SEM**: Campañas en Google Ads y Bing Ads
- **Social Media**: Contenido educativo en Instagram, TikTok y LinkedIn
- **Email Marketing**: Secuencias de nurturing para leads
- **Afiliados**: Programa para profesores y escuelas de idiomas

#### Configuración de Analytics

```bash
# Instalar y configurar Google Analytics 4
npm install @analytics/google-analytics
npm install analytics

# Configurar eventos de conversión
analytics.track('trial_started', { plan: 'premium', source: 'landing_page' });
analytics.track('subscription_purchased', { plan: 'premium', value: 19.99 });
```

### 🛠️ Soporte Técnico y Atención al Cliente

#### Herramientas Recomendadas

- **Help Desk**: Zendesk o Intercom
- **Base de Conocimientos**: Documentación self-service
- **Chat en Vivo**: Soporte en tiempo real para clientes Premium
- **Comunidad**: Foro de usuarios para ayuda entre pares

#### Implementación de Zendesk

```bash
# Instalar Zendesk Widget
npm install @zendesk/widget

# Configuración en frontend
ZendeskWidget.init({
  key: 'your_zendesk_key',
  settings: {
    webWidget: {
      chat: { title: 'Soporte DEA', contactForm: { ticketForms: [{ id: 123 }] } }
    }
  }
});
```

### 📈 Métricas Clave de Negocio

#### KPIs a Monitorear

- **MRR (Monthly Recurring Revenue)**: Ingreso mensual recurrente
- **CAC (Customer Acquisition Cost)**: Costo de adquisición de clientes
- **LTV (Lifetime Value)**: Valor del ciclo de vida del cliente
- **Churn Rate**: Tasa de cancelación de suscripciones
- **NPS (Net Promoter Score)**: Satisfacción y recomendación

#### Dashboard de Negocio

```bash
# Configurar Grafana para métricas de negocio
curl -X POST http://admin:password@localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @business-metrics-dashboard.json

# Configurar alertas de negocio
curl -X POST http://admin:password@localhost:3001/api/alerts \
  -H "Content-Type: application/json" \
  -d @business-alerts.json
```

---

## 📞 Soporte y Recursos

### Documentación Adicional

- **API Documentation**: [docs.denglishacademy.com/api](https://docs.denglishacademy.com/api)
- **Admin Guide**: [docs.denglishacademy.com/admin](https://docs.denglishacademy.com/admin)
- **Troubleshooting**: [docs.denglishacademy.com/troubleshooting](https://docs.denglishacademy.com/troubleshooting)

### Contacto de Soporte

- **Email**: <support@denglishacademy.com>
- **Slack**: #dea-support
- **Emergency**: +1 (555) 123-4567

### Recursos de la Comunidad

- **GitHub**: [github.com/dea/digital-english-academy](https://github.com/dea/digital-english-academy)
- **Discord**: [discord.gg/dea-community](https://discord.gg/dea-community)
- **Stack Overflow**: Tag `digital-english-academy`

---

*Esta guía se actualiza regularmente. Para la versión más reciente, visita: [docs.denglishacademy.com/deployment](https://docs.denglishacademy.com/deployment)*

**Versión**: 2024.1  
**Última Actualización**: Enero 2024  
**Mantenido por**: DevOps Team - Digital English Academy
