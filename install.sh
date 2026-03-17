#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/Nefnief-tech/klipper-connector.git"
INSTALL_DIR="$HOME/klipper-connector"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Functions
print_header() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main installation
main() {
    print_header "Klipper Connector Installer"

    # Check for required commands
    print_info "Checking dependencies..."

    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker found"

    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose found"

    # Use docker compose (v2) or docker-compose (v1)
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi

    # Ask for installation directory
    echo ""
    read -p "Installation directory [$INSTALL_DIR]: " input_dir
    INSTALL_DIR=${input_dir:-$INSTALL_DIR}

    # Clone or update repository
    print_info "Setting up Klipper Connector..."

    if [ -d "$INSTALL_DIR" ]; then
        print_info "Directory exists. Updating..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        print_info "Cloning repository..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi

    print_success "Repository ready"

    # Check for docker-compose.yml
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "docker-compose.yml not found in repository"
        exit 1
    fi

    # Generate secret key for JWT
    print_info "Generating secure keys..."
    JWT_SECRET=$(openssl rand -hex 32)

    # Create or update .env file
    print_info "Setting up environment variables..."

    if [ ! -f "server/.env" ]; then
        cat > server/.env << EOF
# Database
DATABASE_URL="postgresql://kl_gateway_user:\${DB_PASSWORD}@db:5432/kl_gateway?schema=public"

# JWT Secret - Auto-generated
JWT_SECRET="$JWT_SECRET"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3002
NODE_ENV=production
CORS_ORIGIN=*

# Frontend
VITE_API_URL=http://localhost:3002
EOF
        print_success "Environment file created"
    else
        print_info "Environment file already exists, skipping..."
    fi

    # Prompt for database password
    echo ""
    read -sp "Database password (press Enter for random): " db_password
    echo ""
    if [ -z "$db_password" ]; then
        db_password=$(openssl rand -hex 16)
        print_info "Generated random database password"
    fi

    # Update DATABASE_URL in .env
    sed -i "s/\${DB_PASSWORD}/$db_password/g" server/.env

    # Create docker-compose .env file
    cat > .env << EOF
DB_PASSWORD=$db_password
EOF

    print_success "Configuration complete"

    # Build and start containers
    print_info "Building Docker images..."
    $DOCKER_COMPOSE build

    print_info "Starting services..."
    $DOCKER_COMPOSE up -d

    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 10

    # Run database migrations
    print_info "Running database migrations..."
    $DOCKER_COMPOSE exec -T server npx prisma migrate deploy

    print_success "Database migrations complete"

    # Show status
    echo ""
    print_header "Installation Complete!"

    echo ""
    print_success "Klipper Connector is now running"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  Frontend:  http://localhost:3000"
    echo "  API:       http://localhost:3002"
    echo ""
    echo -e "${BLUE}Default Credentials:${NC}"
    echo "  You'll need to create an account on first visit"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  View logs:     $DOCKER_COMPOSE logs -f"
    echo "  Stop:          $DOCKER_COMPOSE down"
    echo "  Restart:       $DOCKER_COMPOSE restart"
    echo "  Update:        cd $INSTALL_DIR && git pull && $DOCKER_COMPOSE up -d --build"
    echo ""
    echo -e "${YELLOW}⚠ Save your database password:${NC} $db_password"
    echo ""
}

# Run main function
main
