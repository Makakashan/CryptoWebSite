# Makakatrade

Modern trading platform with real-time market data and portfolio management.

## Stack

**Frontend**
- React 19 + TypeScript
- Redux Toolkit
- WebSocket for real-time updates

**Backend**
- Node.js + Express + TypeScript
- SQLite database
- MQTT for market data
- WebSocket server
- JWT authentication

## Quick Start

### Backend
```sh
cd backend-project
npm install
npm run dev        # Development server (port 3000)
npm run market     # Market data simulator
```

### Frontend
```sh
cd frontend-project
npm install
npm run dev        # Development server (port 5173)
```

## Features

- Real-time price updates via WebSocket
- User authentication & authorization
- Portfolio management
- Order execution (buy/sell)
- Trading statistics
- Multi-language support (i18n)

## Project Structure

```
Makakatrade/
├── backend-project/
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth & validation
│   │   └── utils/        # Helpers
│   └── dist/             # Build output
│
└── frontend-project/
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page layouts
    │   ├── store/        # Redux state
    │   ├── api/          # API clients
    │   └── i18n/         # Translations
    └── dist/             # Build output
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/portfolio` - Get portfolio
- `POST /api/orders` - Place order
- `GET /api/assets` - Get available assets
- `GET /api/stats` - Get trading statistics

## Development

```sh
# Backend
npm run build      # TypeScript compilation
npm start          # Production server

# Frontend
npm run build      # Production build
npm run lint       # Code linting
```

## Environment

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5173`
- WebSocket server on `ws://localhost:3000`

---

⚡ Built with Vite & Express