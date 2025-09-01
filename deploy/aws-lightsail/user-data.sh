#!/bin/bash
# User Data Script para AWS Lightsail
# Configuración automática del servidor para Digital English Academy Demo

set -euo pipefail

# Logging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "🚀 Iniciando configuración automática de Digital English Academy Demo"
echo "Timestamp: $(date)"

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt-get update -y
apt-get upgrade -y

# Instalar dependencias básicas
echo "🔧 Instalando dependencias..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx \
    jq \
    bc

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Instalar Docker Compose
echo "🔧 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Node.js (para build)
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Crear directorios del proyecto
echo "📁 Creando estructura de directorios..."
mkdir -p /opt/dea/{app,data,logs,backups}
mkdir -p /opt/dea/data/{mongodb,redis,prometheus,grafana,loki}
mkdir -p /opt/dea/logs/{nginx,app,monitoring}

# Configurar permisos
chown -R ubuntu:ubuntu /opt/dea
chmod -R 755 /opt/dea

# Clonar repositorio (simulado - en producción sería desde Git)
echo "📥 Preparando aplicación..."
cd /opt/dea/app

# Crear configuración demo
cat > /opt/dea/app/.env.demo << 'EOF'
# Demo Environment Configuration
NODE_ENV=production
DOMAIN=demo.denglishacademy.com
PORT=3000

# Demo Auth0 (usar valores de prueba)
AUTH0_DOMAIN=demo-dea.auth0.com
AUTH0_CLIENT_ID=demo_client_id
AUTH0_CLIENT_SECRET=demo_client_secret

# Demo Stripe (usar test keys)
STRIPE_PUBLISHABLE_KEY=pk_test_demo
STRIPE_SECRET_KEY=your_stripe_secret_key

# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=demo_password_2024
MONGODB_URL=mongodb://admin:demo_password_2024@mongodb:27017/digitalenglishacademy?authSource=admin

# Redis
REDIS_PASSWORD=demo_redis_2024
REDIS_URL=redis://:demo_redis_2024@redis:6379

# Monitoring
GRAFANA_PASSWORD=demo_grafana_2024

# Demo flags
DEMO_MODE=true
ENABLE_DEMO_DATA=true
EOF

# Crear Docker Compose para demo
cat > /opt/dea/app/docker-compose.demo.yml << 'EOF'
version: '3.8'

services:
  # Aplicación principal
  app:
    image: nginx:alpine
    container_name: dea-app-demo
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./demo-app:/usr/share/nginx/html:ro
      - ./nginx-demo.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - dea-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MongoDB para demo
  mongodb:
    image: mongo:6
    container_name: dea-mongodb-demo
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=demo_password_2024
      - MONGO_INITDB_DATABASE=digitalenglishacademy
    volumes:
      - /opt/dea/data/mongodb:/data/db
    networks:
      - dea-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis para demo
  redis:
    image: redis:7-alpine
    container_name: dea-redis-demo
    restart: unless-stopped
    command: redis-server --requirepass demo_redis_2024 --appendonly yes
    volumes:
      - /opt/dea/data/redis:/data
    networks:
      - dea-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "demo_redis_2024", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Prometheus para monitoreo
  prometheus:
    image: prom/prometheus:latest
    container_name: dea-prometheus-demo
    restart: unless-stopped
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=7d'
      - '--web.enable-lifecycle'
    volumes:
      - ./prometheus-demo.yml:/etc/prometheus/prometheus.yml:ro
      - /opt/dea/data/prometheus:/prometheus
    networks:
      - dea-network

  # Grafana para dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: dea-grafana-demo
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=demo_grafana_2024
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SECURITY_ALLOW_EMBEDDING=true
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    volumes:
      - /opt/dea/data/grafana:/var/lib/grafana
      - ./grafana-demo:/etc/grafana/provisioning:ro
    networks:
      - dea-network
    depends_on:
      - prometheus

  # Node Exporter para métricas del sistema
  node-exporter:
    image: prom/node-exporter:latest
    container_name: dea-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - dea-network

  # cAdvisor para métricas de contenedores
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: dea-cadvisor
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - dea-network

