# KL Gateway

A centralized authentication and management system for Klipper/Moonraker 3D printers.

## Features

- User authentication with JWT tokens
- Registration and login functionality
- Secure password storage with bcrypt
- Printer management (add, list, access)
- Protected routes requiring authentication
- Responsive web interface
- Dark mode UI
- Cookie-based session management

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling framework
- **PostCSS & Autoprefixer** - CSS processing

### Backend
- **Express.js** - Web framework
- **Prisma** - ORM for database management
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cookie-parser** - Cookie handling
- **helmet** - Security headers
- **cors** - CORS handling
- **express-rate-limit** - Rate limiting
- **joi** - Input validation

## Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ 
- Git

### Database Setup

1. Create PostgreSQL database:
```bash
createdb kl_gateway
```

2. Create database user (optional, or use existing user):
```bash
psql -d postgres
CREATE USER kl_gateway_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kl_gateway TO kl_gateway_user;
\q
```

3. Configure environment variables in `server/.env`:
```env
DATABASE_URL="postgresql://kl_gateway_user:your_password@localhost:5432/kl_gateway?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

4. Generate Prisma client and run migrations:
```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

### Application Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd kl-gateway
```

2. Install dependencies:
```bash
npm install
cd server && npm install && cd ..
cd frontend && npm install && cd ..
```

## Running

### Development Mode

Start both frontend and backend:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Production Mode

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Start production server:
```bash
cd server
NODE_ENV=production node src/server.js
```

The production server will serve the frontend static files from the `/build` directory.

### Using PM2 (Recommended for Production)

```bash
npm install -g pm2
pm2 start server/src/server.js --name kl-gateway --env production
```

## Usage

### Registration

1. Navigate to http://localhost:5173/login
2. Click "Register"
3. Enter username and password (minimum 8 characters)
4. Click "Register"

### Adding a Printer

1. Login to access the dashboard
2. Click "Add Printer"
3. Fill in printer details:
   - Name: e.g., "Main Printer"
   - Host: e.g., "http://192.168.1.100"
   - Port: e.g., "7125" (default Moonraker port)
   - Path: e.g., "/"
4. Click "Save Printer"

### Accessing a Printer

1. From dashboard, click "Open" on a printer
2. The interface will proxy to your Moonraker instance
3. Full Moonraker/Klipper functionality available through the proxy

### Authentication

- JWT access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Automatic token refresh on expiry
- Sessions managed via httpOnly cookies

## Security

- Passwords hashed with bcrypt
- JWT tokens for stateless authentication
- httpOnly cookies for secure session storage
- Helmet.js for security headers
- Rate limiting on authentication endpoints
- CORS configured for specific origins
- Input validation with Joi

### Important Security Notes

- Change `JWT_SECRET` in production to a strong random value
- Use HTTPS in production
- Use strong database passwords
- Keep dependencies updated
- Review and adjust CORS origins as needed

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Printers
- `GET /api/printers` - List user's printers
- `POST /api/printers` - Add new printer
- `DELETE /api/printers/:id` - Delete printer
- `GET /api/printers/:id` - Get printer details
- `ALL /proxy/*` - Proxy to Moonraker instance

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection string in `server/.env`
- Ensure database and user exist

### Migration Errors
- Drop and recreate database: `dropdb kl_gateway && createdb kl_gateway`
- Run migrations again: `npm run prisma:migrate`

### Frontend Build Issues
- Clear cache: `rm -rf node_modules .vite && npm install`
- Check Node.js version: `node --version` (requires 18+)

### Port Already in Use
- Change PORT in `server/.env`
- Kill process using port: `lsof -ti:3001 | xargs kill`

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on the repository.
