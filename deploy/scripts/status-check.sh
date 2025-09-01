#!/bin/bash
# Production Status Check Script for Digital English Academy
# Quick health check and status overview

set -euo pipefail

# Configuration
DOMAIN="denglishacademy.com"
COMPOSE_FILE="docker-compose.production.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status indicators
check_mark="✅"
cross_mark="❌"
warning_mark="⚠️"

echo -e "${BLUE}🚀 Digital English Academy - Production Status Check${NC}"
echo -e "${BLUE}Domain: $DOMAIN${NC}"
echo -e "${BLUE}Timestamp: $(date)${NC}"
echo ""

# Check if Docker is running
echo -n "Docker Service: "
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}${check_mark} Running${NC}"
else
    echo -e "${RED}${cross_mark} Not Running${NC}"
    exit 1
fi

# Check Docker Compose services
echo ""
echo -e "${BLUE}📦 Container Status:${NC}"

services=("nginx-lb" "app-1" "app-2" "mongodb-primary" "redis-cluster" "prometheus" "grafana")

for service in "${services[@]}"; do
    echo -n "  $service: "
    if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        health=$(docker-compose -f "$COMPOSE_FILE" ps "$service" | grep "Up" | awk '{print $4}')
        if [[ "$health" == *"healthy"* ]]; then
            echo -e "${GREEN}${check_mark} Healthy${NC}"
        else
            echo -e "${YELLOW}${warning_mark} Running (no health check)${NC}"
        fi
    else
        echo -e "${RED}${cross_mark} Down${NC}"
    fi
done

# Check application endpoints
echo ""
echo -e "${BLUE}🌐 Endpoint Health:${NC}"

endpoints=(
    "https://$DOMAIN:Main Site"
    "https://$DOMAIN/health:Health Check"
    "https://$DOMAIN/api/status:API Status"
    "https://grafana.$DOMAIN:Grafana Dashboard"
)

for endpoint_info in "${endpoints[@]}"; do
    IFS=':' read -r url name <<< "$endpoint_info"
    echo -n "  $name: "
    
    if curl -f -s -m 10 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}${check_mark} OK${NC}"
    else
        echo -e "${RED}${cross_mark} Failed${NC}"
    fi
done

# Check SSL certificate
echo ""
echo -e "${BLUE}🔒 SSL Certificate:${NC}"
echo -n "  Certificate Status: "

