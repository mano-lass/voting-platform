# Project Structure

```
voting-platform/
│
├── frontend/                       # Frontend web application
│   ├── index.html                 # Landing page
│   ├── login.html                 # Login page
│   ├── vote.html                  # Voting interface
│   ├── results.html               # Results display
│   ├── css/
│   │   └── style.css              # Global styles
│   ├── js/
│   │   ├── auth.js                # Authentication logic
│   │   ├── voting.js              # Voting functionality
│   │   └── results.js             # Results display logic
│   └── nginx.conf                 # Nginx web server configuration
│
├── backend/                        # Backend API server
│   ├── server.js                  # Express application entry point
│   ├── config.js                  # Application configuration
│   ├── database.js                # Database connection pool
│   ├── package.json               # Node.js dependencies
│   ├── .env.example               # Environment variables template
│   ├── routes/                    # API route handlers
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── vote.js                # Voting endpoints
│   │   ├── results.js             # Results endpoints
│   │   └── health.js              # Health check endpoint
│   └── middleware/                # Express middleware
│       └── auth.js                # JWT authentication middleware
│
├── database/                       # Database scripts and configuration
│   ├── schema.sql                 # Database schema definition
│   ├── init-data.sql              # Initial data (candidates, voters)
│   ├── mysql-primary.cnf          # Primary database configuration
│   ├── mysql-replica.cnf          # Replica database configuration
│   ├── setup-replication.sh       # Replication setup script
│   └── backup.sh                  # Database backup script
│
├── deployment/                     # Deployment configuration
│   ├── docker-compose.yml         # Multi-container orchestration
│   ├── load-balancer/             # Load balancer configuration
│   │   ├── haproxy.cfg            # HAProxy configuration
│   │   └── nginx-lb.conf          # Nginx LB (alternative)
│   ├── app-server/                # Application server container
│   │   ├── Dockerfile             # App server image
│   │   └── start.sh               # Startup script
│   └── scripts/                   # Deployment automation
│       ├── deploy.sh              # Full deployment script
│       ├── failover.sh            # Manual failover procedure
│       └── test.sh                # Testing script
│
├── docs/                           # Documentation
│   ├── DEPLOYMENT.md              # Deployment guide
│   └── ARCHITECTURE.md            # Architecture documentation
│
└── README.md                       # Project overview and quick start
```

## Component Overview

### Frontend (`frontend/`)

Static web application served by Nginx. Contains HTML pages, CSS stylesheets, and client-side JavaScript for user interaction.

**Key Files**:
- `index.html`: Landing page with system information
- `login.html`: Voter authentication form
- `vote.html`: Candidate selection and vote submission
- `results.html`: Real-time election results display
- `css/style.css`: Complete styling for all pages
- `js/*.js`: Client-side logic for auth, voting, and results

### Backend (`backend/`)

Node.js application server using Express.js framework. Handles API requests, authentication, vote processing, and database interaction.

**Key Files**:
- `server.js`: Main application entry point
- `config.js`: Configuration management
- `database.js`: MySQL connection pooling
- `routes/`: API endpoint handlers
- `middleware/`: Request processing middleware

**API Endpoints**:
- `/api/auth/login`: User authentication
- `/api/vote/candidates`: Get candidate list
- `/api/vote/status`: Check voting status
- `/api/vote/submit`: Submit vote
- `/api/results`: Get election results
- `/api/health`: Health check

### Database (`database/`)

MySQL database schema, initialization scripts, and configuration for master-slave replication.

**Key Files**:
- `schema.sql`: Table definitions and constraints
- `init-data.sql`: Sample candidates and voters
- `mysql-primary.cnf`: Primary server config (writes)
- `mysql-replica.cnf`: Replica server config (reads)
- `setup-replication.sh`: Automated replication setup
- `backup.sh`: Database backup automation

**Database Tables**:
- `voters`: Voter authentication and status
- `candidates`: Election candidates
- `votes`: Cast votes with integrity constraints

### Deployment (`deployment/`)

Container orchestration, load balancer configuration, and deployment automation scripts.

**Key Files**:
- `docker-compose.yml`: Multi-container deployment
- `load-balancer/haproxy.cfg`: Load balancer configuration
- `app-server/Dockerfile`: Application container image
- `scripts/deploy.sh`: Automated deployment
- `scripts/test.sh`: System testing
- `scripts/failover.sh`: Manual failover procedure

**Services**:
- `load-balancer`: HAProxy (port 80, 8404)
- `app-server-1, 2, 3`: Node.js servers (port 3000)
- `db-primary`: MySQL primary (port 3306)
- `db-replica`: MySQL replica (port 3306)
- `frontend`: Nginx web server

### Documentation (`docs/`)

Comprehensive documentation for deployment, architecture, and system operation.

**Files**:
- `DEPLOYMENT.md`: Step-by-step deployment guide
- `ARCHITECTURE.md`: System architecture and design decisions

## Data Flow

```
User Browser
    ↓ (HTTP)
Nginx Frontend (Static Files)
    ↓ (AJAX)
HAProxy Load Balancer
    ↓ (Round-robin)
App Servers (Node.js) × 3
    ↓ (SQL)
MySQL Primary Database
    ↓ (Replication)
MySQL Replica Database
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | HTML5, CSS3, JavaScript | User interface |
| Web Server | Nginx | Static file serving |
| Load Balancer | HAProxy | Traffic distribution |
| Application | Node.js + Express | Business logic |
| Database | MySQL 8.0 | Data persistence |
| Containerization | Docker | Deployment |
| Orchestration | Docker Compose | Multi-container management |

## Port Allocation

| Service | Port | Description |
|---------|------|-------------|
| Load Balancer | 80 | HTTP traffic |
| HAProxy Stats | 8404 | Statistics dashboard |
| App Servers | 3000 | Internal API (not exposed) |
| MySQL Primary | 3306 | Database (internal only) |
| MySQL Replica | 3306 | Database (internal only) |

## Environment Configuration

### Development

```env
NODE_ENV=development
DB_HOST=localhost
JWT_SECRET=dev-secret
```

### Production

```env
NODE_ENV=production
DB_HOST=db-primary
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://yourdomain.com
```

## File Permissions

Executable scripts should have execute permission:

```bash
chmod +x deployment/scripts/*.sh
chmod +x database/*.sh
```

## Dependencies

### Backend Dependencies

```json
{
  "express": "Web framework",
  "mysql2": "Database driver",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT authentication",
  "dotenv": "Environment configuration",
  "cors": "CORS handling",
  "helmet": "Security headers",
  "express-validator": "Input validation"
}
```

### System Dependencies

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18 LTS (in container)
- MySQL 8.0 (in container)
- HAProxy 2.8+ (in container)
- Nginx 1.24+ (in container)

## Build Artifacts

Generated during build/deployment:

```
node_modules/           # Node.js dependencies (ignored)
.env                    # Environment variables (ignored)
*.log                   # Log files (ignored)
backup/*.sql.gz         # Database backups
```

## Git Ignore

Files excluded from version control:

```
node_modules/
.env
*.log
backup/*.sql.gz
.DS_Store
```

---

**Last Updated**: December 2025
