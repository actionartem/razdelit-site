import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContactServer } from './server.mjs';

const payload = () => ({ mode: 'message', name: 'Тест', contact: '@test', message: 'Кафе', id: crypto.randomUUID(), website: '' });
test('delivery, validation, CORS, duplicates, Telegram failure and rate limit', async () => {
  let calls = 0;
  let delivery = 'ok';
  const server = createContactServer({ token: 'test-token', chatId: '123', send: async (_, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.chat_id, '123');
    assert.ok(body.text.includes('Кафе'));
    if (delivery === 'timeout') throw new Error('timeout');
    return { ok: delivery === 'ok', json: async () => ({ ok: delivery === 'ok' }) };
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/razdelit/contact`;
  let ip = 1;
  const post = (body, origin = 'https://razdelit.ru', address = String(ip++)) => fetch(endpoint, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Real-IP': address }, body: JSON.stringify(body) });
  try {
    const p = payload();
    let response = await post(p);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://razdelit.ru');
    assert.equal((await post(p)).status, 200);
    assert.equal(calls, 1);
    assert.equal((await post({ ...p, message: 'changed' })).status, 409);
    assert.equal((await post(payload(), 'https://evil.example')).status, 403);
    assert.equal((await post({ ...payload(), mode: 'call', contact: '12' })).status, 400);
    assert.equal((await post({ ...payload(), message: '' })).status, 400);
    assert.equal((await post({ ...payload(), name: 'a'.repeat(81) })).status, 400);
    assert.equal((await post({ ...payload(), website: 'spam' })).status, 400);
    assert.equal((await post({ ...payload(), extra: 'a'.repeat(9000) })).status, 413);
    delivery = 'fail';
    assert.equal((await post(payload())).status, 502);
    delivery = 'timeout';
    const uncertain = payload();
    assert.equal((await post(uncertain)).status, 504);
    const before = calls;
    assert.equal((await post(uncertain)).status, 409);
    assert.equal(calls, before);
    for (let n = 0; n < 5; n++) assert.equal((await post({ ...payload(), name: '' }, undefined, 'rate')).status, 400);
    assert.equal((await post(payload(), undefined, 'rate')).status, 429);
    response = await fetch(endpoint, { method: 'OPTIONS', headers: { Origin: 'https://razdelit.ru' } });
    assert.equal(response.status, 204);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
