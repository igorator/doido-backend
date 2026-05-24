<img src="doido-backend-banner.png" alt="DOIDO Backend Banner" width="100%" />

# DOIDO Backend

> Backend for the **DOIDO** Telegram gift marketplace — built on TON blockchain.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Grammy](https://img.shields.io/badge/Grammy-1.x-blue)](https://grammy.dev/)
[![TON](https://img.shields.io/badge/TON-Blockchain-0098EA?logo=telegram)](https://ton.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TypeORM-336791?logo=postgresql&logoColor=white)](https://typeorm.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io)](https://socket.io/)

---

## Overview

DOIDO is a peer-to-peer marketplace where Telegram users can **buy, sell, and trade Telegram gifts** directly inside a Telegram Mini App. This repository contains the full backend — the REST API, the Telegram bot, the TON on-chain watchers, and the real-time WebSocket layer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.8 (ESM, `tsx`) |
| HTTP Server | Express 5 |
| Telegram Bot | [Grammy](https://grammy.dev/) + webhook |
| ORM | TypeORM 0.3 + PostgreSQL |
| Blockchain | TON (`@ton/ton`, `@ton/core`, `@ton/crypto`) |
| Real-time | Socket.IO 4 |
| Scheduling | `node-cron` |
| Auth | Telegram `initData` HMAC verification |

---

## Features

- 🎁 **Gift Marketplace** — list, unlist, buy, and transfer Telegram gifts with configurable fees
- 📋 **Limit Orders** — place buy orders for specific gift collections / models / backdrops / patterns; auto-matched on listing
- 💎 **TON Deposits & Withdrawals** — on-chain watchers poll TonCenter and batch-process payouts via `WalletV5R1`
- 📊 **Leaderboard** — weekly & all-time rankings refreshed on a cron schedule
- 🔗 **Referral System** — tiered referral bonuses (standard users & influencers)
- 🔔 **Real-time Balance Updates** — Socket.IO pushes balance changes to connected clients
- 🛡️ **Security** — Helmet, CORS allow-list, Telegram initData auth, ban checks on sensitive routes
- 🤖 **Telegram Bot** — rate-limited, auto-retry Grammy bot with a `/start` flow and gift handlers

---

## Project Structure

```
src/
├── app.ts                    # Bootstrap: DB connect → bot → server → scheduled jobs
├── server.ts                 # Express app setup, routes, webhook, Socket.IO init
│
├── bot/                      # Grammy bot
│   ├── bot.ts
│   └── handlers/             # /start, gift-related handlers
│
├── controllers/              # Route handlers (thin layer — delegate to services)
│   ├── activity/             # Feed & per-user activity
│   ├── assets/               # Static asset manifests (collections, backdrops, etc.)
│   ├── gifts/                # CRUD + buy / list / unlist / transfer / price edit
│   ├── leaderboard/          # Weekly & all-time endpoints
│   ├── orders/               # Limit order CRUD
│   ├── pricing/              # Fee calculators
│   ├── server/               # Health / maintenance check
│   ├── ton/                  # Deposit, withdraw, balance
│   └── user/                 # Auth & referral
│
├── database/
│   ├── db.ts                 # TypeORM DataSource
│   └── repositories/         # Thin repo wrappers
│
├── middleware/               # verifyTelegramAuth, verifyGiftOwnerMatch, checkUserNotBanned
│
├── models/                   # TypeORM entities
│   ├── Gift.ts
│   ├── User.ts
│   ├── Activity.ts
│   ├── AppSettings.ts
│   ├── MarketInfo.ts
│   ├── leaderboard/
│   ├── orders/
│   └── ton/
│
├── routes/                   # Express routers
│
├── scheduled/                # Cron / interval workers
│   ├── setupScheduledEvents.ts
│   ├── leaderboardRefresher.ts
│   ├── resetWeeklyMarketVolume.ts
│   ├── tonDepositWatcher.ts  # Polls TonCenter, credits balances
│   └── tonWithdrawWatcher.ts # Batches pending withdrawals on-chain
│
├── services/                 # Business logic
│   ├── gifts/                # Buy, save, delete, transfer, order matching
│   ├── leaderboard/
│   ├── market/
│   ├── messages/
│   ├── stars/
│   ├── ton/
│   └── user/
│
├── shared/
│   ├── constants.ts          # Fee & limit defaults (env-overridable)
│   └── lib/
│       ├── auth/             # checkTelegramInitData HMAC
│       ├── logger.ts
│       └── transformers/     # Decimal ↔ number TypeORM transformer
│
├── sockets/                  # Socket.IO server init & balance push helper
└── ton/                      # TonClient singleton
```

---

## API Reference

All protected routes require an `Authorization: Telegram <initData>` header.

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/auth` | ✅ | Authenticate / upsert Telegram user |
| `PATCH` | `/users/:id/referral` | ✅ | Set referrer |

### Gifts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/gifts` | — | List marketplace gifts |
| `GET` | `/gifts/user` | ✅ | Get current user's gifts |
| `GET` | `/gifts/:gift_id` | — | Get single gift |
| `POST` | `/gifts/buy` | ✅ | Buy one or more gifts |
| `PATCH` | `/gifts/:gift_id/list` | ✅ | List gift for sale |
| `PATCH` | `/gifts/:gift_id/unlist` | ✅ | Remove gift from sale |
| `PATCH` | `/gifts/:gift_id/edit-price` | ✅ | Update sell price |
| `GET` | `/gifts/:gift_id/transfer` | ✅ | Transfer gift to another user |
| `POST` | `/gifts/is-in-stock` | — | Batch stock check |
| `GET` | `/gifts/collections` | — | Gift collection manifest |
| `GET` | `/gifts/backdrops` | — | Backdrop assets |
| `GET` | `/gifts/patterns` | — | Pattern assets |
| `GET` | `/gifts/models` | — | Model assets by collection |

### TON
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/ton/deposit` | ✅ | Create a deposit transaction payload |
| `POST` | `/ton/withdraw` | ✅ | Request a withdrawal |
| `GET` | `/ton/wallet-balance/:address` | — | Get on-chain balance |
| `GET` | `/ton/deposit-withdraw-limits` | — | Get limit constants |

### Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/orders/gifts` | ✅ | List user's active orders |
| `POST` | `/orders/gifts/create` | ✅ | Place a limit buy order |
| `DELETE` | `/orders/gifts/:orderId` | ✅ | Cancel an order |

### Leaderboard
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/leaderboard/weekly` | Weekly top 100 + caller's rank |
| `GET` | `/leaderboard/alltime` | All-time top 100 + caller's rank |

### Activity
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/activity/gifts` | — | Global gift sale feed |
| `GET` | `/activity/gifts/user` | ✅ | User's personal trade history |

### Pricing
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pricing/fees` | Current fee config |
| `GET` | `/pricing/buyer-pays` | Buyer total given seller price |
| `GET` | `/pricing/seller-receives` | Seller net given buyer price |
| `GET` | `/pricing/sell-price-limits` | Min / max sell price |

### Server
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/server/status` | Liveness check |
| `GET` | `/server/maintenance` | Maintenance mode flag |

---

## WebSocket

Connect with `?userId=<telegramId>`. The client is automatically joined to room `user_<userId>`.

| Event | Direction | Payload |
|-------|-----------|---------|
| `balance_update` | Server → Client | `{ ton_balance: number }` |

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

See [`.env.example`](.env.example) for all available variables and their defaults.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL (no `synchronize` — run migrations manually)
- A Telegram bot token
- A TonCenter API key + deposit wallet

### Install & run

```bash
npm install

# Development (hot-reload)
npm run dev

# Production
npm start
```

> **Note:** Scheduled watchers (TON deposit/withdraw, leaderboard refresh, weekly volume reset) are disabled when `NODE_ENV=development` to avoid accidental on-chain transactions.

---

## Fee System

All fee constants are env-overridable (see `src/shared/constants.ts`):

| Constant | Default | Description |
|----------|---------|-------------|
| `MARKET_PERCENT_FEE` | `0.01` (1%) | Base marketplace sell fee |
| `SELL_FEE` | `= MARKET_PERCENT_FEE` | Applied to sell price |
| `GIFT_LISTING_PERCENT_FEE` | `0.1` (10%) | Charged when listing |
| `GIFT_TRANSFER_FEE` | `0.1` TON | Flat transfer fee |
| `GIFT_ORDER_PLACE_FEE` | `0.1` TON | Flat order placement fee |
| `REFERRAL_PERCENT_FEE` | `0.2` (20%) | Referral cut of commission |
| `INFLUENCER_REFERRAL_PERCENT_FEE` | `0.01` (1%) | Influencer cut of commission |
| `MIN_SELL_PRICE` | `0.5` TON | |
| `MAX_SELL_PRICE` | `50 000` TON | |
| `MIN_DEPOSIT_AMOUNT` | `0.1` TON | |
| `MIN_WITHDRAW_AMOUNT` | `0.1` TON | |
| `MAX_WITHDRAW_AMOUNT` | `50` TON | |
| `MAX_FREE_GIFTS_LISTINGS` | `5` | Free listings per gift |

---

## Author

**Ihor Kliushnyk**
