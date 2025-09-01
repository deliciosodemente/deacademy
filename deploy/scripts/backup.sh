#!/bin/bash
# Backup script for Digital English Academy
# Creates backups of MongoDB and Redis data

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/tmp/dea-backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# AWS S3 configuration (optional)
S3_BUCKET="${S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    local backup_path="$BACKUP_DIR/$TIMESTAMP"
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Backup MongoDB
backup_mongodb() {
    local backup_path="$1"
    local mongodb_backup_dir="$backup_path/mongodb"
    
    log_info "Starting MongoDB backup..."
    
    # Check if MongoDB is running
    if ! docker ps | grep -q "dea-mongodb"; then
        log_warning "MongoDB container not running, skipping backup"
        return 0
    fi
    
    mkdir -p "$mongodb_backup_dir"
    
    # Get MongoDB connection details
    local mongo_container="dea-mongodb"
    local mongo_db="digitalenglishacademy"
    
    # Create MongoDB dump
    docker exec "$mongo_container" mongodump \
        --db "$mongo_db" \
        --out /tmp/backup \
        --quiet
    
    # Copy backup from container
    docker cp "$mongo_container:/tmp/backup" "$mongodb_backup_dir/"
    
    # Cleanup temporary backup in container
    docker exec "$mongo_container" rm -rf /tmp/backup
    
    # Compress backup
    cd "$backup_path"
    tar -czf "mongodb_$TIMESTAMP.tar.gz" mongodb/
    rm -rf mongodb/
    
    log_success "MongoDB backup completed: mongodb_$TIMESTAMP.tar.gz"
}

# Backup Redis
backup_redis() {
    local backup_path="$1"
    local redis_backup_dir="$backup_path/redis"
    
    log_info "Starting Redis backup..."
    
    # Check if Redis is running
    if ! docker ps | grep -q "dea-redis"; then
        log_warning "Redis container not running, skipping backup"
        return 0
    fi
    
    mkdir -p "$redis_backup_dir"
    
    # Get Redis container
    local redis_container="dea-redis"
    
    # Create Redis backup using BGSAVE
    docker exec "$redis_container" redis-cli BGSAVE
    
    # Wait for backup to complete
    while [[ $(docker exec "$redis_container" redis-cli LASTSAVE) == $(docker exec "$redis_container" redis-cli LASTSAVE) ]]; do
        sleep 1
    done
    
    # Copy RDB file
    docker cp "$redis_container:/data/dump.rdb" "$redis_backup_dir/"
    
    # Compress backup
    cd "$backup_path"
    tar -czf "redis_$TIMESTAMP.tar.gz" redis/
    rm -rf redis/
    
    log_success "Redis backup completed: redis_$TIMESTAMP.tar.gz"
}

