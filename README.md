# Transcendence

A modern web-based Pong game platform with tournament management and blockchain score verification.

## Project Overview

Transcendence is a complete gaming platform that reimagines the classic Pong game with modern web technologies, featuring real-time multiplayer gameplay, tournament management, and blockchain-verified score storage. Built as a microservices architecture with a focus on user experience and competitive gaming.

## Team Members & Roles

| Member | Role | Primary Responsibilities |
|--------|------|-------------------------|
| **Margaux** | Product Owner (PO) | Requirements definition, blockchain integration, tournament system |
| **Quentin** | Project Manager (PM) | Architecture design, microservices setup, authentication system |
| **Ulysse** | Tech Lead | Frontend architecture, custom design system, game statistics |
| **Anthony** | Developer | Pong game engine, game customization, browser compatibility |

## Project Management Approach

### Methodology
We adopted an **Agile-inspired iterative approach** with weekly sprints and clear milestone deliveries:

- **Sprint Planning**: Weekly team meetings to define deliverables and assign tasks
- **Feature-based Development**: Each team member owned specific modules while collaborating on integration
- **Continuous Integration**: Docker-based development environment ensuring consistent deployments
- **Version Control**: Git workflow with feature branches and peer reviews

### Organization Structure
- **Documentation-First**: Comprehensive architecture planning before implementation
- **API Contracts**: Clear service boundaries defined upfront ([API_CONTRACT.md](docs/architecture/API_CONTRACT.md))
- **Modular Development**: Independent service development with integration points
- **Testing Integration**: Continuous testing of microservices communication

## Technology Stack

### Frontend Technologies
- **TypeScript**: Type-safe JavaScript for robust frontend development
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **HTML5 Canvas**: High-performance game rendering for Pong gameplay
- **Responsive Design**: Mobile-first approach with cross-browser compatibility

### Backend Technologies
- **Fastify**: High-performance Node.js web framework chosen for its speed and TypeScript support
- **Node.js**: JavaScript runtime for consistent language across the stack
- **SQLite**: Lightweight, embedded database perfect for development and deployment simplicity
- **bcrypt**: Industry-standard password hashing for security
- **JWT**: JSON Web Tokens for stateless authentication

### Infrastructure & DevOps
- **Docker**: Containerization for consistent development and deployment environments
- **Docker Compose**: Multi-container orchestration for microservices
- **Nginx**: Reverse proxy and static file serving
- **Makefile**: Build automation and development workflow

### Blockchain Integration
- **Avalanche Fuji Testnet**: Fast, low-cost blockchain for score verification
- **Solidity**: Smart contract development for immutable score storage
- **Web3.js**: Blockchain interaction from Node.js services

**Technology Justifications:**
- **Fastify over Express**: Superior performance and native TypeScript support
- **SQLite over PostgreSQL**: Simplified deployment without external dependencies
- **TypeScript everywhere**: Type safety reduces bugs and improves development experience
- **Docker**: Ensures identical environments across development, testing, and production
- **Avalanche**: Fast transaction finality and low costs for gaming applications

## Database Schema

### Core Tables

