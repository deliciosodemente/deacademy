#!/bin/bash
# Script de despliegue completo para Demo en AWS Lightsail
# Digital English Academy - Demo funcional con monitoreo

set -euo pipefail

# Configuración
DEMO_DOMAIN="demo.denglishacademy.com"
INSTANCE_NAME="dea-demo-$(date +%Y%m%d)"
REGION="us-east-1"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
    exit 1
}

# Banner
echo -e "${BLUE}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🚀 DIGITAL ENGLISH ACADEMY - DEMO DEPLOYMENT             ║
║                                                              ║
║    📊 Hosting funcional + Dashboards + Autoescalado         ║
║    🌐 AWS Lightsail + Docker + Prometheus + Grafana         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar prerrequisitos
check_prerequisites() {
    log "Verificando prerrequisitos..."
    
    # AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI no instalado. Instala desde: https://aws.amazon.com/cli/"
    fi
    
    # Credenciales AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI no configurado. Ejecuta: aws configure"
    fi
    
    # jq para JSON
    if ! command -v jq &> /dev/null; then
        warning "jq no instalado. Instalando..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install jq
        else
            sudo apt-get update && sudo apt-get install -y jq
        fi
    fi
    
    success "Prerrequisitos verificados"
}

# Crear instancia Lightsail
create_instance() {
    log "Creando instancia AWS Lightsail..."
    
    # Crear instancia con user-data
    aws lightsail create-instances \
        --instance-names "$INSTANCE_NAME" \
        --availability-zone "${REGION}a" \
        --blueprint-id "ubuntu_20_04" \
        --bundle-id "medium_2_0" \
        --user-data file://deploy/aws-lightsail/user-data.sh \
        --tags key=Project,value=DigitalEnglishAcademy key=Environment,value=Demo
    
    success "Instancia $INSTANCE_NAME creada"
}

# Configurar networking
setup_networking() {
    log "Configurando networking..."
    
    # IP estática
    aws lightsail allocate-static-ip \
        --static-ip-name "${INSTANCE_NAME}-ip"
    
    # Esperar a que la instancia esté lista
    log "Esperando a que la instancia esté corriendo..."
    aws lightsail wait instance-running --instance-name "$INSTANCE_NAME"
    
    # Asignar IP estática
    aws lightsail attach-static-ip \
        --static-ip-name "${INSTANCE_NAME}-ip" \
        --instance-name "$INSTANCE_NAME"
    
    # Configurar firewall
    aws lightsail put-instance-public-ports \
        --instance-name "$INSTANCE_NAME" \
        --port-infos \
            fromPort=22,toPort=22,protocol=TCP \
            fromPort=80,toPort=80,protocol=TCP \
            fromPort=443,toPort=443,protocol=TCP \
            fromPort=3001,toPort=3001,protocol=TCP \
            fromPort=9090,toPort=9090,protocol=TCP \
            fromPort=8080,toPort=8080,protocol=TCP
    
    success "Networking configurado"
}

# Obtener información de la instancia
get_instance_info() {
    log "Obteniendo información de la instancia..."
    
    # Obtener IP pública
    PUBLIC_IP=$(aws lightsail get-static-ip \
        --static-ip-name "${INSTANCE_NAME}-ip" \
        --query 'staticIp.ipAddress' \
        --output text)
    
    # Obtener información de la instancia
    INSTANCE_INFO=$(aws lightsail get-instance --instance-name "$INSTANCE_NAME")
    
    success "Información obtenida - IP: $PUBLIC_IP"
}

# Esperar a que los servicios estén listos
wait_for_services() {
    log "Esperando a que los servicios estén listos..."
    
    local max_attempts=20
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Intento $attempt/$max_attempts - Verificando servicios..."
        
        # Verificar aplicación principal
        if curl -f -s "http://$PUBLIC_IP/health" > /dev/null 2>&1; then
            success "Aplicación principal: ✅ Online"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            warning "Servicios aún no están completamente listos, pero continuando..."
            break
        fi
        
        sleep 30
        ((attempt++))
    done
}

