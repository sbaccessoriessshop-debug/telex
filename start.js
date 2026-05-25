// Wrapper to ensure correct working directory and APP_URL before starting the bot
process.chdir(__dirname);

if (process.env.REPLIT_DOMAINS) {
  const primaryDomain = process.env.REPLIT_DOMAINS.split(',')[0].trim();
  process.env.APP_URL = `https://${primaryDomain}`;
  console.log(`APP_URL set to: ${process.env.APP_URL}`);
}

/* ── Auto-create missing tables on startup ── */
async function ensureTables() {
  if (!process.env.DATABASE_URL) return;
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_pct INTEGER NOT NULL DEFAULT 10,
        max_uses INTEGER,
        uses_count INTEGER NOT NULL DEFAULT 0,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT,
        package_name TEXT NOT NULL,
        channel_link TEXT NOT NULL,
        audience TEXT NOT NULL DEFAULT 'General',
        target_country TEXT NOT NULL DEFAULT 'Worldwide',
        delivery_speed TEXT NOT NULL DEFAULT 'Standard',
        order_notes TEXT,
        channel_username TEXT,
        payment_proof TEXT,
        promo_code TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        members_delivered INTEGER NOT NULL DEFAULT 0,
        members_target INTEGER NOT NULL DEFAULT 0,
        reach INTEGER NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        original_price NUMERIC(10,2),
        discount_pct INTEGER NOT NULL DEFAULT 0,
        network TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        members TEXT NOT NULL DEFAULT '',
        features TEXT NOT NULL DEFAULT '[]',
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        original_price NUMERIC(10,2),
        popular BOOLEAN NOT NULL DEFAULT false,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT,
        campaign_id INTEGER,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        channel_name TEXT NOT NULL,
        handle TEXT,
        growth INTEGER NOT NULL DEFAULT 0,
        rank INTEGER NOT NULL DEFAULT 0,
        period TEXT NOT NULL DEFAULT 'This Month',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        telegram_username TEXT,
        channel_link TEXT,
        budget TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        notes TEXT,
        source TEXT NOT NULL DEFAULT 'website',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER,
        full_name TEXT NOT NULL,
        telegram_username TEXT,
        channel_link TEXT,
        monthly_budget TEXT,
        preferred_date TEXT,
        preferred_time TEXT,
        meeting_platform TEXT NOT NULL DEFAULT 'telegram',
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        reply TEXT,
        replied_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await pool.end();
    console.log('✅ Database tables verified/created.');
  } catch (err) {
    console.error('⚠️  DB table check failed (non-fatal):', err.message);
  }
}

/* ── Inject /api/admin/send-receipt before server.cjs loads ── */
const http = require('http');
const _origCreate = http.createServer.bind(http);

http.createServer = function (handler) {
  const wrapped = async function (req, res) {
    if (req.method === 'POST' && req.url === '/api/admin/send-receipt') {
      let raw = '';
      req.on('data', chunk => { raw += chunk; });
      req.on('end', async () => {
        try {
          const { telegramId, orderId, packageName, channelLink, price, network, currency } = JSON.parse(raw || '{}');
          const token = process.env.TELEGRAM_BOT_TOKEN;
          if (token && telegramId) {
            const net  = network  || currency || 'USDT';
            const lines = [
              '✅ <b>Payment Approved!</b>',
              '',
              '📦 <b>Package:</b> ' + (packageName || 'N/A'),
              '📢 <b>Channel:</b> ' + (channelLink  || 'N/A'),
              '💰 <b>Amount Paid:</b> $' + (price || '0') + ' ' + net,
              '🆔 <b>Order ID:</b> #' + (orderId || 'N/A'),
              '',
              '🚀 Your campaign is now <b>active</b>.',
              'We will keep you updated on delivery progress.',
              '',
              'Thank you for choosing <b>TELES ADS</b> 🎯'
            ].join('\n');

            await fetch(
              'https://api.telegram.org/bot' + token + '/sendMessage',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: telegramId, text: lines, parse_mode: 'HTML' })
              }
            ).catch(() => {});
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }
    handler(req, res);
  };

  return _origCreate(wrapped);
};

/* ── Boot ── */
ensureTables().then(() => {
  require('./server.cjs');
});
