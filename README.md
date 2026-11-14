# tictac.io

A real-time, online tic-tac-toe game built with the MERN stack. Players create an account, get matched with someone online (or invite a friend with a room code), and every finished match is saved to their history along with win/loss/draw counts and win streaks. The UI is styled after Agar.io: light grid background, floating coloured cells and chunky outlined text.

This started as a college project, so the focus was on getting the full stack working end to end: REST API, auth, WebSockets and a database that keeps real data.

## Features

- Sign up / log in (JWT + bcrypt), or jump in with a temporary guest account
- Quick match: matchmaking queue, first two players in the queue get paired
- Private rooms: share a 5-character code with a friend
- Practice mode against a bot (random or minimax), not saved
- Match history with filters (all / wins / losses / draws) and pagination
- Stats per player: wins, losses, draws, win rate, current win streak, best streak
- Leaderboard by total wins or best streak
- If a player drops mid-game they get 15 seconds to come back before forfeiting

## Tech

| Part | Used |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, socket.io-client |
| Backend | Node, Express, Socket.IO, Mongoose |
| Database | MongoDB |
| Auth | JSON Web Tokens, bcryptjs |
| Misc | helmet, cors, express-rate-limit |

## Getting started

You need Node 18+ and a MongoDB instance (local install or a free Atlas cluster).

```bash
git clone https://github.com/<your-username>/tictac-io.git
cd tictac-io
npm run install:all

cp server/.env.example server/.env
# open server/.env and set MONGO_URI and JWT_SECRET

npm run dev
```

The client runs on http://localhost:5173 and the API on http://localhost:5000. Vite proxies `/api` and `/socket.io` to the server, so there is nothing else to configure.

To try a multiplayer match on one machine, log in with one account in a normal window and another in a private window.

### Environment variables (`server/.env`)

| Name | Description |
| --- | --- |
| `PORT` | API port, defaults to 5000 |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens, use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed CORS origin, `http://localhost:5173` in dev |

### Production build

```bash
npm run build
NODE_ENV=production npm start
```

In production mode the Express server also serves `client/dist`, so one deployment is enough.

## Project structure

```
server/src
  config/        database connection
  middleware/    auth + error handling
  models/        User, Match
  routes/        auth, matches, users
  services/      saving a match and updating stats
  sockets/       matchmaking, rooms and game events
  utils/         win detection, small helpers
client/src
  api/           axios instance
  context/       auth state, socket + current game state
  components/    board, navbar, logo, background cells
  pages/         auth, lobby, game, practice, history, leaderboard
```

## API

All routes are under `/api`. Routes marked with a lock need an `Authorization: Bearer <token>` header.

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/auth/register` | `{ username, password }` |
| POST | `/auth/login` | `{ username, password }` |
| POST | `/auth/guest` | creates a temporary guest account |
| GET | `/auth/me` (locked) | current user and stats |
| GET | `/matches/me` (locked) | `page`, `limit`, `result=win\|loss\|draw` |
| GET | `/users/leaderboard` | `sort=wins\|streak`, top 10 |
| GET | `/users/:username` | public stats |

## How a match works

The server is the source of truth. Clients connect to Socket.IO with their JWT, join the queue or a room, and send `game:move` events. The server checks that it is that player's turn and the cell is free, applies the move, and broadcasts the new board. When the game ends it saves a `Match` document and updates both players' stats with a single atomic MongoDB update, so streaks stay correct even if two games finish at the same time.

Streak rules: a win adds one to the current streak (and updates the best streak if beaten), a loss resets it to zero, a draw leaves it alone. Leaving a match counts as a loss.

## Known limitations

- Games that are in progress live in server memory, so a server restart ends them and the app can only run as a single instance without adding something like the Redis adapter.
- No turn timer yet, a player can stall by simply not moving.
- Practice games are not stored.
- Guest accounts are deleted automatically after 7 days and are left out of the leaderboard.

## Ideas for later

- Turn timer and rematch button
- Elo-style rating instead of only win counts
- Spectating a live game
- Tests for the socket flow

## License

MIT, see [LICENSE](LICENSE).
