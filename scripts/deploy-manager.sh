#!/bin/bash

# ProP2P Deployment Manager
# Manages deployments, monitoring, and rollbacks on the production server

set -euo pipefail

# Configuration
REPO_DIR="${REPO_DIR:-/opt/prop2p}"
CURRENT_DEPLOY="$REPO_DIR/current"
BACKUP_DIR="$REPO_DIR/backups"
DEPLOYMENTS_DIR="$REPO_DIR/deployments"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Health check function
health_check() {
    local service=$1
    local port=$2
    local max_attempts=10
    local attempt=1
    
    log "Checking health of $service on port $port..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
            success "$service is healthy!"
            return 0
        fi
        warning "Attempt $attempt/$max_attempts: $service not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    error "$service failed health check after $max_attempts attempts"
    return 1
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        error "Please don't run this script as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -d "$REPO_DIR" ]; then
        error "Repository directory $REPO_DIR not found"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Docker Compose file $COMPOSE_FILE not found"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Show current status
show_status() {
    log "Current deployment status:"
    echo "=================================="
    
    if [ -L "$CURRENT_DEPLOY" ]; then
        echo "Current deployment: $(readlink $CURRENT_DEPLOY)"
        echo "Deployment age: $(stat -c %y "$CURRENT_DEPLOY" | cut -d' ' -f1)"
    else
        warning "No current deployment symlink found"
    fi
    
    echo ""
    echo "Docker containers:"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "Service health:"
    
    # Check backend
    if curl -f -s "http://localhost:8000/health" > /dev/null 2>&1; then
        success "Backend: Healthy"
    else
        error "Backend: Unhealthy"
    fi
    
    # Check frontend
    if curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
        success "Frontend: Healthy"
    else
        error "Frontend: Unhealthy"
    fi
    
    # Check database
    if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U prop2p > /dev/null 2>&1; then
        success "Database: Healthy"
    else
        error "Database: Unhealthy"
    fi
}

# Show logs
show_logs() {
    local service=${1:-""}
    local lines=${2:-100}
    
    if [ -z "$service" ]; then
        log "Showing logs for all services (last $lines lines):"
        docker compose -f "$COMPOSE_FILE" logs --tail="$lines"
    else
        log "Showing logs for $service (last $lines lines):"
        docker compose -f "$COMPOSE_FILE" logs --tail="$lines" "$service"
    fi
}

# Restart service
restart_service() {
    local service=$1
    
    if [ -z "$service" ]; then
        error "Please specify a service to restart (backend, frontend, db)"
        exit 1
    fi
    
    log "Restarting $service..."
    docker compose -f "$COMPOSE_FILE" restart "$service"
    
    # Wait for service to be healthy
    case $service in
        "backend")
            health_check "backend" "8000"
            ;;
        "frontend")
            health_check "frontend" "3000"
            ;;
        "db")
            log "Waiting for database to be ready..."
            sleep 5
            ;;
        *)
            warning "Health check not implemented for $service"
            ;;
    esac
    
    success "$service restarted successfully"
}

# Rollback to previous deployment
rollback() {
    local target=${1:-"previous"}
    
    log "Rolling back to $target deployment..."
    
    if [ ! -L "$CURRENT_DEPLOY" ]; then
        error "No current deployment found"
        exit 1
    fi
    
    local current_path=$(readlink "$CURRENT_DEPLOY")
    local rollback_path=""
    
    case $target in
        "previous")
            # Find the most recent deployment that's not current
            rollback_path=$(find "$DEPLOYMENTS_DIR" -maxdepth 1 -type d -name "*" | grep -v "$(basename "$current_path")" | sort -r | head -n1)
            ;;
        *)
            # Specific deployment
            rollback_path="$DEPLOYMENTS_DIR/$target"
            ;;
    esac
    
    if [ -z "$rollback_path" ] || [ ! -d "$rollback_path" ]; then
        error "No rollback target found"
        exit 1
    fi
    
    log "Rolling back to: $rollback_path"
    
    # Stop current services
    log "Stopping current services..."
    docker compose -f "$COMPOSE_FILE" down
    
    # Update symlink
    log "Updating deployment symlink..."
    rm "$CURRENT_DEPLOY"
    ln -sf "$rollback_path" "$CURRENT_DEPLOY"
    
    # Start services from rollback
    log "Starting services from rollback..."
    cd "$rollback_path"
    docker compose -f "$COMPOSE_FILE" up -d
    
    # Health check
    log "Performing health checks..."
    if health_check "backend" "8000" && health_check "frontend" "3000"; then
        success "Rollback completed successfully!"
    else
        error "Rollback health check failed"
        exit 1
    fi
}

# Cleanup old deployments
cleanup() {
    local keep_count=${1:-5}
    
    log "Cleaning up old deployments (keeping last $keep_count)..."
    
    if [ ! -d "$DEPLOYMENTS_DIR" ]; then
        warning "Deployments directory not found"
        return
    fi
    
    cd "$DEPLOYMENTS_DIR"
    local old_deployments=$(ls -t | tail -n +$((keep_count + 1)))
    
    if [ -n "$old_deployments" ]; then
        echo "Removing old deployments:"
        echo "$old_deployments"
        echo "$old_deployments" | xargs -r rm -rf
        success "Cleanup completed"
    else
        log "No old deployments to remove"
    fi
    
    # Cleanup Docker
    log "Cleaning up Docker resources..."
    docker system prune -f
}

# Emergency stop
emergency_stop() {
    log "EMERGENCY STOP - Stopping all services..."
    docker compose -f "$COMPOSE_FILE" down
    success "All services stopped"
}

# Emergency start
emergency_start() {
    log "EMERGENCY START - Starting all services..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    log "Waiting for services to be ready..."
    sleep 10
    
    if health_check "backend" "8000" && health_check "frontend" "3000"; then
        success "Emergency start completed successfully!"
    else
        error "Emergency start health check failed"
        exit 1
    fi
}

# Show help
show_help() {
    cat << EOF
ProP2P Deployment Manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  status                    Show current deployment status
  logs [SERVICE] [LINES]   Show logs (default: all services, 100 lines)
  restart SERVICE          Restart a specific service
  rollback [TARGET]        Rollback to previous or specific deployment
  cleanup [COUNT]          Cleanup old deployments (default: keep 5)
  emergency-stop           Stop all services immediately
  emergency-start          Start all services
  help                     Show this help message

Examples:
  $0 status
  $0 logs backend 50
  $0 restart frontend
  $0 rollback
  $0 cleanup 3

Environment variables:
  REPO_DIR                 Repository directory (default: /opt/prop2p)

EOF
}

# Main script
main() {
    check_root
    check_prerequisites
    
    local command=${1:-"status"}
    
    case $command in
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2" "$3"
            ;;
        "restart")
            restart_service "$2"
            ;;
        "rollback")
            rollback "$2"
            ;;
        "cleanup")
            cleanup "$2"
            ;;
        "emergency-stop")
            emergency_stop
            ;;
        "emergency-start")
            emergency_start
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
