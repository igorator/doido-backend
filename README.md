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
| Language | TypeScript 5.8 (strict, ESM, `tsx`) |
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
├── app.ts                    # Bootstrap: DB → bot → server → scheduled jobs
├── server.ts                 # Express app, middleware, routes, Socket.IO
│
├── bot/                      # Grammy bot
│   ├── bot.ts
│   └── handlers/             # /start, gift-received handler
│
├── config/                   # Configuration — split by domain
│   ├── index.ts              # Assembles and exports `config`
│   ├── env.ts                # dotenv init (side-effect, loaded first)
│   ├── server.ts             # Port, NODE_ENV
│   ├── telegram.ts           # Bot token, webhook, business connection
│   ├── postgres.ts           # DB connection params
│   ├── ton.ts                # Wallets, TonCenter, batch settings
│   ├── fees.ts               # Market, referral, listing, transfer fees
│   ├── limits.ts             # Price and amount limits
│   ├── stars.ts              # Stars threshold & transfer count
│   ├── cron.ts               # Cron expressions
│   └── _helpers.ts           # num() env parser
│
├── controllers/              # Route handlers — thin layer, delegate to services
│   ├── activity/
│   ├── assets/
│   ├── gifts/
│   ├── leaderboard/
│   ├── pricing/
│   ├── server/
│   ├── ton/
│   └── user/
│
├── database/
│   ├── db.ts                 # TypeORM DataSource
│   └── repositories/
│
├── middleware/               # verifyTelegramAuth, verifyGiftOwnerMatch, checkUserNotBanned
│
├── models/                   # TypeORM entities
│   ├── Gift.ts               # Embedded: Model, Pattern, Backdrop (colors as #RRGGBB, rarity as %)
│   ├── User.ts
│   ├── Activity.ts
│   ├── AppSettings.ts
│   ├── MarketInfo.ts
│   ├── leaderboard/
│   └── ton/
│
├── routes/                   # Express routers
│   ├── index.ts              # Barrel export of all routers
│   ├── giftRoutes.ts
│   ├── userRoutes.ts
│   ├── tonRoutes.ts
│   ├── activityRoutes.ts
│   ├── pricingRoutes.ts
│   ├── leaderboardRoutes.ts
│   └── serverRoutes.ts
│
├── scheduled/                # Cron / interval workers
│   ├── setupScheduledEvents.ts
│   ├── leaderboardRefresher.ts
│   ├── resetWeeklyMarketVolume.ts
│   ├── tonDepositWatcher.ts
│   └── tonWithdrawWatcher.ts
│
├── services/                 # Business logic
│   ├── gifts/
│   ├── leaderboard/
│   ├── market/
│   ├── messages/
│   ├── notifications/        # All notification functions
│   │   ├── giftNotifications.ts
│   │   ├── marketNotifications.ts
│   │   └── starsNotifications.ts
│   ├── stars/
│   ├── ton/
│   └── user/
│
├── shared/
│   └── lib/
│       ├── auth/             # checkTelegramInitData HMAC
│       ├── handleHttpError.ts
│       ├── httpError.ts
│       └── transformers/     # Decimal ↔ number TypeORM transformer
│
├── sockets/                  # Socket.IO server & balance push
└── ton/                      # TonClient singleton
```

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

## Configuration

All config lives in `src/config/` — split by domain. Every value is env-overridable via `.env`.

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Domain | File | Key variables |
|--------|------|---------------|
| Server | `config/server.ts` | `PORT`, `NODE_ENV` |
| Telegram | `config/telegram.ts` | `TELEGRAM_BOT_TOKEN`, `BOT_WEBHOOK_URL`, `TELEGRAM_BUSINESS_CONNECTION_ID` |
| PostgreSQL | `config/postgres.ts` | `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| TON | `config/ton.ts` | `TON_DEPOSIT_WALLET_ADDRESS`, `TON_DEPOSIT_WALLET_SECRET_KEY`, `TON_WITHDRAW_WALLET_SECRET_KEY`, `TONCENTER_API_ENDPOINT` |
| Fees | `config/fees.ts` | `DEFAULT_FEE`, `REFERRAL_FEE`, `GIFT_LISTING_FEE`, `GIFT_TRANSFER_FEE`, `SELL_FEE` |
| Limits | `config/limits.ts` | `MIN_SELL_PRICE`, `MAX_SELL_PRICE`, `MIN_WITHDRAW_AMOUNT`, `MAX_WITHDRAW_AMOUNT` |

---

## Fee System

| Fee | Default | Description |
|-----|---------|-------------|
| `fees.marketPercent` | `0.01` (1%) | Base marketplace sell fee |
| `fees.sell` | `= marketPercent` | Applied to sell price |
| `fees.giftListing` | `0.1` TON | Charged after free listings are used up |
| `fees.giftTransfer` | `0.1` TON | Flat fee per gift transfer |
| `fees.referralPercent` | `0.2` (20%) | Referral cut of commission |
| `fees.influencerReferralPercent` | `0.01` (1%) | Influencer cut of commission |
| `limits.maxFreeListings` | `5` | Free listings per gift |
| `limits.minSellPrice` | `0.5` TON | |
| `limits.maxSellPrice` | `50 000` TON | |
| `limits.minWithdraw` | `0.1` TON | |
| `limits.maxWithdraw` | `50` TON | |

---

## Gift Data Model

Backdrop colors are stored as **hex strings** (`#RRGGBB`), converted from the Telegram API's RGB integer on ingestion. Rarity is stored as a **percentage** (`rarity_per_mille / 10`), e.g. `500‰ → 50.0%`.

---

## WebSocket

Connect with `?userId=<telegramId>`. The client is automatically joined to room `user_<userId>`.

| Event | Direction | Payload |
|-------|-----------|---------|
| `balance_update` | Server → Client | `{ ton_balance: number }` |

---

## API

See [`API.md`](API.md) for the full endpoint reference with request/response shapes.

---

## Author

**Ihor Kliushnyk**