# Backup application logs
backup_logs() {
    local backup_path="$1"
    local logs_backup_dir="$backup_path/logs"
    
    log_info "Starting logs backup..."
    
    mkdir -p "$logs_backup_dir"
    
    # Copy nginx logs
    if [[ -d "../logs" ]]; then
        cp -r ../logs/* "$logs_backup_dir/" 2>/dev/null || true
    fi
    
    # Copy Docker container logs
    local containers=("dea-app" "dea-mongodb" "dea-redis")
    for container in "${containers[@]}"; do
        if docker ps -a --format "table {{.Names}}" | grep -q "$container"; then
            docker logs "$container" > "$logs_backup_dir/${container}.log" 2>&1 || true
        fi
    done
    
    # Compress logs
    if [[ -n "$(ls -A "$logs_backup_dir" 2>/dev/null)" ]]; then
        cd "$backup_path"
        tar -czf "logs_$TIMESTAMP.tar.gz" logs/
        rm -rf logs/
        log_success "Logs backup completed: logs_$TIMESTAMP.tar.gz"
    else
        rm -rf "$logs_backup_dir"
        log_warning "No logs found to backup"
    fi
}

# Upload to S3 (if configured)
upload_to_s3() {
    local backup_path="$1"
    
    if [[ -z "$S3_BUCKET" ]]; then
        log_info "S3 bucket not configured, skipping upload"
        return 0
    fi
    
    log_info "Uploading backups to S3..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found, skipping S3 upload"
        return 0
    fi
    
    # Upload all backup files
    for file in "$backup_path"/*.tar.gz; do
        if [[ -f "$file" ]]; then
            local filename=$(basename "$file")
            aws s3 cp "$file" "s3://$S3_BUCKET/dea-backups/$filename" \
                --region "$AWS_REGION" \
                --storage-class STANDARD_IA
            log_success "Uploaded $filename to S3"
        fi
    done
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Local cleanup
    find "$BACKUP_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
    
    # S3 cleanup (if configured)
    if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
        
        aws s3 ls "s3://$S3_BUCKET/dea-backups/" --region "$AWS_REGION" | \
        while read -r line; do
            local file_date=$(echo "$line" | awk '{print $4}' | grep -o '[0-9]\{8\}' | head -1)
            if [[ -n "$file_date" && "$file_date" < "$cutoff_date" ]]; then
                local file_name=$(echo "$line" | awk '{print $4}')
                aws s3 rm "s3://$S3_BUCKET/dea-backups/$file_name" --region "$AWS_REGION"
                log_info "Deleted old backup from S3: $file_name"
            fi
        done
    fi
    
    log_success "Cleanup completed"
}

# Create backup manifest
create_manifest() {
    local backup_path="$1"
    local manifest_file="$backup_path/manifest.json"
    
    log_info "Creating backup manifest..."
    
    cat > "$manifest_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "environment": "${NODE_ENV:-production}",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "backup_files": [
$(find "$backup_path" -name "*.tar.gz" -printf '    "%f",\n' | sed '$ s/,$//')
  ],
  "backup_size": "$(du -sh "$backup_path" | cut -f1)"
}
EOF
    
    log_success "Manifest created: manifest.json"
}

# Verify backups
verify_backups() {
    local backup_path="$1"
    
    log_info "Verifying backup integrity..."
    
    local verification_failed=false
    
    # Verify compressed files
    for file in "$backup_path"/*.tar.gz; do
        if [[ -f "$file" ]]; then
            if tar -tzf "$file" > /dev/null 2>&1; then
                log_success "✓ $(basename "$file") - integrity check passed"
            else
                log_error "✗ $(basename "$file") - integrity check failed"
                verification_failed=true
            fi
        fi
    done
    
    if [[ "$verification_failed" == "true" ]]; then
        log_error "Backup verification failed"
        exit 1
    fi
    
    log_success "All backups verified successfully"
}

# Main backup function
main() {
    log_info "Starting backup process for Digital English Academy"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Backup directory: $BACKUP_DIR"
    log_info "Retention: $RETENTION_DAYS days"
    
    # Create backup directory
    local backup_path
    backup_path=$(create_backup_dir)
    
    # Perform backups
    backup_mongodb "$backup_path"
    backup_redis "$backup_path"
    backup_logs "$backup_path"
    
    # Create manifest
    create_manifest "$backup_path"
    
    # Verify backups
    verify_backups "$backup_path"
    
    # Upload to S3 if configured
    upload_to_s3 "$backup_path"
    
    # Cleanup old backups
    cleanup_old_backups
    
    log_success "🎉 Backup process completed successfully!"
    log_info "Backup location: $backup_path"
    log_info "Backup size: $(du -sh "$backup_path" | cut -f1)"
}

# Help function
show_help() {
    cat << EOF
Digital English Academy Backup Script

Usage: $0 [OPTIONS]

Environment Variables:
    BACKUP_DIR          Directory to store backups (default: /tmp/dea-backups)
    RETENTION_DAYS      Days to keep backups (default: 7)
    S3_BUCKET          S3 bucket for backup storage (optional)
    AWS_REGION         AWS region (default: us-east-1)

Examples:
    $0                                    # Basic backup
    BACKUP_DIR=/backups $0               # Custom backup directory
    S3_BUCKET=my-backups $0              # With S3 upload

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main "$@"