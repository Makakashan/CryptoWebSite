# Makakatrade

Modern trading platform with real-time market data, portfolio management, and instant navigation.

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

- **Real-time price updates** via WebSocket (Binance API)
- **Instant page navigation** with optimistic UI updates
- **Skeleton loading states** for better UX
- User authentication & authorization (JWT)
- Portfolio management with live asset tracking
- Order execution (buy/sell)
- Trading statistics & charts
- Multi-language support (i18n)
- Automatic icon loading & caching
- Responsive design for all devices

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

## Performance Optimizations

### Instant Navigation
- **Zero-delay page transitions** - skeleton states appear immediately on user interaction
- **Optimistic UI updates** - interface responds instantly before data loads
- **Debounced requests** - prevents duplicate API calls during rapid navigation
- **Smart caching** - reduces unnecessary data fetching

### Real-time Updates
- WebSocket integration with Binance for live price updates
- Throttled UI updates (max 1 per second) to prevent performance issues
- Batch chart data loading to reduce network overhead

### Image Loading
- Automatic icon fetching from CryptoCompare API
- LocalStorage caching (30 days TTL)
- Fallback to generated avatars for missing icons
- Lazy loading for images and charts

---

⚡ Built with Vite & Express | 🚀 Optimized for speed