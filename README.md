# Klipper Connector

A modern web interface for managing multiple Klipper 3D printers with real-time monitoring.

## Features

- 🖨️ **Multi-printer management** - Add and monitor multiple Klipper instances
- 🌡️ **Real-time temperature monitoring** - Live temperature graphs for extruder and bed
- 📊 **Print progress tracking** - See current print status, progress, and time estimates
- 🎨 **Modern UI** - Clean, responsive design with dark/light mode
- 🔐 **Authentication** - Secure user accounts with JWT tokens
- 🐳 **Docker support** - One-command installation

## Quick Install (Docker)

### Option 1: One-line installer

```bash
curl -fsSL https://raw.githubusercontent.com/Nefnief-tech/klipper-connector/main/install.sh | bash
```

Or with wget:
```bash
wget -qO- https://raw.githubusercontent.com/Nefnief-tech/klipper-connector/main/install.sh | bash
```

### Option 2: Manual Docker setup

```bash
# Clone the repository
git clone https://github.com/Nefnief-tech/klipper-connector.git
cd klipper-connector

# Run the installer
./install.sh
```

## What gets installed

- PostgreSQL database
- Node.js backend server (port 3002)
- React frontend with nginx (port 3000)
- All dependencies via Docker

## Access

After installation:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3002

## Docker Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# Update to latest version
cd ~/klipper-connector
git pull
docker compose up -d --build
```

## Manual Install (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Bun or npm

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your settings
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Configuration

### Environment Variables

**Server (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/kl_gateway
JWT_SECRET=your-secret-key
PORT=3002
CORS_ORIGIN=http://localhost:5173
```

## Adding Printers

1. Log in to your account
2. Click "Add printer"
3. Enter:
   - **Name**: A friendly name for your printer
   - **Host URL**: IP address or hostname (e.g., `192.168.1.100`)
   - **Port**: Moonraker port (default: `7125`)

## Tech Stack

### Frontend
- React 18, Vite, React Router
- Tailwind CSS
- Canvas-based charts

### Backend
- Express.js, Prisma ORM
- PostgreSQL, JWT auth
- Moonraker API proxy

## License

MIT
