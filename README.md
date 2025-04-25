# Giveaway Chess AI

This project implements a Giveaway Chess (Antichess) game with AI, featuring:
- React frontend with react-chessboard
- Python Flask backend
- Minimax algorithm with alpha-beta pruning
- Custom evaluation function for Giveaway Chess

## Project Structure

```
giveaway-chess-project/
├── Makefile                  # Convenient commands
├── docker-compose.dev.yml    # Development configuration
├── docker-compose.prod.yml   # Production configuration
├── giveaway-chess/           # Frontend (React)
│   ├── Dockerfile.dev        # Development Docker config
│   ├── Dockerfile.prod       # Production Docker config
│   ├── src/
│   │   ├── App.jsx           # Main component
│   │   ├── giveawayChess.js  # Custom game logic
│   │   └── ...
│   └── ...
└── backend/                  # Backend (Flask)
    ├── Dockerfile.dev        # Development Docker config
    ├── Dockerfile.prod       # Production Docker config
    ├── app.py                # Flask application
    ├── giveaway_chess/       # Game logic
    │   ├── rules.py          # Game rules
    │   ├── evaluation.py     # Position evaluation
    │   └── ...
    ├── ai/                   # AI implementation
    │   ├── minimax.py        # Minimax algorithm
    │   ├── search.py         # Iterative deepening search
    │   └── ...
    └── ...
```

## Docker Deployment

### Using the Makefile

The project includes a Makefile with convenient commands for common operations:

```bash
# Start development environment
make dev

# Start production environment
make prod

# Build development images
make build-dev

# Build production images
make build-prod

# Stop all containers
make down

# Clean up all Docker resources
make clean

# View logs
make logs

# Access shell in containers
make frontend-shell
make backend-shell
```

Run `make help` to see all available commands.

### Manual Docker Commands

If you prefer to run Docker commands directly:

#### Development Environment

```bash
# Build and start
docker-compose -f docker-compose.dev.yml up --build

# Access at:
# - Frontend: http://localhost:3478
# - Backend: http://localhost:5478
```

#### Production Environment

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Access at:
# - Application: http://localhost
```

## Giveaway Chess Rules

- Captures are mandatory if available
- The king can be captured (no check/checkmate)
- The goal is to lose all your pieces or have no legal moves
- The player who loses all their pieces first wins

## AI Implementation

The AI uses:
- Minimax algorithm with alpha-beta pruning
- Iterative deepening search for time management
- Custom evaluation that prioritizes:
  - Having fewer pieces
  - Having fewer legal moves
  - Forcing opponent to capture pieces

## Future Enhancements

- Opening book for Giveaway Chess
- Improved evaluation function
- Adjustable difficulty levels
- Game analysis tools

## Credits

- chess.js and react-chessboard for the chess UI
- python-chess for backend chess functionality