```sql
-- User management with 2FA support
users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  two_factor_enabled BOOLEAN DEFAULT 0,
  two_factor_secret TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Game match records
matches (
  id INTEGER PRIMARY KEY,
  player1_id INTEGER REFERENCES users(id),
  player2_id INTEGER REFERENCES users(id),
  score1 INTEGER NOT NULL,
  score2 INTEGER NOT NULL,
  winner_id INTEGER REFERENCES users(id),
  tournament_id INTEGER REFERENCES tournaments(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Tournament system
tournaments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK(status IN ('registration', 'in_progress', 'completed')),
  max_players INTEGER DEFAULT 8,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Tournament participation (supports anonymous players)
tournament_registrations (
  id INTEGER PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id),
  player_alias TEXT NOT NULL,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tournament_id, player_alias)
)

-- Blockchain verification records
blockchain_records (
  id INTEGER PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id),
  tx_hash TEXT UNIQUE NOT NULL,
  block_number INTEGER,
  explorer_url TEXT,
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

For complete schema details, see [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md).

## Features & Implementation

### Core Features (All Members)

#### 🎮 **Web-based Pong Game** (Anthony - 2 points)
- **Real-time Canvas Rendering**: Smooth 60fps gameplay with HTML5 Canvas
- **Physics Engine**: Ball collision detection, paddle physics, and scoring
- **Local Multiplayer**: Two players on the same device with keyboard controls
- **Game Customization**: Multiple themes, paddle sizes, and power-ups

#### 🔐 **User Management & Authentication** (Quentin - 2 points)
- **Secure Registration/Login**: bcrypt password hashing, input validation
- **JWT Authentication**: Stateless token-based auth with refresh tokens  
- **Two-Factor Authentication**: TOTP-based 2FA with QR code setup
- **Profile Management**: Avatar upload, bio editing, account settings

#### 🐳 **Microservices Architecture** (Quentin - 2 points)
- **Service Separation**: Independent services for users, auth, game, tournament, blockchain
- **Docker Orchestration**: Complete containerized environment with docker-compose
- **API Gateway**: Nginx reverse proxy with service routing
- **Health Monitoring**: Service health checks and logging

#### ⛓️ **Blockchain Score Storage** (Margaux - 2 points)
- **Avalanche Integration**: Tournament results stored on Fuji testnet
- **Smart Contracts**: Solidity contracts for immutable score records
- **Public Verification**: Snowtrace integration for score transparency
- **Non-blocking Design**: Local storage with async blockchain backup

### Enhanced Features

#### 🏆 **Tournament System** (Margaux - 1 point)
- **Bracket Management**: Single-elimination tournaments with automatic bracket generation
- **Registration System**: Open tournaments with player capacity management
- **Match Recording**: Automated score tracking with winner advancement
- **Leaderboards**: Real-time tournament standings and statistics

#### ✅ **Backend Framework** (All - 1 point)
- **Fastify Implementation**: High-performance API endpoints across all services
- **TypeScript Integration**: Type-safe development with shared interfaces
- **Plugin Ecosystem**: Cookie handling, file uploads, CORS management

#### 🎨 **Custom Design System** (Ulysse - 1 point)
- **Tailwind Configuration**: Custom color palette and component system
- **Responsive Layout**: Mobile-first design with adaptive interfaces
- **Accessibility**: WCAG-compliant navigation and form controls

#### 📊 **Game Statistics** (Ulysse - 1 point)
- **Player Analytics**: Win/loss ratios, average scores, playing time
- **Historical Data**: Match history with detailed game statistics  
- **Performance Metrics**: Response time tracking and skill progression

#### 🌐 **Cross-browser Support** (Anthony, Margaux - 1 point)
- **Firefox Primary**: Optimized for Firefox as main browser
- **Chrome Compatible**: Full functionality across Chromium-based browsers
- **Safari Testing**: iOS/macOS compatibility verification

#### 🎯 **Game Customization** (Anthony - 1 point)
- **Visual Themes**: Multiple color schemes and paddle designs
- **Gameplay Modes**: Speed variations, paddle size options
- **Power-ups**: Special abilities and game modifiers

### Mandatory Requirements ✅

- **Privacy Policy & Terms**: Legal compliance pages
- **Multi-user Support**: Concurrent user sessions and real-time updates
- **HTTPS Security**: SSL/TLS encryption for all communications  
- **Secure Authentication**: Hashed passwords with bcrypt, session management
- **CSS Framework**: Tailwind CSS implementation
- **Clear Database Schema**: Documented relationships and constraints
- **Docker Deployment**: Complete containerized application

## Individual Contributions

### Margaux (Product Owner)
- **Blockchain Integration**: Smart contract development and Avalanche deployment
- **Tournament Backend**: Complete tournament API with bracket generation
- **Product Vision**: Requirements analysis and feature specification  
- **Documentation**: Privacy policy and legal compliance content

### Quentin (Project Manager)
- **Architecture Design**: Microservices structure and API contracts
- **Authentication System**: JWT implementation with 2FA support
- **DevOps Setup**: Docker configuration and deployment automation
- **Backend Services**: User management and session handling

### Ulysse (Tech Lead)
- **Frontend Architecture**: TypeScript setup and component structure  
- **Design System**: Custom Tailwind configuration and UI components
- **Statistics Dashboard**: Game analytics and data visualization
- **User Interface**: Profile management and settings pages

### Anthony (Developer)
- **Pong Game Engine**: Canvas rendering and physics implementation
- **Game Features**: Customization options and gameplay mechanics
- **Browser Testing**: Cross-platform compatibility and optimization
- **Performance Tuning**: Frame rate optimization and responsive controls

## Selected Modules & Points (15/14 required)

| Module | Points | Implementation | Owner |
|--------|--------|----------------|-------|
| Web-based game (Pong) | 2 | ✅ Complete | Anthony |
| Backend as microservices | 2 | ✅ Complete | Quentin |  
| Standard user management & auth | 2 | ✅ Complete | Quentin |
| Blockchain tournament scores | 2 | ✅ Complete | Margaux |
| Backend framework (Fastify) | 1 | ✅ Complete | All |
| Two-Factor Authentication | 1 | ✅ Complete | Quentin |
| Tournament system | 1 | ✅ Complete | Margaux |
| Custom design system | 1 | ✅ Complete | Ulysse |
| Additional browsers support | 1 | ✅ Complete | Anthony, Margaux |
| Game statistics dashboard | 1 | ✅ Complete | Ulysse |
| Game customization options | 1 | ✅ Complete | Anthony |
| **Total** | **15** | | |

**Module Justifications:**
- **Microservices**: Chosen for scalability and team parallel development
- **Blockchain**: Provides transparency and permanent score records for competitive play
- **2FA**: Essential security for competitive gaming platform
- **Tournament System**: Core feature that differentiates from basic Pong implementations

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Make (for build automation)
- Modern web browser (Firefox recommended)

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd transcendance

# Build and start all services
make all

# View running containers
make ps

# Follow logs
make logs

# Stop all services
make down
```

### Development
```bash
# Start development environment
make up

# Rebuild after changes
make restart

# Clean rebuild
make re
```

The application will be available at:
- **Main Application**: http://localhost:8080

### Architecture
The application consists of 6 microservices:
- **nginx**: Reverse proxy and static file server
- **frontend**: TypeScript/Tailwind application
- **users**: User management and profiles  
- **auth**: Authentication and session handling
- **game**: Pong game logic and statistics
- **tournament**: Tournament management with blockchain integration
- **blockchain**: Avalanche smart contract interface

For detailed architecture information, see [docs/architecture/](docs/architecture/).

## Security

- **Password Security**: bcrypt hashing with salt rounds
- **Authentication**: JWT tokens with secure HTTP-only cookies
- **Two-Factor Authentication**: TOTP-based additional security layer
- **Input Validation**: Comprehensive sanitization and validation
- **HTTPS**: TLS encryption for all communications in production

## License

This project is developed as an educational exercise for 42 School.