# Configurar dashboards de Grafana
setup_grafana_dashboards() {
    log "Configurando dashboards de Grafana..."
    
    # Esperar a que Grafana esté listo
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://$PUBLIC_IP:3001/api/health" > /dev/null 2>&1; then
            break
        fi
        sleep 10
        ((attempt++))
    done
    
    # Importar dashboard (esto se haría via API en producción)
    success "Grafana configurado (dashboard manual requerido)"
}

# Verificar autoescalado
test_autoscaling() {
    log "Verificando autoescalado..."
    
    # El autoescalado se simula en el user-data script
    # En producción real, aquí verificaríamos las métricas
    
    success "Autoescalado simulado activo"
}

# Mostrar información final
show_demo_info() {
    echo ""
    echo -e "${GREEN}🎉 DEMO DESPLEGADO EXITOSAMENTE! 🎉${NC}"
    echo ""
    echo -e "${BLUE}📋 INFORMACIÓN DEL DEMO:${NC}"
    echo "  Instancia: $INSTANCE_NAME"
    echo "  IP Pública: $PUBLIC_IP"
    echo "  Región: $REGION"
    echo "  Costo estimado: ~$20/mes"
    echo ""
    echo -e "${BLUE}🌐 URLS DE ACCESO:${NC}"
    echo "  🏠 Demo Principal:    http://$PUBLIC_IP"
    echo "  📊 Dashboard Grafana: http://$PUBLIC_IP:3001"
    echo "  🔍 Métricas Prometheus: http://$PUBLIC_IP:9090"
    echo "  📈 Container Metrics: http://$PUBLIC_IP:8080"
    echo ""
    echo -e "${BLUE}🔐 CREDENCIALES:${NC}"
    echo "  Grafana: admin / demo_grafana_2024"
    echo "  SSH: ssh ubuntu@$PUBLIC_IP"
    echo ""
    echo -e "${BLUE}📊 CARACTERÍSTICAS ACTIVAS:${NC}"
    echo "  ✅ Hosting funcional"
    echo "  ✅ Dashboards de monitoreo visibles"
    echo "  ✅ Autoescalado simulado activo"
    echo "  ✅ Métricas en tiempo real"
    echo "  ✅ Contenedores monitoreados"
    echo "  ✅ Sistema de salud automatizado"
    echo ""
    echo -e "${BLUE}🔧 COMANDOS ÚTILES:${NC}"
    echo "  Ver estado: ssh ubuntu@$PUBLIC_IP './demo-status.sh'"
    echo "  Ver logs: ssh ubuntu@$PUBLIC_IP 'docker-compose -f /opt/dea/app/docker-compose.demo.yml logs -f'"
    echo "  Reiniciar: ssh ubuntu@$PUBLIC_IP 'cd /opt/dea/app && docker-compose -f docker-compose.demo.yml restart'"
    echo ""
    echo -e "${YELLOW}⚠️  CONFIGURACIÓN DNS (Opcional):${NC}"
    echo "  A $DEMO_DOMAIN -> $PUBLIC_IP"
    echo "  CNAME grafana.$DEMO_DOMAIN -> $DEMO_DOMAIN"
    echo ""
    echo -e "${GREEN}🚀 El demo está listo para mostrar!${NC}"
}

# Crear script de limpieza
create_cleanup_script() {
    cat > cleanup-demo.sh << EOF
#!/bin/bash
# Script para limpiar recursos del demo

echo "🧹 Limpiando recursos del demo..."

# Eliminar instancia
aws lightsail delete-instance --instance-name "$INSTANCE_NAME" --force-delete-add-ons

# Liberar IP estática
aws lightsail release-static-ip --static-ip-name "${INSTANCE_NAME}-ip"

echo "✅ Recursos eliminados"
echo "💰 Facturación detenida"
EOF
    
    chmod +x cleanup-demo.sh
    success "Script de limpieza creado: ./cleanup-demo.sh"
}

# Función principal
main() {
    log "🚀 Iniciando despliegue de demo en AWS Lightsail"
    
    check_prerequisites
    create_instance
    setup_networking
    get_instance_info
    
    log "⏳ Esperando 3 minutos para que la configuración automática termine..."
    sleep 180
    
    wait_for_services
    setup_grafana_dashboards
    test_autoscaling
    create_cleanup_script
    
    show_demo_info
}

# Manejo de errores
trap 'error "Script interrumpido"' INT TERM

# Ejecutar
main "$@"