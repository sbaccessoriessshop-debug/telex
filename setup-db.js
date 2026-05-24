#!/usr/bin/env node
/**
 * TELES ADS — Database Setup Script
 * Run: node setup-db.js
 * Requires: DATABASE_URL environment variable
 */
const pg = require("pg");
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT,
  photo_url TEXT,
  language_code TEXT,
  channel_link TEXT,
  trading_category TEXT,
  referred_by BIGINT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  link TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  subscribers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  subscribers INTEGER NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  network TEXT,
  wallet_address TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  delivered_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP,
  verified_by INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_subscribers INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  reply TEXT,
  replied_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  rank INTEGER NOT NULL,
  channel_name TEXT NOT NULL,
  handle TEXT NOT NULL,
  growth INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  package_name TEXT NOT NULL,
  channel_link TEXT NOT NULL,
  audience TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  members_delivered INTEGER NOT NULL DEFAULT 0,
  members_target INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  target_country TEXT,
  delivery_speed TEXT,
  payment_proof TEXT,
  order_notes TEXT,
  channel_username TEXT,
  promo_code TEXT,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  members TEXT NOT NULL DEFAULT '0',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  popular BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  category TEXT,
  members INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_campaigns_telegram_id ON campaigns(telegram_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
`;

const SEED_PLANS = [
  { code: "starter",  name: "Starter",  price:  19.00, subscribers:   500, duration_days: 30, features: ["500 real subscribers","Forex/Crypto/Binary niche","Delivery in 24-72h","Basic support"] },
  { code: "growth",   name: "Growth",   price:  49.00, subscribers:  1500, duration_days: 30, features: ["1500 real subscribers","Targeted niche","Delivery in 24-72h","Priority support"] },
  { code: "pro",      name: "Pro",      price:  99.00, subscribers:  3500, duration_days: 30, features: ["3500 real subscribers","Premium targeting","Delivery in 24-48h","Priority support","Replacement guarantee"] },
  { code: "elite",    name: "Elite",    price: 199.00, subscribers:  8000, duration_days: 30, features: ["8000 real subscribers","Premium targeting","Delivery in 24h","24/7 support","Replacement guarantee","Personal manager"] },
  { code: "ultimate", name: "Ultimate", price: 399.00, subscribers: 18000, duration_days: 30, features: ["18000 real subscribers","Premium targeting","Express delivery","VIP support","Replacement guarantee","Personal manager","Free re-engagement boost"] }
];

const SEED_SETTINGS = [
  { key: "wallet_usdt_trc20", value: "TDhNivo7HsfKu2jmxyjKBWXgkR9pn8dJPf", description: "USDT TRC20 receive wallet" },
  { key: "wallet_usdt_bep20", value: "0x0fa48b8d8379e1ac7f6b8c5cff3d8d8c419492a9", description: "USDT BEP20 receive wallet" },
  { key: "agency_link", value: "https://t.me/TelesAds", description: "Public agency Telegram link" },
  { key: "referral_bonus", value: "50", description: "Bonus subscribers per successful referral" },
  { key: "min_withdrawal", value: "10", description: "Minimum withdrawal amount in USDT" }
];

async function main() {
  console.log("⏳ Connecting to database...");
  await pool.query("SELECT 1");
  console.log("✅ Connected.");

  console.log("⏳ Creating schema...");
  await pool.query(SQL);
  console.log("✅ Schema ready.");

  console.log("⏳ Seeding plans...");
  for (const p of SEED_PLANS) {
    await pool.query(
      `INSERT INTO plans (code, name, price, subscribers, duration_days, features)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)
       ON CONFLICT (code) DO UPDATE SET
         name=EXCLUDED.name, price=EXCLUDED.price, subscribers=EXCLUDED.subscribers,
         duration_days=EXCLUDED.duration_days, features=EXCLUDED.features`,
      [p.code, p.name, p.price, p.subscribers, p.duration_days, JSON.stringify(p.features)]
    );
  }
  console.log(`✅ Seeded ${SEED_PLANS.length} plans.`);

  console.log("⏳ Seeding settings...");
  for (const s of SEED_SETTINGS) {
    await pool.query(
      `INSERT INTO settings (key, value, description)
       VALUES ($1,$2,$3)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, description=EXCLUDED.description, updated_at=NOW()`,
      [s.key, s.value, s.description]
    );
  }
  console.log(`✅ Seeded ${SEED_SETTINGS.length} settings.`);

  await pool.end();
  console.log("🎉 Done.");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