networks:
  dea-network:
    driver: bridge

volumes:
  mongodb-data:
  redis-data:
  prometheus-data:
  grafana-data:
EOF

# Crear aplicación demo HTML
mkdir -p /opt/dea/app/demo-app
cat > /opt/dea/app/demo-app/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital English Academy - Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .demo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .demo-card { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border-radius: 15px; 
            padding: 30px; 
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .demo-card h3 { margin-bottom: 15px; font-size: 1.5rem; }
        .demo-card p { margin-bottom: 20px; opacity: 0.9; }
        .btn { 
            display: inline-block;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
        }
        .btn:hover { 
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .status-item { 
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .status-online { border-left: 4px solid #4CAF50; }
        .status-metrics { border-left: 4px solid #2196F3; }
        .status-scaling { border-left: 4px solid #FF9800; }
        .footer { text-align: center; margin-top: 40px; opacity: 0.8; }
        .live-metrics { 
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; color: #4CAF50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Digital English Academy</h1>
            <p>Demo Funcional con Monitoreo y Autoescalado</p>
        </div>

        <div class="demo-grid">
            <div class="demo-card">
                <h3>🌐 Aplicación Principal</h3>
                <p>Plataforma completa de aprendizaje de inglés con autenticación, pagos y comunidad.</p>
                <a href="/app" class="btn">Ver Aplicación</a>
            </div>

            <div class="demo-card">
                <h3>📊 Dashboard Grafana</h3>
                <p>Monitoreo en tiempo real con métricas de sistema, aplicación y usuarios.</p>
                <a href="http://INSTANCE_IP:3001" class="btn" target="_blank">Ver Dashboard</a>
            </div>

            <div class="demo-card">
                <h3>🔍 Métricas Prometheus</h3>
                <p>Recolección de métricas detalladas para análisis y alertas.</p>
                <a href="http://INSTANCE_IP:9090" class="btn" target="_blank">Ver Métricas</a>
            </div>

            <div class="demo-card">
                <h3>📈 Autoescalado</h3>
                <p>Escalado automático basado en CPU, memoria y carga de usuarios.</p>
                <a href="/scaling" class="btn">Ver Estado</a>
            </div>
        </div>

        <div class="live-metrics">
            <h3>📊 Métricas en Vivo</h3>
            <div class="metric">
                <span>Estado del Sistema:</span>
                <span class="metric-value" id="system-status">🟢 Online</span>
            </div>
            <div class="metric">
                <span>Instancias Activas:</span>
                <span class="metric-value" id="active-instances">2</span>
            </div>
            <div class="metric">
                <span>CPU Promedio:</span>
                <span class="metric-value" id="cpu-usage">45%</span>
            </div>
            <div class="metric">
                <span>Memoria Usada:</span>
                <span class="metric-value" id="memory-usage">62%</span>
            </div>
            <div class="metric">
                <span>Requests/seg:</span>
                <span class="metric-value" id="rps">127</span>
            </div>
        </div>

        <div class="status-grid">
            <div class="status-item status-online">
                <h4>🟢 Sistema Online</h4>
                <p>Todos los servicios funcionando</p>
            </div>
            <div class="status-item status-metrics">
                <h4>📊 Monitoreo Activo</h4>
                <p>Recolectando métricas</p>
            </div>
            <div class="status-item status-scaling">
                <h4>⚡ Autoescalado</h4>
                <p>Escalado inteligente activo</p>
            </div>
        </div>

        <div class="footer">
            <p>🎓 Digital English Academy - Demo en AWS Lightsail</p>
            <p>Arquitectura escalable con Docker, Prometheus y Grafana</p>
        </div>
    </div>

    <script>
        // Simular métricas en vivo
        function updateMetrics() {
            document.getElementById('cpu-usage').textContent = (Math.random() * 40 + 30).toFixed(0) + '%';
            document.getElementById('memory-usage').textContent = (Math.random() * 30 + 50).toFixed(0) + '%';
            document.getElementById('rps').textContent = Math.floor(Math.random() * 200 + 50);
            
            // Simular cambio de instancias
            const instances = Math.random() > 0.7 ? 3 : 2;
            document.getElementById('active-instances').textContent = instances;
        }

        // Actualizar cada 5 segundos
        setInterval(updateMetrics, 5000);
        updateMetrics();
    </script>
</body>
</html>
EOF

# Crear página de health check
cat > /opt/dea/app/demo-app/health << 'EOF'
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "app": "online",
    "database": "online",
    "cache": "online",
    "monitoring": "online"
  },
  "metrics": {
    "uptime": "99.9%",
    "response_time": "150ms",
    "active_users": 1247
  }
}
EOF

# Crear configuración Nginx
cat > /opt/dea/app/nginx-demo.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Health check
    location /health {
        add_header Content-Type application/json;
        return 200 '{"status":"healthy","timestamp":"2024-01-01T00:00:00Z"}';
    }

    # Main app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para Grafana
    location /grafana/ {
        proxy_pass http://grafana:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy para Prometheus
    location /prometheus/ {
        proxy_pass http://prometheus:9090/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Crear configuración Prometheus
cat > /opt/dea/app/prometheus-demo.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'app-demo'
    static_configs:
      - targets: ['app:80']
    metrics_path: /health
    scrape_interval: 30s
EOF

# Crear configuración Grafana
mkdir -p /opt/dea/app/grafana-demo/{dashboards,datasources}

cat > /opt/dea/app/grafana-demo/datasources/prometheus.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Iniciar servicios
echo "🚀 Iniciando servicios..."
cd /opt/dea/app
docker-compose -f docker-compose.demo.yml up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 60

# Configurar autoescalado simulado
cat > /opt/dea/app/autoscale-demo.sh << 'EOF'
#!/bin/bash
# Simulador de autoescalado para demo

while true; do
    # Simular carga variable
    load=$(shuf -i 20-150 -n 1)
    
    if [ $load -gt 100 ]; then
        echo "$(date): Alta carga detectada ($load RPS) - Escalando..."
        # Simular escalado (en demo real sería docker-compose scale)
        echo "Instancia adicional iniciada"
    elif [ $load -lt 40 ]; then
        echo "$(date): Baja carga detectada ($load RPS) - Reduciendo escala..."
        echo "Instancia removida"
    fi
    
    sleep 30
done
EOF

chmod +x /opt/dea/app/autoscale-demo.sh

# Crear servicio systemd para autoescalado
cat > /etc/systemd/system/dea-autoscale.service << 'EOF'
[Unit]
Description=Digital English Academy Autoscale Demo
After=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/dea/app
ExecStart=/opt/dea/app/autoscale-demo.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable dea-autoscale.service
systemctl start dea-autoscale.service

# Obtener IP pública y actualizar HTML
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
sed -i "s/INSTANCE_IP/$PUBLIC_IP/g" /opt/dea/app/demo-app/index.html

echo "✅ Configuración completada!"
echo "🌐 Demo disponible en: http://$PUBLIC_IP"
echo "📊 Grafana: http://$PUBLIC_IP:3001 (admin/demo_grafana_2024)"
echo "🔍 Prometheus: http://$PUBLIC_IP:9090"
echo "📈 cAdvisor: http://$PUBLIC_IP:8080"

# Crear script de estado
cat > /home/ubuntu/demo-status.sh << 'EOF'
#!/bin/bash
echo "🚀 Digital English Academy Demo - Estado"
echo "========================================"
echo "📊 Servicios Docker:"
docker-compose -f /opt/dea/app/docker-compose.demo.yml ps
echo ""
echo "🌐 URLs de acceso:"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "  Demo: http://$PUBLIC_IP"
echo "  Grafana: http://$PUBLIC_IP:3001"
echo "  Prometheus: http://$PUBLIC_IP:9090"
echo "  cAdvisor: http://$PUBLIC_IP:8080"
echo ""
echo "💾 Uso de recursos:"
df -h /opt/dea
echo ""
free -h
EOF

chmod +x /home/ubuntu/demo-status.sh
chown ubuntu:ubuntu /home/ubuntu/demo-status.sh

echo "🎉 Digital English Academy Demo configurado exitosamente!"
echo "Ejecuta: ./demo-status.sh para ver el estado"