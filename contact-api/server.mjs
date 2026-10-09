import http from 'node:http';
import { pathToFileURL } from 'node:url';

const origins = new Set(['https://razdelit.ru', 'https://www.razdelit.ru', 'http://razdelit.ru', 'http://www.razdelit.ru', 'https://actionartem.github.io']);
export function createContactServer({ token, chatId, send = fetch, now = Date.now }) {
  const limits = new Map();
  const submissions = new Map();
  let globalWindow = { start: now(), count: 0 };
  const server = http.createServer({ maxHeaderSize: 8192 }, async (req, res) => {
    const reply = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    if (req.url === '/health' && req.method === 'GET') return reply(200, { ok: true });
    if (req.url !== '/razdelit/contact') return reply(404, { ok: false });
    const origin = req.headers.origin;
    if (!origins.has(origin)) return reply(403, { ok: false, error: 'origin' });
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
      res.writeHead(204); return res.end();
    }
    if (req.method !== 'POST') return reply(405, { ok: false });
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') return reply(415, { ok: false });
    const time = now();
    for (const [key, value] of limits) if (time - value.start > 600000) limits.delete(key);
    for (const [key, value] of submissions) if (time - value.time > 86400000) submissions.delete(key);
    const ip = req.headers['x-real-ip'] || req.socket.remoteAddress;
    const rate = limits.get(ip) || { start: time, count: 0 };
    if (time - rate.start > 600000) { rate.start = time; rate.count = 0; }
    if (time - globalWindow.start > 3600000) globalWindow = { start: time, count: 0 };
    if (++rate.count > 5 || globalWindow.count >= 100 || limits.size >= 5000 || submissions.size >= 5000) {
      res.setHeader('Retry-After', '600'); return reply(429, { ok: false, error: 'rate' });
    }
    limits.set(ip, rate);
    let raw = '';
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8192) return reply(413, { ok: false });
        chunks.push(chunk);
      }
      raw = Buffer.concat(chunks).toString('utf8');
      const data = JSON.parse(raw);
      const valid = (value, max, required = true) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
      if (!['call', 'message'].includes(data.mode) || !valid(data.name, 80) || !valid(data.contact, 100) || !valid(data.message, 1500, data.mode === 'message') || !/^[a-f0-9-]{36}$/.test(data.id || '')) return reply(400, { ok: false, error: 'fields' });
      if (data.mode === 'call' && !/^\d{10,15}$/.test(data.contact.replace(/\D/g, ''))) return reply(400, { ok: false, error: 'phone' });
      if (data.website) return reply(400, { ok: false });
      if (!token || !chatId) return reply(503, { ok: false });
      const key = data.id;
      const fingerprint = JSON.stringify([data.mode, data.name, data.contact, data.message]);
      const previous = submissions.get(key);
      if (previous) {
        if (previous.fingerprint !== fingerprint) return reply(409, { ok: false });
        return reply(previous.status === 'sent' ? 200 : 409, { ok: previous.status === 'sent', error: previous.status === 'sent' ? undefined : 'unconfirmed' });
      }
      submissions.set(key, { time, fingerprint, status: 'pending' });
      globalWindow.count++;
      const text = ['Новая заявка с razdelit.ru', data.mode === 'call' ? 'Просит перезвонить' : 'Хочет написать', 'Имя: ' + data.name.trim(), 'Контакт: ' + data.contact.trim(), data.message.trim(), 'Номер заявки: ' + key].filter(Boolean).join('\n\n');
      try {
        const response = await send('https://api.telegram.org/bot' + token + '/sendMessage', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
          signal: AbortSignal.timeout(8000)
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) {
          submissions.delete(key); return reply(502, { ok: false, error: 'delivery' });
        }
        submissions.get(key).status = 'sent';
        reply(200, { ok: true });
      } catch {
        submissions.get(key).status = 'unknown';
        reply(504, { ok: false, error: 'unconfirmed' });
      }
    } catch { reply(400, { ok: false, error: 'request' }); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxConnections = 64;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) throw new Error('Telegram configuration missing');
  const server = createContactServer({ token: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID });
  server.listen(19387, '127.0.0.1', () => console.log('Razdelit contact service ready'));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}
