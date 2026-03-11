# Makakatrade

Modern trading platform with real-time market data, portfolio management, and instant navigation.

## Prerequisites

- **Node.js** v18+ (tested on v25.4.0)
- **npm** v9+ or yarn
- Modern web browser with WebSocket support

## Stack

**Frontend**
- React 19 + TypeScript
- Vite (build tool)
- Redux Toolkit (state management)
- shadcn/ui + Radix UI (UI components)
- Tailwind CSS (styling)
- WebSocket for real-time updates

**Backend**
- Node.js + Express + TypeScript
- SQLite database (auto-populated with 100 top assets)
- MQTT for market data (Binance integration)
- WebSocket server (real-time updates)
- JWT authentication + cookies
- CORS enabled

## Quick Start

### Launch Everything with One Command (Recommended)

```sh
# First time - install dependencies
npm run install:all

# Start all services (Backend + Market + Frontend)
npm run dev
```

This command will start:
- **Backend Server** at `http://localhost:3000`
- **Market Simulator** (MQTT data from Binance)
- **Frontend** at `http://localhost:5173`

Press `Ctrl+C` to stop all services

**Note:** Works on **Linux, macOS, and Windows**

---

### Manual Start (Optional)

#### Backend
```sh
cd backend-project
npm install
npm run dev        # Development server (port 3000)
npm run market     # Market data run
```

#### Frontend
```sh
cd frontend-project
npm install
npm run dev        # Development server (port 5173)
```

### Environment

Frontend expects an API base URL. Create `frontend-project/.env` based on the example:

```sh
cp frontend-project/.env.example frontend-project/.env
```

Default value:
```
VITE_API_URL=http://localhost:3000/api
```

Optional (for Google login):
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Backend (Google login verification):
```
GOOGLE_CLIENT_ID=your_google_client_id
```

Create `backend-project/.env` if you want to store it locally.

## Project Structure

```
Makakatrade/
├── package.json              # Root scripts to launch entire project
├── README.md                 # Documentation
├── .gitignore               # Git ignore rules
│
├── backend-project/
│   ├── src/
│   │   ├── server.ts        # Express server + WebSocket
│   │   ├── market.ts        # MQTT market data simulator
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth & validation
│   │   └── utils/           # Helpers
│   ├── trading.db           # SQLite database
│   └── dist/                # Build output
│
└── frontend-project/
    ├── src/
    │   ├── components/      # React components
    │   │   └── ui/          # shadcn/ui components
    │   ├── pages/           # Page layouts
    │   ├── store/           # Redux state management
    │   ├── api/             # API clients (REST + WebSocket)
    │   └── i18n/            # Translations (i18next)
    ├── components.json      # shadcn/ui configuration
    └── dist/                # Build output
```


## Features

### Real-time Features
- **Live price updates** via WebSocket (Binance API integration)
- **MQTT market data** with automatic price synchronization every 3 seconds
- **Instant notifications** for order execution and portfolio changes

### Performance
- **Instant page navigation** with optimistic UI updates
- **Skeleton loading states** for better UX
- **Smart caching** for icons and market data
- **Debounced requests** to prevent duplicate API calls
- **Throttled UI updates** (max 1 per second) to prevent performance issues

### Trading Features
- User authentication & authorization (JWT)
- Portfolio management with live asset tracking
- Order execution (buy/sell)
- Trading statistics & performance charts
- Multi-currency support

### UI/UX
- **shadcn/ui components** - Modern, accessible UI components built with Radix UI
- Multi-language support (i18n)
- Automatic cryptocurrency icon loading & caching (CryptoCompare API)
- Fallback to generated avatars for missing icons
- Responsive design for all devices
- Dark/Light theme support

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Trading
- `GET /api/portfolio` - Get user portfolio
- `POST /api/orders` - Place buy/sell order
- `GET /api/orders` - Get order history

### Market Data
- `GET /api/assets` - Get available trading assets
- `GET /api/stats` - Get trading statistics
- `WS /` - WebSocket connection for real-time updates

### MQTT Topics
- `vacetmax/market/{SYMBOL}` - Real-time price updates for each asset

## Database Schema

The SQLite database (`trading.db`) is automatically created with the following tables:

### Users
- `id` - Primary key
- `username` - Unique username
- `password` - Hashed password (bcrypt)
- `balance` - Default $10,000 starting balance
- `avatar` - User avatar URL

### Portfolio
- `id` - Primary key
- `user_id` - Foreign key to users
- `asset_symbol` - Cryptocurrency symbol (e.g., BTCUSDT)
- `amount` - Amount owned

### Orders
- `id` - Primary key
- `user_id` - Foreign key to users
- `asset_symbol` - Cryptocurrency symbol
- `order_type` - 'BUY' or 'SELL'
- `amount` - Order quantity
- `price_at_transaction` - Price at execution time
- `timestamp` - Order timestamp

### Assets
- `id` - Primary key
- `symbol` - Unique symbol (e.g., BTCUSDT)
- `name` - Asset name
- `image_url` - Icon URL from CoinGecko
- `category` - Asset category
- `description` - Asset description
- `is_active` - Active status
- `created_at` - Creation timestamp

**Note:** Database auto-populates with top 100 trading pairs from Binance on first run.

## Environment

- **Backend API:** `http://localhost:3000`
- **Frontend:** `http://localhost:5173`
- **WebSocket:** `ws://localhost:3000`
- **MQTT Broker:** `mqtt://test.mosquitto.org`

## Technologies & Libraries

### Backend
- `express` - Web framework
- `typescript` - Type safety
- `tsx` - TypeScript execution for development
- `sqlite3` + `sqlite` - Database
- `ws` - WebSocket server
- `mqtt` - MQTT client for market data
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cookie-parser` - Cookie parsing middleware
- `cors` - Cross-Origin Resource Sharing
- `axios` - HTTP client (Binance & CoinGecko APIs)

### Frontend
- `vite` - Build tool & dev server
- `react` 19 - UI framework
- `react-router-dom` - Routing
- `@reduxjs/toolkit` - State management
- `redux` - Core state management
- `react-redux` - React bindings for Redux
- `shadcn/ui` - UI component library (built on Radix UI)
- `@radix-ui/*` - Accessible UI primitives
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - CVA for component variants
- `clsx` + `tailwind-merge` - Conditional styling utilities
- `axios` - API client
- `recharts` - Charts and graphs
- `formik` + `yup` - Form validation
- `i18next` + `react-i18next` - Internationalization
- `lucide-react` + `react-icons` - Icon libraries

Built with Vite & Express. Optimized for speed. Cross-platform support.
