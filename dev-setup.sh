#!/bin/bash

# Todo App Development Environment Setup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please review and update .env file with your configuration"
    else
        print_success ".env file exists"
    fi
}

# Start services
start_services() {
    print_status "Starting PostgreSQL and Redis services..."
    
    # Use docker-compose or docker compose based on what's available
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD up -d postgres redis
    
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    for i in {1..30}; do
        if docker exec todo-postgres pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 1
    done
    
    # Wait for Redis
    for i in {1..30}; do
        if docker exec todo-redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Redis failed to start"
            exit 1
        fi
        sleep 1
    done
}

# Start optional services (pgAdmin, Redis Commander)
start_optional_services() {
    print_status "Starting optional management services..."
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD up -d pgadmin redis-commander
    
    print_success "Management interfaces started:"
    echo "  - pgAdmin: http://localhost:8080 (admin@todoapp.com / admin)"
    echo "  - Redis Commander: http://localhost:8081 (admin / admin)"
}

# Stop services
stop_services() {
    print_status "Stopping all services..."
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD down
    print_success "All services stopped"
}

# Clean up (remove volumes)
cleanup() {
    print_warning "This will remove all data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        if command -v docker-compose &> /dev/null; then
            COMPOSE_CMD="docker-compose"
        else
            COMPOSE_CMD="docker compose"
        fi
        
        $COMPOSE_CMD down -v
        print_success "All services and data removed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Show logs
show_logs() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD logs -f
}

# Show status
show_status() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    print_status "Service Status:"
    $COMPOSE_CMD ps
    
    echo ""
    print_status "Service URLs:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo "  - pgAdmin: http://localhost:8080"
    echo "  - Redis Commander: http://localhost:8081"
}

# Show help
show_help() {
    echo "Todo App Development Environment Manager"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start         Start core services (PostgreSQL, Redis)"
    echo "  start-all     Start all services including management interfaces"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  status        Show service status"
    echo "  logs          Show service logs"
    echo "  cleanup       Remove all services and data"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start       # Start PostgreSQL and Redis"
    echo "  $0 start-all   # Start all services"
    echo "  $0 logs        # View logs"
    echo "  $0 status      # Check service status"
}

# Main script logic
case "$1" in
    start)
        check_docker
        check_env_file
        start_services
        ;;
    start-all)
        check_docker
        check_env_file
        start_services
        start_optional_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        check_docker
        check_env_file
        start_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            print_error "No command specified"
        else
            print_error "Unknown command: $1"
        fi
        echo ""
        show_help
        exit 1
        ;;
esac
