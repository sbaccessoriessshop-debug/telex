// Wrapper to ensure correct working directory and APP_URL before starting the bot
process.chdir(__dirname);

if (process.env.REPLIT_DOMAINS) {
  const primaryDomain = process.env.REPLIT_DOMAINS.split(',')[0].trim();
  process.env.APP_URL = `https://${primaryDomain}`;
  console.log(`APP_URL set to: ${process.env.APP_URL}`);
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

require('./server.cjs');
