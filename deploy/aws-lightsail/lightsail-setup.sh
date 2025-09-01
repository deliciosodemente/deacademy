#!/bin/bash
# AWS Lightsail Setup Script para Digital English Academy Demo
# Configuración optimizada para demo funcional con monitoreo

set -euo pipefail

# Configuración
INSTANCE_NAME="dea-demo"
BLUEPRINT="ubuntu_20_04"
BUNDLE_ID="medium_2_0"  # 2 vCPU, 4GB RAM, 80GB SSD - $20/mes
REGION="us-east-1"
DOMAIN="demo.denglishacademy.com"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar AWS CLI
check_aws_cli() {
    log "Verificando AWS CLI..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI no está instalado. Instálalo desde: https://aws.amazon.com/cli/"
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI no está configurado. Ejecuta: aws configure"
    fi
    
    success "AWS CLI configurado correctamente"
}

# Crear instancia Lightsail
create_lightsail_instance() {
    log "Creando instancia AWS Lightsail..."
    
    # Crear instancia
    aws lightsail create-instances \
        --instance-names "$INSTANCE_NAME" \
        --availability-zone "${REGION}a" \
        --blueprint-id "$BLUEPRINT" \
        --bundle-id "$BUNDLE_ID" \
        --user-data file://deploy/aws-lightsail/user-data.sh
    
    success "Instancia $INSTANCE_NAME creada"
}

# Configurar IP estática
setup_static_ip() {
    log "Configurando IP estática..."
    
    # Crear IP estática
    aws lightsail allocate-static-ip \
        --static-ip-name "${INSTANCE_NAME}-static-ip"
    
    # Esperar a que la instancia esté corriendo
    log "Esperando a que la instancia esté lista..."
    aws lightsail wait instance-running --instance-name "$INSTANCE_NAME"
    
    # Asignar IP estática
    aws lightsail attach-static-ip \
        --static-ip-name "${INSTANCE_NAME}-static-ip" \
        --instance-name "$INSTANCE_NAME"
    
    # Obtener IP
    STATIC_IP=$(aws lightsail get-static-ip \
        --static-ip-name "${INSTANCE_NAME}-static-ip" \
        --query 'staticIp.ipAddress' \
        --output text)
    
    success "IP estática configurada: $STATIC_IP"
    echo "Configura tu DNS: A $DOMAIN -> $STATIC_IP"
}

# Configurar firewall
setup_firewall() {
    log "Configurando firewall..."
    
    # Abrir puertos necesarios
    aws lightsail put-instance-public-ports \
        --instance-name "$INSTANCE_NAME" \
        --port-infos fromPort=22,toPort=22,protocol=TCP \
                     fromPort=80,toPort=80,protocol=TCP \
                     fromPort=443,toPort=443,protocol=TCP \
                     fromPort=3000,toPort=3000,protocol=TCP \
                     fromPort=9090,toPort=9090,protocol=TCP \
                     fromPort=3000,toPort=3000,protocol=TCP
    
    success "Firewall configurado"
}

# Crear certificado SSL
setup_ssl_certificate() {
    log "Configurando certificado SSL..."
    
    # Crear certificado SSL en Lightsail
    aws lightsail create-certificate \
        --certificate-name "${INSTANCE_NAME}-ssl" \
        --domain-name "$DOMAIN" \
        --subject-alternative-names "www.$DOMAIN"
    
    success "Certificado SSL creado (requiere validación DNS)"
}

# Configurar Load Balancer (opcional para demo)
setup_load_balancer() {
    log "Configurando Load Balancer..."
    
    aws lightsail create-load-balancer \
        --load-balancer-name "${INSTANCE_NAME}-lb" \
        --instance-port 80 \
        --health-check-path "/health"
    
    # Adjuntar instancia al load balancer
    aws lightsail attach-instances-to-load-balancer \
        --load-balancer-name "${INSTANCE_NAME}-lb" \
        --instance-names "$INSTANCE_NAME"
    
    success "Load Balancer configurado"
}

# Mostrar información de conexión
show_connection_info() {
    log "Obteniendo información de conexión..."
    
    INSTANCE_INFO=$(aws lightsail get-instance --instance-name "$INSTANCE_NAME")
    PUBLIC_IP=$(echo "$INSTANCE_INFO" | jq -r '.instance.publicIpAddress')
    PRIVATE_IP=$(echo "$INSTANCE_INFO" | jq -r '.instance.privateIpAddress')
    
    echo ""
    echo -e "${GREEN}🚀 Instancia AWS Lightsail creada exitosamente!${NC}"
    echo ""
    echo -e "${BLUE}📋 Información de la instancia:${NC}"
    echo "  Nombre: $INSTANCE_NAME"
    echo "  IP Pública: $PUBLIC_IP"
    echo "  IP Privada: $PRIVATE_IP"
    echo "  Región: $REGION"
    echo "  Plan: $BUNDLE_ID (2 vCPU, 4GB RAM)"
    echo ""
    echo -e "${BLUE}🔗 URLs de acceso:${NC}"
    echo "  Aplicación: http://$PUBLIC_IP"
    echo "  Dominio: http://$DOMAIN (después de configurar DNS)"
    echo "  Grafana: http://$PUBLIC_IP:3001"
    echo "  Prometheus: http://$PUBLIC_IP:9090"
    echo ""
    echo -e "${BLUE}🔧 Comandos útiles:${NC}"
    echo "  SSH: ssh ubuntu@$PUBLIC_IP"
    echo "  Ver logs: ssh ubuntu@$PUBLIC_IP 'docker-compose logs -f'"
    echo "  Estado: ssh ubuntu@$PUBLIC_IP 'docker-compose ps'"
    echo ""
    echo -e "${YELLOW}⚠️  Configuración DNS requerida:${NC}"
    echo "  A $DOMAIN -> $PUBLIC_IP"
    echo "  CNAME www.$DOMAIN -> $DOMAIN"
    echo "  CNAME grafana.$DOMAIN -> $DOMAIN"
}

# Función principal
main() {
    log "🚀 Iniciando configuración AWS Lightsail para Digital English Academy Demo"
    
    check_aws_cli
    create_lightsail_instance
    setup_static_ip
    setup_firewall
    # setup_ssl_certificate  # Opcional para demo
    # setup_load_balancer    # Opcional para demo
    
    log "Esperando 2 minutos para que la instancia termine de configurarse..."
    sleep 120
    
    show_connection_info
    
    success "🎉 Demo de Digital English Academy listo en AWS Lightsail!"
}

# Ejecutar si es llamado directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi