#!/bin/bash
# Production Backup Script for Digital English Academy
# Automated backup to AWS S3 with retention policy

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/dea/backups"
S3_BUCKET="${BACKUP_S3_BUCKET:-dea-backups}"
RETENTION_DAYS=30
COMPOSE_FILE="docker-compose.production.yml"

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
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
    fi
    
    # Check S3 bucket access
    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        error "Cannot access S3 bucket: $S3_BUCKET"
    fi
    
    success "Prerequisites check passed"
}

# Create backup directory
setup_backup_dir() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/$timestamp"
    
    mkdir -p "$BACKUP_PATH"
    log "Backup directory created: $BACKUP_PATH"
}

# Backup MongoDB
backup_mongodb() {
    log "Backing up MongoDB..."
    
    local mongodb_backup_dir="$BACKUP_PATH/mongodb"
    mkdir -p "$mongodb_backup_dir"
    
    # Create MongoDB dump
    docker-compose -f "$COMPOSE_FILE" exec -T mongodb-primary mongodump \
        --username="$MONGO_ROOT_USERNAME" \
        --password="$MONGO_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --db=digitalenglishacademy \
        --out=/tmp/backup
    
    # Copy dump from container
    docker cp $(docker-compose -f "$COMPOSE_FILE" ps -q mongodb-primary):/tmp/backup "$mongodb_backup_dir"
    
    # Compress the backup
    tar -czf "$BACKUP_PATH/mongodb.tar.gz" -C "$mongodb_backup_dir" .
    rm -rf "$mongodb_backup_dir"
    
    success "MongoDB backup completed"
}

# Backup Redis
backup_redis() {
    log "Backing up Redis..."
    
    # Trigger Redis save
    docker-compose -f "$COMPOSE_FILE" exec -T redis-cluster redis-cli \
        -a "$REDIS_PASSWORD" BGSAVE
    
    # Wait for save to complete
    while [[ $(docker-compose -f "$COMPOSE_FILE" exec -T redis-cluster redis-cli -a "$REDIS_PASSWORD" LASTSAVE) == $(docker-compose -f "$COMPOSE_FILE" exec -T redis-cluster redis-cli -a "$REDIS_PASSWORD" LASTSAVE) ]]; do
        sleep 1
    done
    
    # Copy Redis dump
    docker cp $(docker-compose -f "$COMPOSE_FILE" ps -q redis-cluster):/data/dump.rdb "$BACKUP_PATH/redis.rdb"
    
    # Compress the backup
    gzip "$BACKUP_PATH/redis.rdb"
    
    success "Redis backup completed"
}

# Backup Grafana
backup_grafana() {
    log "Backing up Grafana..."
    
    # Copy Grafana data
    docker cp $(docker-compose -f "$COMPOSE_FILE" ps -q grafana):/var/lib/grafana "$BACKUP_PATH/grafana"
    
    # Compress the backup
    tar -czf "$BACKUP_PATH/grafana.tar.gz" -C "$BACKUP_PATH" grafana
    rm -rf "$BACKUP_PATH/grafana"
    
    success "Grafana backup completed"
}

