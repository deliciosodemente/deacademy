#!/bin/bash
# Production Scaling Script for Digital English Academy
# Dynamically scales application instances based on load

set -euo pipefail

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
MIN_INSTANCES=2
MAX_INSTANCES=10
CPU_THRESHOLD=70
MEMORY_THRESHOLD=80
SCALE_UP_COOLDOWN=300  # 5 minutes
SCALE_DOWN_COOLDOWN=600  # 10 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get current number of app instances
get_current_instances() {
    docker-compose -f "$COMPOSE_FILE" ps -q app-* | wc -l
}

# Get average CPU usage across all app instances
get_avg_cpu_usage() {
    local total_cpu=0
    local instance_count=0
    
    for container in $(docker-compose -f "$COMPOSE_FILE" ps -q app-*); do
        local cpu=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container" | sed 's/%//')
        total_cpu=$(echo "$total_cpu + $cpu" | bc -l)
        ((instance_count++))
    done
    
    if [[ $instance_count -gt 0 ]]; then
        echo "scale=2; $total_cpu / $instance_count" | bc -l
    else
        echo "0"
    fi
}

# Get average memory usage across all app instances
get_avg_memory_usage() {
    local total_memory=0
    local instance_count=0
    
    for container in $(docker-compose -f "$COMPOSE_FILE" ps -q app-*); do
        local memory=$(docker stats --no-stream --format "{{.MemPerc}}" "$container" | sed 's/%//')
        total_memory=$(echo "$total_memory + $memory" | bc -l)
        ((instance_count++))
    done
    
    if [[ $instance_count -gt 0 ]]; then
        echo "scale=2; $total_memory / $instance_count" | bc -l
    else
        echo "0"
    fi
}

# Get current load (requests per second)
get_current_load() {
    # Get RPS from nginx access logs (last minute)
    local rps=$(tail -n 1000 /opt/dea/logs/nginx/access.log | \
        awk -v date="$(date -d '1 minute ago' '+%d/%b/%Y:%H:%M')" \
        '$4 > "["date {count++} END {print count+0}')
    echo "${rps:-0}"
}

# Check if we're in cooldown period
check_cooldown() {
    local action=$1
    local cooldown_file="/tmp/dea-scale-${action}-cooldown"
    local cooldown_period
    
    if [[ "$action" == "up" ]]; then
        cooldown_period=$SCALE_UP_COOLDOWN
    else
        cooldown_period=$SCALE_DOWN_COOLDOWN
    fi
    
    if [[ -f "$cooldown_file" ]]; then
        local last_scale=$(cat "$cooldown_file")
        local current_time=$(date +%s)
        local time_diff=$((current_time - last_scale))
        
        if [[ $time_diff -lt $cooldown_period ]]; then
            local remaining=$((cooldown_period - time_diff))
            warning "Still in cooldown period. ${remaining}s remaining."
            return 1
        fi
    fi
    
    return 0
}

# Set cooldown
set_cooldown() {
    local action=$1
    local cooldown_file="/tmp/dea-scale-${action}-cooldown"
    date +%s > "$cooldown_file"
}

# Scale up application instances
scale_up() {
    local current_instances=$1
    local new_instances=$((current_instances + 1))
    
    if [[ $new_instances -gt $MAX_INSTANCES ]]; then
        warning "Already at maximum instances ($MAX_INSTANCES)"
        return 1
    fi
    
    if ! check_cooldown "up"; then
        return 1
    fi
    
    log "Scaling up from $current_instances to $new_instances instances"
    
    # Create new app instance
    local new_instance_name="app-$new_instances"
    
    # Add new service to compose file dynamically
    create_new_instance "$new_instance_name" "$new_instances"
    
    # Start the new instance
    docker-compose -f "$COMPOSE_FILE" up -d "$new_instance_name"
    
    # Wait for health check
    wait_for_health "$new_instance_name"
    
    # Update load balancer configuration
    update_load_balancer
    
    set_cooldown "up"
    success "Scaled up to $new_instances instances"
    
    # Send notification
    send_notification "🚀 Scaled UP to $new_instances instances" "info"
}

# Scale down application instances
scale_down() {
    local current_instances=$1
    local new_instances=$((current_instances - 1))
    
    if [[ $new_instances -lt $MIN_INSTANCES ]]; then
        warning "Already at minimum instances ($MIN_INSTANCES)"
        return 1
    fi
    
    if ! check_cooldown "down"; then
        return 1
    fi
    
    log "Scaling down from $current_instances to $new_instances instances"
    
    # Remove the last instance
    local instance_to_remove="app-$current_instances"
    
    # Gracefully stop the instance
    docker-compose -f "$COMPOSE_FILE" stop "$instance_to_remove"
    docker-compose -f "$COMPOSE_FILE" rm -f "$instance_to_remove"
    
    # Update load balancer configuration
    update_load_balancer
    
    set_cooldown "down"
    success "Scaled down to $new_instances instances"
    
    # Send notification
    send_notification "📉 Scaled DOWN to $new_instances instances" "info"
}

