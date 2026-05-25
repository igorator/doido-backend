# DOIDO API Reference

Base URL: `https://api.doido-market.com`

---

## Authentication

Protected routes require the header:

```
Authorization: Telegram <initData>
```

Where `<initData>` is the raw URL-encoded `window.Telegram.WebApp.initData` string from the Telegram Mini App.

---

## Users

### `POST /users/auth`
Authenticate and upsert a Telegram user. Returns the user object.

**Auth:** ✅ Required

**Response `200`**
```json
{
  "id": "123456789",
  "username": "johndoe",
  "first_name": "John",
  "ton_balance": 12.5,
  "referred_profit": 0.0,
  "is_admin": false,
  "is_banned": false,
  "is_influencer": false
}
```

---

### `PATCH /users/:id/referral`
Set a referrer for the user. Skipped if already set or if referrer = self.

**Auth:** ✅ Required

**Body**
```json
{ "referred_by": "987654321" }
```

**Response `200`** — updated user object, or `{ "skipped": true }` if referral was not applied.

---

## Gifts

### `GET /gifts`
List marketplace gifts with filtering, sorting, and pagination.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `collection` | `string \| string[]` | — | Filter by collection name(s) |
| `model` | `string \| string[]` | — | Filter by model name(s) |
| `backdrop` | `string \| string[]` | — | Filter by backdrop name(s) |
| `pattern` | `string \| string[]` | — | Filter by pattern name(s) |
| `min_price` | `number` | — | Min sell price (TON) |
| `max_price` | `number` | — | Max sell price (TON) |
| `sort` | `latest \| price_asc \| price_desc` | `latest` | Sort order |
| `gift_id` | `number` | — | Filter by gift number |
| `skip` | `number` | `0` | Pagination offset |
| `take` | `number` | `20` | Page size (max 100) |

**Response `200`**
```json
{
  "gifts": [ /* Gift[] */ ],
  "total": 342
}
```

---

### `GET /gifts/:gift_id`
Get a single listed gift by its ID.

**Response `200`** — Gift object. `404` if not found.

---

### `GET /gifts/user`
Get all gifts owned by the authenticated user.

**Auth:** ✅ Required

**Response `200`** — `Gift[]`

---

### `POST /gifts/buy`
Purchase one or more listed gifts.

**Auth:** ✅ Required | **Rate limited**

**Body**
```json
{ "gift_ids": ["abc123", "def456"] }
```

**Response `200`**
```json
{
  "success": true,
  "bought": ["abc123", "def456"],
  "updated_balance": 8.25,
  "external": false
}
```

> `external: true` means at least one gift requires an on-chain Telegram transfer (processed async after response).

**Errors:** `400` bad input · `402` insufficient balance · `409` gift no longer available

---

### `POST /gifts/is-in-stock`
Batch stock check before purchase. Returns availability and detects price changes.

**Body**
```json
{
  "gift_ids": [
    { "id": "abc123", "price": 1.5 }
  ]
}
```

**Response `200`**
```json
{ "success": true, "gifts": [ /* Gift[] */ ] }
```

**Response `409`** — some gifts unavailable or prices changed
```json
{
  "error": "Some gifts are not available for purchase",
  "unavailable": ["abc123"],
  "updated_prices": [{ "id": "def456", "new_price": 2.0 }]
}
```

---

### `PATCH /gifts/:gift_id/list`
List a gift for sale.

**Auth:** ✅ Required (must be owner)

**Body**
```json
{ "price": 1.5 }
```

> Price must be between `limits.minSellPrice` and `limits.maxSellPrice`. After `limits.maxFreeListings` uses, a listing fee is charged.

**Response `200`**
```json
{
  "id": "abc123",
  "collection_name": "DurovsCap",
  "number": 42,
  "status": "listed",
  "sell_price": 1.5,
  "sell_price_with_fee": 1.515,
  "listed_date": "2026-05-25T10:00:00.000Z",
  "free_listings_used": 1,
  "owner": { "id": "123456789", "username": "johndoe" }
}
```

---

### `PATCH /gifts/:gift_id/edit-price`
Update the sell price of a listed gift. Cooldown: 60 seconds between edits.

**Auth:** ✅ Required (must be owner)

**Body**
```json
{ "price": 2.0 }
```

**Response `200`** — updated Gift object. `429` if cooldown not elapsed.

---

### `PATCH /gifts/:gift_id/unlist`
Remove a gift from sale.

**Auth:** ✅ Required (must be owner)

**Response `200`** — updated Gift object.

---

