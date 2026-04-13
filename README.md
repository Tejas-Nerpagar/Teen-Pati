# 🃏 Teen Patti — Virtual Ledger App

A real-time **Teen Patti** ledger and game-tracking app built with **Node.js**, **Express**, **MySQL**, **Socket.IO**, and a **React + Tailwind CSS** frontend.

Supports both **online multiplayer** (players join with a room code) and an **offline Pass-Pass mode** where a single host device tracks all bets and balances for a physical game.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Sequelize (ORM), MySQL |
| Real-time | Socket.IO |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Frontend | React 18, Vite, Tailwind CSS, Axios, Socket.IO-client |

---

## Project Structure

```
teen-patti-app/
├── backend/
│   ├── config/         # Database connection (Sequelize)
│   ├── controllers/    # Business logic (auth, game)
│   ├── middleware/     # JWT auth middleware
│   ├── models/         # Sequelize models (User, Room, Player, Transaction)
│   ├── routes/         # Express API routes
│   ├── sockets/        # Socket.IO room event handlers
│   ├── schema.sql      # MySQL schema (manual bootstrap)
│   ├── .env.example    # Environment variable template
│   └── server.js       # App entry point
└── frontend/
    └── src/
        ├── components/ # LedgerPanel
        ├── context/    # AuthContext, SocketContext
        └── pages/      # Login, Register, Dashboard, GameTable
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Database Setup

Create the database and tables:
```bash
mysql -u root -p < backend/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and a secure JWT_SECRET
npm install
npm run dev
```

The backend runs on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Create a new user (starts with ₹1,00,000) |
| POST | `/api/login` | Login, returns JWT token |
| GET | `/api/me` | Get current user info |

### Room
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/create-room` | Create a new game room |
| POST | `/api/join-room` | Join an existing room by code |
| POST | `/api/join-guest` | Host adds an offline/guest player |
| GET | `/api/room/:id` | Get full room state |

### Gameplay
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/start-game` | Host starts the game / next round |
| POST | `/api/bet` | Place a bet (your turn) |
| POST | `/api/fold` | Fold (your turn) |
| POST | `/api/show` | Request a show |
| POST | `/api/declare-winner` | Host declares the round winner |

### Offline / Pass-Pass Mode
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/pass` | Host forces a pass for any player |
| POST | `/api/manual-bet` | Host enters a bet on behalf of any player |

---

## Socket Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_room` | `room_id` | Join a socket room for real-time updates |
| `leave_room` | `room_id` | Leave a socket room |

### Server → Client
| Event | Description |
|---|---|
| `player_joined` | A new player joined the room |
| `game_started` | Host started the game |
| `game_update` | Any in-game action (bet, fold, pass, show) |
| `game_over` | Round ended, winner declared |

---

## License

MIT