# Create new instance configuration
create_new_instance() {
    local instance_name=$1
    local instance_number=$2
    
    # This would typically involve updating the compose file
    # For now, we'll use docker run with similar configuration
    log "Creating new instance: $instance_name"
}

# Wait for instance health check
wait_for_health() {
    local instance_name=$1
    local max_attempts=30
    local attempt=1
    
    log "Waiting for $instance_name to be healthy..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$COMPOSE_FILE" ps "$instance_name" | grep -q "healthy"; then
            success "$instance_name is healthy"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "$instance_name failed to become healthy"
    return 1
}

# Update load balancer configuration
update_load_balancer() {
    log "Updating load balancer configuration..."
    
    # Reload nginx configuration
    docker-compose -f "$COMPOSE_FILE" exec nginx-lb nginx -s reload
    
    success "Load balancer configuration updated"
}

# Send notification
send_notification() {
    local message=$1
    local level=${2:-info}
    
    # Send to Slack/Discord webhook if configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"DEA Production: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Log to system
    logger -t "dea-autoscaler" "$message"
}

# Get scaling decision based on metrics
get_scaling_decision() {
    local current_instances=$1
    local avg_cpu=$2
    local avg_memory=$3
    local current_load=$4
    
    # Scale up conditions
    if (( $(echo "$avg_cpu > $CPU_THRESHOLD" | bc -l) )) || \
       (( $(echo "$avg_memory > $MEMORY_THRESHOLD" | bc -l) )) || \
       (( current_load > 100 )); then
        echo "up"
        return
    fi
    
    # Scale down conditions (more conservative)
    if (( $(echo "$avg_cpu < 30" | bc -l) )) && \
       (( $(echo "$avg_memory < 40" | bc -l) )) && \
       (( current_load < 20 )) && \
       (( current_instances > MIN_INSTANCES )); then
        echo "down"
        return
    fi
    
    echo "none"
}

# Main monitoring and scaling loop
monitor_and_scale() {
    log "Starting auto-scaling monitor..."
    
    while true; do
        local current_instances=$(get_current_instances)
        local avg_cpu=$(get_avg_cpu_usage)
        local avg_memory=$(get_avg_memory_usage)
        local current_load=$(get_current_load)
        
        log "Current metrics:"
        log "  Instances: $current_instances"
        log "  Avg CPU: ${avg_cpu}%"
        log "  Avg Memory: ${avg_memory}%"
        log "  Load (RPS): $current_load"
        
        local decision=$(get_scaling_decision "$current_instances" "$avg_cpu" "$avg_memory" "$current_load")
        
        case $decision in
            "up")
                log "Decision: Scale UP"
                scale_up "$current_instances"
                ;;
            "down")
                log "Decision: Scale DOWN"
                scale_down "$current_instances"
                ;;
            "none")
                log "Decision: No scaling needed"
                ;;
        esac
        
        # Wait before next check
        sleep 60
    done
}

# Manual scaling commands
case "${1:-monitor}" in
    "up")
        current_instances=$(get_current_instances)
        scale_up "$current_instances"
        ;;
    "down")
        current_instances=$(get_current_instances)
        scale_down "$current_instances"
        ;;
    "status")
        current_instances=$(get_current_instances)
        avg_cpu=$(get_avg_cpu_usage)
        avg_memory=$(get_avg_memory_usage)
        current_load=$(get_current_load)
        
        echo "=== Digital English Academy - Scaling Status ==="
        echo "Current instances: $current_instances"
        echo "Average CPU usage: ${avg_cpu}%"
        echo "Average Memory usage: ${avg_memory}%"
        echo "Current load (RPS): $current_load"
        echo "Min instances: $MIN_INSTANCES"
        echo "Max instances: $MAX_INSTANCES"
        ;;
    "monitor")
        monitor_and_scale
        ;;
    *)
        echo "Usage: $0 {up|down|status|monitor}"
        echo "  up      - Scale up by one instance"
        echo "  down    - Scale down by one instance"
        echo "  status  - Show current scaling status"
        echo "  monitor - Start auto-scaling monitor (default)"
        exit 1
        ;;
esac