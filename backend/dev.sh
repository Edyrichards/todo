#!/bin/bash

# Development Helper Script for Todo Backend
# This script provides various development utilities

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

# Check if Node.js and npm are installed
check_prerequisites() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_warning "Node.js version is $NODE_VERSION. Recommended version is 20+."
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Setup environment
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from .env.example..."
        cp .env.example .env
        print_warning "Please review and update .env file with your configuration"
    else
        print_status ".env file already exists"
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    npm run db:migrate
    print_success "Database migrations completed"
}

# Seed database
seed_database() {
    print_status "Seeding database with test data..."
    npm run db:seed
    print_success "Database seeded"
}

# Reset database
reset_database() {
    print_warning "This will reset the entire database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Resetting database..."
        npm run db:reset
        print_success "Database reset completed"
    else
        print_status "Database reset cancelled"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test
}

# Run tests with coverage
run_tests_coverage() {
    print_status "Running tests with coverage..."
    npm run test:coverage
}

# Run linting
run_lint() {
    print_status "Running linter..."
    npm run lint
}

# Fix linting issues
fix_lint() {
    print_status "Fixing linting issues..."
    npm run lint:fix
    print_success "Linting issues fixed"
}

# Format code
format_code() {
    print_status "Formatting code..."
    npm run format
    print_success "Code formatted"
}

# Type check
type_check() {
    print_status "Running TypeScript type check..."
    npm run type-check
}

# Build application
build_app() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Start development server
start_dev() {
    print_status "Starting development server..."
    npm run dev
}

# Start production server
start_prod() {
    print_status "Starting production server..."
    npm run start
}

# Show application status
show_status() {
    print_status "Application Status:"
    echo ""
    
    # Check if .env exists
    if [ -f .env ]; then
        echo "  ✅ Environment file: .env exists"
    else
        echo "  ❌ Environment file: .env missing"
    fi
    
    # Check if node_modules exists
    if [ -d node_modules ]; then
        echo "  ✅ Dependencies: Installed"
    else
        echo "  ❌ Dependencies: Not installed"
    fi
    
    # Check if build exists
    if [ -d dist ]; then
        echo "  ✅ Build: Available"
    else
        echo "  ❌ Build: Not available"
    fi
    
    echo ""
    echo "Environment Variables:"
    if [ -f .env ]; then
        echo "  PORT: ${PORT:-3001}"
        echo "  NODE_ENV: ${NODE_ENV:-development}"
        echo "  DATABASE_URL: ${DATABASE_URL:-Not set}"
        echo "  REDIS_URL: ${REDIS_URL:-Not set}"
    else
        echo "  No .env file found"
    fi
    
    echo ""
    echo "Available Scripts:"
    echo "  npm run dev          - Start development server"
    echo "  npm run build        - Build for production"
    echo "  npm run start        - Start production server"
    echo "  npm test             - Run tests"
    echo "  npm run lint         - Check code quality"
    echo "  npm run db:migrate   - Run database migrations"
    echo "  npm run db:seed      - Seed database with test data"
    echo "  npm run db:reset     - Reset database"
}

# Setup project (full setup)
setup_project() {
    print_status "Setting up Todo Backend project..."
    
    check_prerequisites
    install_deps
    setup_env
    
    print_warning "Database setup requires PostgreSQL and Redis to be running."
    print_warning "Use '../dev-setup.sh start' to start services with Docker."
    
    echo ""
    print_success "Project setup completed!"
    print_status "Next steps:"
    echo "  1. Review and update .env file"
    echo "  2. Start PostgreSQL and Redis services"
    echo "  3. Run './dev.sh migrate' to set up database"
    echo "  4. Run './dev.sh seed' to add test data"
    echo "  5. Run './dev.sh dev' to start development server"
}

# Clean project
clean_project() {
    print_status "Cleaning project..."
    
    # Remove build artifacts
    if [ -d dist ]; then
        rm -rf dist
        print_status "Removed dist/ directory"
    fi
    
    # Remove node_modules
    if [ -d node_modules ]; then
        print_warning "Remove node_modules? This will require reinstalling dependencies. (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            rm -rf node_modules
            print_status "Removed node_modules/ directory"
        fi
    fi
    
    # Remove coverage
    if [ -d coverage ]; then
        rm -rf coverage
        print_status "Removed coverage/ directory"
    fi
    
    print_success "Project cleaned"
}

# Show help
show_help() {
    echo "Todo Backend Development Helper"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup            Full project setup (dependencies, env, etc.)"
    echo "  deps             Install dependencies"
    echo "  env              Setup environment file"
    echo "  migrate          Run database migrations"
    echo "  seed             Seed database with test data"
    echo "  reset-db         Reset database (with confirmation)"
    echo "  test             Run tests"
    echo "  test-coverage    Run tests with coverage"
    echo "  lint             Run linter"
    echo "  lint-fix         Fix linting issues"
    echo "  format           Format code with Prettier"
    echo "  type-check       Run TypeScript type checking"
    echo "  build            Build application"
    echo "  dev              Start development server"
    echo "  start            Start production server"
    echo "  status           Show project status"
    echo "  clean            Clean build artifacts"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup         # Complete project setup"
    echo "  $0 dev           # Start development server"
    echo "  $0 test          # Run tests"
    echo "  $0 lint-fix      # Fix linting issues"
}

# Main script logic
case "$1" in
    setup)
        setup_project
        ;;
    deps)
        install_deps
        ;;
    env)
        setup_env
        ;;
    migrate)
        run_migrations
        ;;
    seed)
        seed_database
        ;;
    reset-db)
        reset_database
        ;;
    test)
        run_tests
        ;;
    test-coverage)
        run_tests_coverage
        ;;
    lint)
        run_lint
        ;;
    lint-fix)
        fix_lint
        ;;
    format)
        format_code
        ;;
    type-check)
        type_check
        ;;
    build)
        build_app
        ;;
    dev)
        start_dev
        ;;
    start)
        start_prod
        ;;
    status)
        show_status
        ;;
    clean)
        clean_project
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
