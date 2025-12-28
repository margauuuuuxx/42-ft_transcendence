# Tournament Service

Complete tournament management service with blockchain integration.

## Features

✅ **Tournament Management**
- Create tournaments with customizable player limits
- Registration and unregistration system
- Status tracking (registration → in_progress → completed)

✅ **Bracket System**
- Single elimination bracket generation
- Clear matchup order and positions
- Automatic winner advancement
- Bye handling for odd number of players

✅ **Match Recording**
- Record match results with scores
- Track who plays against whom
- Automatic leaderboard calculation

✅ **Blockchain Integration**
- Async score storage on Avalanche Fuji testnet
- Non-blocking operations
- Blockchain verification badges
- Public verification via Snowtrace

## API Endpoints

### Tournaments
- `POST /tournaments` - Create new tournament
- `GET /tournaments` - Get all tournaments
- `GET /tournaments/:id` - Get tournament details

### Registration
- `POST /tournaments/:id/register` - Register player
- `DELETE /tournaments/:id/register/:player` - Unregister player
- `GET /tournaments/:id/registrations` - Get registered players

### Tournament Flow
- `POST /tournaments/:id/start` - Start tournament & generate brackets
- `GET /tournaments/:id/brackets` - Get bracket structure

### Matches
- `POST /tournaments/matches` - Record match result
- `GET /tournaments/:id/matches` - Get all matches
- `GET /tournaments/:id/leaderboard` - Get tournament standings

## Database Schema

### tournaments
- `id` - Primary key
- `name` - Tournament name
- `status` - registration | in_progress | completed
- `max_players` - Player limit (default 8)
- `started_at` - When tournament started
- `completed_at` - When tournament completed
- `created_at` - Creation timestamp

### tournament_registrations
- `id` - Primary key
- `tournament_id` - Foreign key to tournaments
- `player_alias` - Player username
- `registered_at` - Registration timestamp
- Unique constraint on (tournament_id, player_alias)

### tournament_brackets
- `id` - Primary key
- `tournament_id` - Foreign key to tournaments
- `round` - Round number (1, 2, 3...)
- `position` - Position in round
- `player1_alias` - First player
- `player2_alias` - Second player (null for bye)
- `winner_alias` - Match winner
- `match_id` - Foreign key to tournament_matches

### tournament_matches
- `id` - Primary key
- `tournament_id` - Foreign key to tournaments
- `player_left_alias` - Left player
- `player_right_alias` - Right player
- `winner_alias` - Match winner
- `score_left` - Left player score
- `score_right` - Right player score
- `blockchain_tx_hash` - Blockchain transaction hash
- `blockchain_verified` - Verification status
- `created_at` - Match timestamp

## Tournament Flow

1. **Create Tournament**
   ```bash
   POST /tournaments
   { "name": "Winter Championship", "max_players": 8 }
   ```

2. **Players Register**
   ```bash
   POST /tournaments/1/register
   { "player_alias": "Alice" }
   ```

3. **Start Tournament**
   ```bash
   POST /tournaments/1/start
   # Generates brackets automatically
   ```

4. **View Brackets**
   ```bash
   GET /tournaments/1/brackets
   # Returns matchup structure
   ```

5. **Record Match Results**
   ```bash
   POST /tournaments/matches
   {
     "tournament_id": 1,
     "player_left_alias": "Alice",
     "player_right_alias": "Bob",
     "winner": "left",
     "score_left": 10,
     "score_right": 5
   }
   # Automatically updates bracket & stores on blockchain
   ```

6. **View Leaderboard**
   ```bash
   GET /tournaments/1/leaderboard
   # Returns wins, losses, games played for all players
   ```

## Environment Variables

```env
PORT=3000
BLOCKCHAIN_SERVICE_URL=http://blockchain:3000
```

## Running Locally

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start

# Development mode (auto-rebuild)
npm run dev
```

## Docker

The service runs in a Docker container as part of the compose stack:

```yaml
tournament:
  build: tournament/.
  container_name: tournament
  ports:
    - "3004:3000"
  depends_on:
    - blockchain
```

## Subject Compliance

✅ **Clear matchup order and bracket system**
- Single elimination brackets with rounds and positions
- Visual structure showing progression

✅ **Track who plays against whom**
- tournament_brackets table stores all matchups
- tournament_matches records all results

✅ **Matchmaking system**
- Registration manages participant pool
- Automatic bracket generation pairs players
- Bye system for odd numbers

✅ **Tournament registration and management**
- Register/unregister functionality
- Status tracking
- Capacity management
- Admin controls

## Blockchain Integration

Match results are automatically stored on Avalanche Fuji testnet:
- **Non-blocking**: Tournament continues even if blockchain fails
- **Dual storage**: Local DB + blockchain for speed + verification
- **Public verification**: Anyone can verify scores on Snowtrace
- **Transaction links**: Display blockchain proof in UI

## Notes

- Designed for **local multiplayer** (2 players on same machine)
- Supports 2-16 players per tournament
- Automatic bracket advancement
- Concurrent tournaments supported
- Real-time leaderboard calculation