if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates > /tmp/ssl_check 2>/dev/null; then
    expiry=$(grep "notAfter" /tmp/ssl_check | cut -d= -f2)
    expiry_epoch=$(date -d "$expiry" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [[ $days_until_expiry -gt 30 ]]; then
        echo -e "${GREEN}${check_mark} Valid (expires in $days_until_expiry days)${NC}"
    elif [[ $days_until_expiry -gt 7 ]]; then
        echo -e "${YELLOW}${warning_mark} Valid (expires in $days_until_expiry days - renewal needed)${NC}"
    else
        echo -e "${RED}${cross_mark} Expires soon ($days_until_expiry days)${NC}"
    fi
    rm -f /tmp/ssl_check
else
    echo -e "${RED}${cross_mark} Invalid or unreachable${NC}"
fi

# Check disk space
echo ""
echo -e "${BLUE}💾 Disk Usage:${NC}"

disk_usage=$(df -h /opt/dea 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//' || echo "0")
echo -n "  Data Directory: "

if [[ $disk_usage -lt 80 ]]; then
    echo -e "${GREEN}${check_mark} ${disk_usage}% used${NC}"
elif [[ $disk_usage -lt 90 ]]; then
    echo -e "${YELLOW}${warning_mark} ${disk_usage}% used${NC}"
else
    echo -e "${RED}${cross_mark} ${disk_usage}% used - cleanup needed${NC}"
fi

# Check memory usage
echo ""
echo -e "${BLUE}🧠 Memory Usage:${NC}"

total_memory=$(free -m | awk 'NR==2{printf "%.0f", $3*100/$2}')
echo -n "  System Memory: "

if [[ $total_memory -lt 80 ]]; then
    echo -e "${GREEN}${check_mark} ${total_memory}% used${NC}"
elif [[ $total_memory -lt 90 ]]; then
    echo -e "${YELLOW}${warning_mark} ${total_memory}% used${NC}"
else
    echo -e "${RED}${cross_mark} ${total_memory}% used - high usage${NC}"
fi

# Check recent backups
echo ""
echo -e "${BLUE}💾 Backup Status:${NC}"
echo -n "  Latest Backup: "

if [[ -n "${AWS_ACCESS_KEY_ID:-}" ]] && [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
    latest_backup=$(aws s3 ls "s3://${BACKUP_S3_BUCKET}/" | sort | tail -1 | awk '{print $2}' || echo "")
    if [[ -n "$latest_backup" ]]; then
        backup_date=$(echo "$latest_backup" | cut -d'_' -f1)
        backup_age=$(( ($(date +%s) - $(date -d "$backup_date" +%s)) / 86400 ))
        
        if [[ $backup_age -le 1 ]]; then
            echo -e "${GREEN}${check_mark} $latest_backup (${backup_age} days ago)${NC}"
        elif [[ $backup_age -le 7 ]]; then
            echo -e "${YELLOW}${warning_mark} $latest_backup (${backup_age} days ago)${NC}"
        else
            echo -e "${RED}${cross_mark} $latest_backup (${backup_age} days ago - too old)${NC}"
        fi
    else
        echo -e "${RED}${cross_mark} No backups found${NC}"
    fi
else
    echo -e "${YELLOW}${warning_mark} Backup not configured${NC}"
fi

# Check application metrics
echo ""
echo -e "${BLUE}📊 Application Metrics:${NC}"

# Get current instance count
instance_count=$(docker-compose -f "$COMPOSE_FILE" ps -q app-* | wc -l)
echo "  Active Instances: $instance_count"

# Get average response time (if available)
if command -v curl &> /dev/null; then
    echo -n "  Response Time: "
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "https://$DOMAIN/health" || echo "0")
    response_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
    
    if [[ $response_ms -lt 500 ]]; then
        echo -e "${GREEN}${check_mark} ${response_ms}ms${NC}"
    elif [[ $response_ms -lt 2000 ]]; then
        echo -e "${YELLOW}${warning_mark} ${response_ms}ms${NC}"
    else
        echo -e "${RED}${cross_mark} ${response_ms}ms - slow${NC}"
    fi
fi

# Summary
echo ""
echo -e "${BLUE}📋 Summary:${NC}"

# Count issues
issues=0
warnings=0

# Simple issue detection (you can expand this)
if ! systemctl is-active --quiet docker; then ((issues++)); fi
if [[ $disk_usage -gt 90 ]]; then ((issues++)); fi
if [[ $total_memory -gt 90 ]]; then ((issues++)); fi

if [[ $disk_usage -gt 80 && $disk_usage -le 90 ]]; then ((warnings++)); fi
if [[ $total_memory -gt 80 && $total_memory -le 90 ]]; then ((warnings++)); fi

if [[ $issues -eq 0 && $warnings -eq 0 ]]; then
    echo -e "  ${GREEN}${check_mark} All systems operational${NC}"
elif [[ $issues -eq 0 ]]; then
    echo -e "  ${YELLOW}${warning_mark} $warnings warnings detected${NC}"
else
    echo -e "  ${RED}${cross_mark} $issues critical issues, $warnings warnings${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "  Application: https://$DOMAIN"
echo "  Monitoring: https://grafana.$DOMAIN"
echo "  Health Check: https://$DOMAIN/health"

echo ""
echo -e "${BLUE}⚡ Quick Commands:${NC}"
echo "  Scale up: npm run deploy:scale-up"
echo "  Scale down: npm run deploy:scale-down"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs --tail=100"
echo "  Restart: docker-compose -f $COMPOSE_FILE restart"

echo ""