### `POST /gifts/:gift_id/transfer`
Transfer a gift to another Telegram user. Charges `fees.giftTransfer` TON.

**Auth:** ✅ Required (must be owner) | **Rate limited**

**Body**
```json
{ "new_owner_id": "987654321" }
```

**Response `200`**
```json
{ "success": true }
```

---

### `GET /gifts/collections`
List of all gift collection names.

**Response `200`** — `string[]`

---

### `GET /gifts/backdrops`
All available backdrop names.

**Response `200`** — `string[]`

---

### `GET /gifts/patterns`
All available pattern names.

**Response `200`** — `string[]`

---

### `GET /gifts/models`
Model names grouped by collection.

**Query:** `?collection=DurovsCap&collection=CatHat`

**Response `200`** — `Record<string, string[]>`

---

## TON

### `POST /ton/deposit`
Generate a TON transfer payload for the user to send from their wallet.

**Auth:** ✅ Required | **Rate limited**

**Body**
```json
{ "amountTon": 5.0 }
```

**Response `200`**
```json
{ "transaction": { /* TON transaction payload */ } }
```

---

### `POST /ton/withdraw`
Request a TON withdrawal to an external wallet.

**Auth:** ✅ Required | **Rate limited**

**Body**
```json
{
  "amountTon": 2.0,
  "to": "EQD..."
}
```

> `to` must be a valid TON address. Amount must be within `limits.minWithdraw`–`limits.maxWithdraw`.

**Response `200`**
```json
{ "success": true, "withdrawId": 7 }
```

Withdrawal is processed async in the next batch cycle.

---

### `GET /ton/wallet-balance/:address`
Get the on-chain TON balance of any address.

**Response `200`**
```json
{ "balance": "12.543000000" }
```

---

### `GET /ton/deposit-withdraw-limits`
Returns current min/max deposit and withdrawal limits.

**Response `200`**
```json
{
  "minDeposit": 0.1,
  "maxDeposit": null,
  "minWithdraw": 0.1,
  "maxWithdraw": 50
}
```

---

## Pricing

### `GET /pricing/calculate`
Calculate buyer-pays or seller-receives given one side of the price.

**Query:** `?seller_price=1.5` or `?buyer_price=1.515`

**Response `200`**
```json
{
  "seller_price": 1.5,
  "buyer_pays": 1.515
}
```

---

### `GET /pricing/fees`
Returns the current fee configuration.

**Response `200`**
```json
{
  "marketPercent": 0.01,
  "sell": 0.01,
  "giftListing": 0.1,
  "giftTransfer": 0.1,
  "referralPercent": 0.2,
  "influencerReferralPercent": 0.01
}
```

---

### `GET /pricing/limits`
Returns min and max sell price limits.

**Response `200`**
```json
{
  "minSellPrice": 0.5,
  "maxSellPrice": 50000
}
```

---

## Activity

### `GET /activity/gifts`
Global gift sale feed (all users).

**Query:** `?skip=0&take=20`

**Response `200`** — `Activity[]`

---

### `GET /activity/gifts/:user_id`
Trade history for a specific user.

**Auth:** ✅ Required

**Response `200`** — `Activity[]`

---

## Leaderboard

### `GET /leaderboard/weekly`
Top 100 by weekly market volume + caller's rank.

**Response `200`**
```json
{
  "leaderboard": [ /* LeaderboardEntry[] */ ],
  "userRank": { "rank": 12, "amount": 45.5 }
}
```

---

### `GET /leaderboard/all-time`
Top 100 by all-time market volume + caller's rank.

**Response `200`** — same shape as weekly.

---

## Server

### `GET /server/status`
Liveness check.

**Response `200`**
```json
{ "status": "ok" }
```

---

### `GET /server/maintenance`
Returns whether the app is in maintenance mode.

**Response `200`**
```json
{ "isMaintenance": false }
```

---

## WebSocket

Connect to the WebSocket server with:

```
wss://api.doido-market.com?userId=<telegramId>
```

The client is automatically joined to room `user_<userId>`.

| Event | Direction | Payload |
|-------|-----------|---------|
| `balance_update` | Server → Client | `{ ton_balance: number }` |

---

## Error Format

All errors return JSON:

```json
{ "error": "Human-readable message" }
```

| Code | Meaning |
|------|---------|
| `400` | Bad request / validation error |
| `401` | Missing or invalid auth header |
| `402` | Insufficient TON balance |
| `403` | Forbidden (not your resource) |
| `404` | Not found |
| `409` | Conflict (e.g. gift already sold) |
| `429` | Rate limited or cooldown active |
| `500` | Internal server error |