# Backup application logs
backup_logs() {
    log "Backing up application logs..."
    
    # Copy recent logs (last 7 days)
    find /opt/dea/logs -name "*.log" -mtime -7 -exec cp {} "$BACKUP_PATH/" \\;
    
    # Compress logs
    tar -czf "$BACKUP_PATH/logs.tar.gz" -C "$BACKUP_PATH" *.log
    rm -f "$BACKUP_PATH"/*.log
    
    success "Logs backup completed"
}

# Backup SSL certificates
backup_ssl() {
    log "Backing up SSL certificates..."
    
    if [[ -d "/opt/dea/ssl/live" ]]; then
        cp -r /opt/dea/ssl/live "$BACKUP_PATH/ssl"
        tar -czf "$BACKUP_PATH/ssl.tar.gz" -C "$BACKUP_PATH" ssl
        rm -rf "$BACKUP_PATH/ssl"
        success "SSL certificates backup completed"
    else
        warning "No SSL certificates found to backup"
    fi
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    local manifest_file="$BACKUP_PATH/manifest.json"
    
    cat > "$manifest_file" << EOF
{
    "backup_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "domain": "denglishacademy.com",
    "environment": "production",
    "backup_type": "full",
    "components": {
        "mongodb": {
            "included": true,
            "file": "mongodb.tar.gz",
            "size": "$(stat -c%s "$BACKUP_PATH/mongodb.tar.gz" 2>/dev/null || echo 0)"
        },
        "redis": {
            "included": true,
            "file": "redis.rdb.gz",
            "size": "$(stat -c%s "$BACKUP_PATH/redis.rdb.gz" 2>/dev/null || echo 0)"
        },
        "grafana": {
            "included": true,
            "file": "grafana.tar.gz",
            "size": "$(stat -c%s "$BACKUP_PATH/grafana.tar.gz" 2>/dev/null || echo 0)"
        },
        "logs": {
            "included": true,
            "file": "logs.tar.gz",
            "size": "$(stat -c%s "$BACKUP_PATH/logs.tar.gz" 2>/dev/null || echo 0)"
        },
        "ssl": {
            "included": $([ -f "$BACKUP_PATH/ssl.tar.gz" ] && echo "true" || echo "false"),
            "file": "ssl.tar.gz",
            "size": "$(stat -c%s "$BACKUP_PATH/ssl.tar.gz" 2>/dev/null || echo 0)"
        }
    },
    "total_size": "$(du -sb "$BACKUP_PATH" | cut -f1)",
    "backup_path": "$BACKUP_PATH"
}
EOF
    
    success "Backup manifest created"
}

# Upload to S3
upload_to_s3() {
    log "Uploading backup to S3..."
    
    local s3_path="s3://$S3_BUCKET/$(basename "$BACKUP_PATH")"
    
    # Upload with server-side encryption
    aws s3 sync "$BACKUP_PATH" "$s3_path" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256 \
        --delete
    
    success "Backup uploaded to: $s3_path"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Local cleanup
    find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    # S3 cleanup
    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    
    aws s3 ls "s3://$S3_BUCKET/" | while read -r line; do
        local backup_date=$(echo "$line" | awk '{print $2}' | cut -d'_' -f1)
        if [[ "$backup_date" < "$cutoff_date" ]]; then
            local backup_name=$(echo "$line" | awk '{print $2}')
            log "Deleting old backup: $backup_name"
            aws s3 rm "s3://$S3_BUCKET/$backup_name" --recursive
        fi
    done
    
    success "Old backups cleaned up"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send to Slack/Discord if configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="good"
        [[ "$status" == "error" ]] && color="danger"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"DEA Backup $status\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Log to system
    logger -t "dea-backup" "$status: $message"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    local errors=0
    
    # Check if all expected files exist
    for file in mongodb.tar.gz redis.rdb.gz grafana.tar.gz logs.tar.gz manifest.json; do
        if [[ ! -f "$BACKUP_PATH/$file" ]]; then
            error "Missing backup file: $file"
            ((errors++))
        fi
    done
    
    # Test archive integrity
    for archive in "$BACKUP_PATH"/*.tar.gz; do
        if ! tar -tzf "$archive" >/dev/null 2>&1; then
            error "Corrupted archive: $(basename "$archive")"
            ((errors++))
        fi
    done
    
    # Test gzip integrity
    for gzfile in "$BACKUP_PATH"/*.gz; do
        if [[ "$gzfile" != *.tar.gz ]]; then
            if ! gzip -t "$gzfile" 2>/dev/null; then
                error "Corrupted gzip file: $(basename "$gzfile")"
                ((errors++))
            fi
        fi
    done
    
    if [[ $errors -eq 0 ]]; then
        success "Backup integrity verification passed"
        return 0
    else
        error "Backup integrity verification failed with $errors errors"
        return 1
    fi
}

# Main backup function
main() {
    log "Starting production backup for Digital English Academy"
    
    local start_time=$(date +%s)
    
    check_prerequisites
    setup_backup_dir
    
    # Perform backups
    backup_mongodb
    backup_redis
    backup_grafana
    backup_logs
    backup_ssl
    
    # Create manifest and verify
    create_manifest
    
    if verify_backup; then
        upload_to_s3
        cleanup_old_backups
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local backup_size=$(du -sh "$BACKUP_PATH" | cut -f1)
        
        success "🎉 Backup completed successfully!"
        success "📊 Backup size: $backup_size"
        success "⏱️  Duration: ${duration}s"
        success "📍 Location: s3://$S3_BUCKET/$(basename "$BACKUP_PATH")"
        
        send_notification "success" "Backup completed successfully. Size: $backup_size, Duration: ${duration}s"
        
        # Cleanup local backup after successful upload
        rm -rf "$BACKUP_PATH"
        
    else
        send_notification "error" "Backup failed integrity verification"
        exit 1
    fi
}

# Handle different backup types
case "${1:-full}" in
    "full")
        main
        ;;
    "mongodb")
        check_prerequisites
        setup_backup_dir
        backup_mongodb
        create_manifest
        verify_backup && upload_to_s3
        ;;
    "redis")
        check_prerequisites
        setup_backup_dir
        backup_redis
        create_manifest
        verify_backup && upload_to_s3
        ;;
    "logs")
        check_prerequisites
        setup_backup_dir
        backup_logs
        create_manifest
        verify_backup && upload_to_s3
        ;;
    *)
        echo "Usage: $0 {full|mongodb|redis|logs}"
        echo "  full    - Complete backup (default)"
        echo "  mongodb - MongoDB only"
        echo "  redis   - Redis only"
        echo "  logs    - Logs only"
        exit 1
        ;;
esac