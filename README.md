<img src="doido-backend-banner.png" alt="DOIDO Backend" width="100%" />

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white&style=flat-square)](https://expressjs.com)
[![Grammy](https://img.shields.io/badge/Grammy-1.x-2CA5E0?logo=telegram&logoColor=white&style=flat-square)](https://grammy.dev)
[![TON](https://img.shields.io/badge/TON_Connect-0098EA?logo=ton&logoColor=white&style=flat-square)](https://ton.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TypeORM-336791?logo=postgresql&logoColor=white&style=flat-square)](https://typeorm.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white&style=flat-square)](https://socket.io)

**REST API, Telegram Bot & TON blockchain backend for the DOIDO gift marketplace**

[About](#-about) · [Tech Stack](#-tech-stack) · [Structure](#-project-structure) · [Getting Started](#-getting-started) · [Environment Variables](#-environment-variables)

</div>

---

## 🦆 About

**DOIDO** is a peer-to-peer Telegram gift marketplace running as a Telegram Mini App. This repository contains the full backend — the REST API, the Telegram bot, the TON on-chain watchers, and the real-time WebSocket layer.

### Features

- 🎁 **Gift Marketplace** — list, unlist, buy, and transfer Telegram gifts with configurable fees
- 💎 **TON Deposits & Withdrawals** — on-chain watchers poll TonCenter and batch-process payouts via `WalletV5R1`
- 📊 **Leaderboard** — weekly & all-time rankings refreshed on a cron schedule
- 🔗 **Referral System** — tiered referral bonuses (standard users & influencers)
- 🔔 **Real-time Balance Updates** — Socket.IO pushes balance changes to connected clients
- 🛡️ **Security** — Helmet, CORS allow-list, Telegram `initData` HMAC auth, ban checks on sensitive routes
- 🤖 **Telegram Bot** — rate-limited, auto-retry Grammy bot with a `/start` flow and gift handlers

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Language** | TypeScript 5.8 (strict, ESM, `tsx`) |
| **HTTP Server** | Express 5 |
| **Telegram Bot** | Grammy 1 + webhook |
| **ORM** | TypeORM 0.3 + PostgreSQL |
| **Blockchain** | TON (`@ton/ton`, `@ton/core`, `@ton/crypto`) |
| **Real-time** | Socket.IO 4 |
| **Scheduling** | node-cron |
| **Auth** | Telegram `initData` HMAC verification |

---

## 📁 Project Structure

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
│   ├── notifications/
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

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL (no `synchronize` — run migrations manually)
- A Telegram bot token
- A TonCenter API key + deposit wallet

### Install

```bash
cd doido-backend
npm install
```

### Environment

```bash
cp .env.example .env
# fill in the values
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

> **Note:** Scheduled watchers (TON deposit/withdraw, leaderboard refresh, weekly volume reset) are disabled when `NODE_ENV=development` to avoid accidental on-chain transactions.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ☐ | HTTP server port (default `3000`) |
| `NODE_ENV` | ☐ | Runtime environment (`development` / `production`) |
| `TELEGRAM_BOT_TOKEN` | ✅ | Grammy bot token from [@BotFather](https://t.me/BotFather) |
| `BOT_WEBHOOK_URL` | ✅ | Public HTTPS URL for the Telegram webhook |
| `TELEGRAM_BUSINESS_CONNECTION_ID` | ✅ | Business connection ID for gift operations |
| `POSTGRES_HOST` | ✅ | PostgreSQL host |
| `POSTGRES_USER` | ✅ | PostgreSQL user |
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `POSTGRES_DB` | ✅ | PostgreSQL database name |
| `TON_DEPOSIT_WALLET_ADDRESS` | ✅ | Wallet address for receiving TON deposits |
| `TON_DEPOSIT_WALLET_SECRET_KEY` | ✅ | Secret key for the deposit wallet |
| `TON_WITHDRAW_WALLET_SECRET_KEY` | ✅ | Secret key for the withdrawal wallet |
| `TONCENTER_API_ENDPOINT` | ✅ | TonCenter API URL |
| `DEFAULT_FEE` | ☐ | Base marketplace fee (default `0.01`) |
| `REFERRAL_FEE` | ☐ | Referral bonus fraction (default `0.2`) |
| `GIFT_LISTING_FEE` | ☐ | Listing fee in TON after free listings (default `0.1`) |
| `GIFT_TRANSFER_FEE` | ☐ | Transfer fee in TON (default `0.1`) |
| `MIN_SELL_PRICE` | ☐ | Minimum listing price in TON (default `0.5`) |
| `MAX_SELL_PRICE` | ☐ | Maximum listing price in TON (default `50 000`) |
| `MIN_WITHDRAW_AMOUNT` | ☐ | Minimum withdrawal in TON (default `0.1`) |
| `MAX_WITHDRAW_AMOUNT` | ☐ | Maximum withdrawal in TON (default `50`) |

---

## 🔑 Architecture Notes

### Config — domain split

All configuration lives in `src/config/` and is split by concern. Each file reads env vars and exports typed constants. `config/index.ts` assembles and re-exports the full `config` object. `config/env.ts` is a side-effect module that must be imported first to call `dotenv.config()`.

### Request lifecycle

Requests flow through: CORS → Helmet → JSON body parser → `verifyTelegramAuth` (HMAC check) → route handler → controller (parses & validates input) → service (business logic + DB) → response. Error handling is centralised in `handleHttpError`.

### TON Watchers

Two scheduled workers run at configurable intervals:

- **Deposit watcher** — polls TonCenter for incoming transactions to the deposit wallet, credits user balances, and emits `balance_update` via Socket.IO.
- **Withdraw watcher** — scans pending withdrawal records, batches them into a single `WalletV5R1` transfer message, and marks records as processed.

Both watchers are skipped when `NODE_ENV=development`.

### Fee System

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

### Gift Data Model

Backdrop colors are stored as **hex strings** (`#RRGGBB`), converted from the Telegram API's RGB integer on ingestion. Rarity is stored as a **percentage** (`rarity_per_mille / 10`), e.g. `500‰ → 50.0%`.

### WebSocket

Connect with `?userId=<telegramId>`. The client is automatically joined to room `user_<userId>`.

| Event | Direction | Payload |
|-------|-----------|---------|
| `balance_update` | Server → Client | `{ ton_balance: number }` |

### API Reference

See [`API.md`](API.md) for the full endpoint reference with request/response shapes.

---

## 👤 Author

**Ihor Kliushnyk**
