# Transcendence

A modern web-based Pong game platform with tournament management and blockchain score verification.

Project made with my fellow 42 students and friends Quentin Alpesse (@QuintusAlp), Ulysse Gerkens (@ulsgks) and Anthony Goldberg (@Anthoneau)

## Project Overview

Transcendence is a complete gaming platform that reimagines the classic Pong game with modern web technologies, featuring real-time multiplayer gameplay, tournament management, and blockchain-verified score storage. Built as a microservices architecture with a focus on user experience and competitive gaming.

## Tech Stack

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

#### 🏆 **Tournament System**
- **Bracket Management**: Single-elimination tournaments with automatic bracket generation
- **Registration System**: Open tournaments with player capacity management
- **Match Recording**: Automated score tracking with winner advancement
- **Leaderboards**: Real-time tournament standings and statistics

#### ✅ **Backend Framework**
- **Fastify Implementation**: High-performance API endpoints across all services
- **TypeScript Integration**: Type-safe development with shared interfaces
- **Plugin Ecosystem**: Cookie handling, file uploads, CORS management

#### 🎨 **Custom Design System**
- **Tailwind Configuration**: Custom color palette and component system
- **Responsive Layout**: Mobile-first design with adaptive interfaces
- **Accessibility**: WCAG-compliant navigation and form controls

#### 📊 **Game Statistics**
- **Player Analytics**: Win/loss ratios, average scores, playing time
- **Historical Data**: Match history with detailed game statistics  
- **Performance Metrics**: Response time tracking and skill progression

#### 🌐 **Cross-browser Support**
- **Firefox Primary**: Optimized for Firefox as main browser
- **Chrome Compatible**: Full functionality across Chromium-based browsers
- **Safari Testing**: iOS/macOS compatibility verification

#### 🎯 **Game Customization**
- **Visual Themes**: Multiple color schemes and paddle designs
- **Gameplay Modes**: Speed variations, paddle size options
- **Power-ups**: Special abilities and game modifiers

#### **Other Features**
- **Privacy Policy & Terms**: Legal compliance pages
- **Multi-user Support**: Concurrent user sessions and real-time updates
- **HTTPS Security**: SSL/TLS encryption for all communications  
- **Secure Authentication**: Hashed passwords with bcrypt, session management
- **CSS Framework**: Tailwind CSS implementation
- **Clear Database Schema**: Documented relationships and constraints
- **Docker Deployment**: Complete containerized application

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
- **Main Application**: http://localhost:4343

### Architecture
The application consists of 6 microservices:
- **nginx**: Reverse proxy and static file server
- **frontend**: TypeScript/Tailwind application
- **users**: User management and profiles  
- **auth**: Authentication and session handling
- **game**: Pong game logic and statistics
- **tournament**: Tournament management with blockchain integration
- **blockchain**: Avalanche smart contract interface

## Security

- **Password Security**: bcrypt hashing with salt rounds
- **Authentication**: JWT tokens with secure HTTP-only cookies
- **Two-Factor Authentication**: TOTP-based additional security layer
- **Input Validation**: Comprehensive sanitization and validation
- **HTTPS**: TLS encryption for all communications in production

## License

This project is developed as an educational exercise for 42 School.