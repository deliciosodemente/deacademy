#!/bin/bash
# Deployment script for Digital English Academy
# Supports Docker Compose and Kubernetes deployments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

# Default values
ENVIRONMENT="production"
DEPLOYMENT_TYPE="docker"
BUILD_IMAGE="true"
RUN_TESTS="true"
BACKUP_BEFORE_DEPLOY="true"

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

# Help function
show_help() {
    cat << EOF
Digital English Academy Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Deployment environment (production, staging, development)
    -t, --type TYPE         Deployment type (docker, k8s)
    -b, --build             Build Docker image before deployment
    -s, --skip-tests        Skip running tests
    -n, --no-backup         Skip backup before deployment
    -h, --help              Show this help message

Examples:
    $0 --environment production --type docker
    $0 -e staging -t k8s --skip-tests
    $0 --environment development --no-backup

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_IMAGE="true"
            shift
            ;;
        -s|--skip-tests)
            RUN_TESTS="false"
            shift
            ;;
        -n|--no-backup)
            BACKUP_BEFORE_DEPLOY="false"
            shift
            ;;
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

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_error "Valid environments: production, staging, development"
    exit 1
fi

# Validate deployment type
if [[ ! "$DEPLOYMENT_TYPE" =~ ^(docker|k8s)$ ]]; then
    log_error "Invalid deployment type: $DEPLOYMENT_TYPE"
    log_error "Valid types: docker, k8s"
    exit 1
fi

log_info "Starting deployment for Digital English Academy"
log_info "Environment: $ENVIRONMENT"
log_info "Deployment Type: $DEPLOYMENT_TYPE"
log_info "Build Image: $BUILD_IMAGE"
log_info "Run Tests: $RUN_TESTS"
log_info "Backup Before Deploy: $BACKUP_BEFORE_DEPLOY"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required commands exist
    local required_commands=("git" "node" "npm")
    
    if [[ "$DEPLOYMENT_TYPE" == "docker" ]]; then
        required_commands+=("docker" "docker-compose")
    elif [[ "$DEPLOYMENT_TYPE" == "k8s" ]]; then
        required_commands+=("kubectl" "helm")
    fi
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes in production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if ! git diff-index --quiet HEAD --; then
            log_error "Uncommitted changes detected. Please commit or stash changes before production deployment."
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Run tests
run_tests() {
    if [[ "$RUN_TESTS" == "true" ]]; then
        log_info "Running tests..."
        cd "$PROJECT_ROOT"
        
        if ! npm test; then
            log_error "Tests failed. Deployment aborted."
            exit 1
        fi
        
        log_success "All tests passed"
    else
        log_warning "Skipping tests"
    fi
}

# Build application
build_application() {
    log_info "Building application..."
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    npm ci --only=production
    
    # Build application
    NODE_ENV="$ENVIRONMENT" npm run build
    
    log_success "Application built successfully"
}

# Build Docker image
build_docker_image() {
    if [[ "$BUILD_IMAGE" == "true" ]]; then
        log_info "Building Docker image..."
        cd "$PROJECT_ROOT"
        
        local image_tag="digitalenglishacademy/app:$(git rev-parse --short HEAD)"
        local latest_tag="digitalenglishacademy/app:latest"
        
        docker build -f deploy/docker/Dockerfile -t "$image_tag" -t "$latest_tag" .
        
        log_success "Docker image built: $image_tag"
    else
        log_warning "Skipping Docker image build"
    fi
}

# Backup data
backup_data() {
    if [[ "$BACKUP_BEFORE_DEPLOY" == "true" ]]; then
        log_info "Creating backup before deployment..."
        
        local backup_script="$DEPLOY_DIR/scripts/backup.sh"
        if [[ -f "$backup_script" ]]; then
            bash "$backup_script"
            log_success "Backup completed"
        else
            log_warning "Backup script not found, skipping backup"
        fi
    else
        log_warning "Skipping backup"
    fi
}

# Deploy with Docker Compose
deploy_docker() {
    log_info "Deploying with Docker Compose..."
    cd "$DEPLOY_DIR"
    
    # Set environment variables
    export NODE_ENV="$ENVIRONMENT"
    export COMPOSE_PROJECT_NAME="dea-$ENVIRONMENT"
    
    # Load environment-specific variables
    local env_file=".env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        log_info "Loading environment variables from $env_file"
        set -a
        source "$env_file"
        set +a
    fi
    
    # Deploy services
    docker-compose -f docker-compose.yml up -d --remove-orphans
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            log_success "Services are healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Services failed to become healthy within timeout"
            docker-compose logs
            exit 1
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    log_success "Docker deployment completed"
}

# Deploy to Kubernetes
deploy_k8s() {
    log_info "Deploying to Kubernetes..."
    cd "$DEPLOY_DIR/k8s"
    
    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl is not configured or cluster is not accessible"
        exit 1
    fi
    
    # Create namespace if it doesn't exist
    kubectl apply -f namespace.yaml
    
    # Apply configurations
    kubectl apply -f configmap.yaml
    
    # Apply secrets (if they exist)
    if [[ -f "secrets.yaml" ]]; then
        kubectl apply -f secrets.yaml
    else
        log_warning "secrets.yaml not found, make sure secrets are configured"
    fi
    
    # Deploy application
    kubectl apply -f deployment.yaml
    kubectl apply -f ingress.yaml
    kubectl apply -f hpa.yaml
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl rollout status deployment/dea-app -n dea-production --timeout=300s
    
    # Verify deployment
    local ready_replicas=$(kubectl get deployment dea-app -n dea-production -o jsonpath='{.status.readyReplicas}')
    local desired_replicas=$(kubectl get deployment dea-app -n dea-production -o jsonpath='{.spec.replicas}')
    
    if [[ "$ready_replicas" == "$desired_replicas" ]]; then
        log_success "Kubernetes deployment completed successfully"
    else
        log_error "Deployment not fully ready: $ready_replicas/$desired_replicas replicas ready"
        exit 1
    fi
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."
    
    local health_url
    if [[ "$DEPLOYMENT_TYPE" == "docker" ]]; then
        health_url="http://localhost/health"
    else
        # For K8s, we'd need to get the ingress URL or use port-forward
        health_url="http://localhost/health"
    fi
    
    # Wait a bit for the service to be fully ready
    sleep 10
    
    # Check health endpoint
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$health_url" > /dev/null; then
            log_success "Health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Health check failed after $max_attempts attempts"
            exit 1
        fi
        
        log_info "Health check attempt $attempt/$max_attempts..."
        sleep 5
        ((attempt++))
    done
    
    log_success "Deployment verification completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add any cleanup logic here
    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    # Set up error handling
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    run_tests
    build_application
    
    if [[ "$DEPLOYMENT_TYPE" == "docker" ]]; then
        build_docker_image
        backup_data
        deploy_docker
    elif [[ "$DEPLOYMENT_TYPE" == "k8s" ]]; then
        build_docker_image
        backup_data
        deploy_k8s
    fi
    
    verify_deployment
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Deployment Type: $DEPLOYMENT_TYPE"
    log_info "Git Commit: $(git rev-parse --short HEAD)"
    log_info "Deployed at: $(date)"
}

# Run main function
main "$@"