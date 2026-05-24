# TELES ADS Bot — Full Setup Guide

A Telegram bot SaaS for Forex/Crypto/Binary channel advertising.
Advertisers browse packages, place orders, and manage campaigns through the bot.
Admins manage channels, plans, payments, and delivery via the admin panel.

---

## Quick Start (Remix / Duplicate)

### 1. Create a new Telegram Bot
- Open [@BotFather](https://t.me/BotFather) on Telegram
- Send `/newbot` and follow the steps
- Copy the **Bot Token** you receive

### 2. Set Environment Variables

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Any random long string (e.g. `my-super-secret-123`) |
| `APP_URL` | Your deployed app URL (e.g. `https://yourapp.replit.app`) |

### 3. Install Dependencies
```bash
npm install
```

### 4. Set Up the Database
Run this once to create all tables:
```bash
node setup-db.js
```

### 5. Start the Bot
```bash
node start.js
```

### 6. Register the Webhook
After the server is running:
```bash
node setup-webhook.js
```

---

## Rename the Bot (e.g. "Telegram Ad AI")

### Step 1 — Telegram (via BotFather)
- `/setname` → New display name (e.g. `Telegram Ad AI`)
- `/setuserpic` → Upload new logo
- `/setdescription` → Update description
- `/setabouttext` → Update about text

### Step 2 — HTML Files (`public/` folder)
Search and replace `TELES ADS` and `TELES AI` with your new bot name in:
- `public/index.html`
- `public/place-order.html`
- `public/admin-orders.html`
- `public/admin-packages.html`
- `public/admin-market.html`
- `public/analytics.html`
- `public/user-dashboard.html`

### Step 3 — Admin Telegram ID
Find and replace `7049127887` with your own Telegram ID in all HTML files.
(Find your ID via [@userinfobot](https://t.me/userinfobot))

### Step 4 — Agency Channel
In `public/index.html`, find `@telesads` and replace with your channel handle.

### Step 5 — USDT Payment Wallets
In `public/place-order.html`, replace:
- TRC20: `TDhNivo7HsfKu2jmxyjKBWXgkR9pn8dJPf`
- BEP20: `0x0fa48b8d8379e1ac7f6b8c5cff3d8d8c419492a9`

---

## File Structure

```
├── server.cjs                  ← Main bot server (compiled bundle, do not edit)
├── start.js                    ← Entry point (sets APP_URL, starts server)
├── setup-webhook.js            ← Registers Telegram webhook
├── setup-db.js                 ← Creates database tables
├── package.json                ← Dependencies (run: npm install)
└── public/
    ├── index.html              ← Main bot mini app (React SPA)
    ├── place-order.html        ← Payment gateway page
    ├── admin-orders.html       ← Admin: manage orders & delivery
    ├── admin-packages.html     ← Admin: set member targets per package
    ├── admin-market.html       ← Admin: manage market channels
    ├── analytics.html          ← Analytics dashboard
    ├── user-dashboard.html     ← User dashboard
    ├── compare.html            ← Channel comparison page
    ├── promo-codes.html        ← Promo code management
    ├── invoice.html            ← Invoice generator
    ├── settings.html           ← Bot settings
    ├── images/                 ← Logos and avatars
    └── assets/                 ← Compiled React JS/CSS (do not edit)
```

---

## Bot Commands (Telegram)

**User Commands:**
- `/start` — Open the bot platform

**Admin Commands:**
- `/teles` — Open admin panel
- `/broadcast <message>` — Send message to all users

---

## Payment Wallets (default — change to yours)

- **USDT TRC20:** `TDhNivo7HsfKu2jmxyjKBWXgkR9pn8dJPf`
- **USDT BEP20:** `0x0fa48b8d8379e1ac7f6b8c5cff3d8d8c419492a9`

---

## Deploy on Replit

1. Create a new Replit project and upload this folder
2. Add secrets: `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, `SESSION_SECRET`
3. Run: `node setup-db.js` (once)
4. Set run command: `node start.js`
5. Deploy — webhook registers automatically on startup

## Deploy on Railway

1. Push to GitHub, connect repo to [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Set env vars in Railway dashboard
4. Run: `node setup-db.js` in Railway shell
5. Run: `APP_URL=https://your-app.up.railway.app node setup-webhook.js`

---

*Built with Express.js, React, PostgreSQL, and the Telegram Bot API.*
