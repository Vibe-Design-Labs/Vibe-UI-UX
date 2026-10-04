import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {requestSuggestions, tokenDanceEndpoint} from '../public/client-byok.js';
import {translate} from '../dist/server/index.js';
const items = JSON.parse(await readFile(new URL('../dist/client/catalog.json', import.meta.url))).items;
const key = 'dummy-browser-key-never-sent-to-real-service';
const input = {items, key, intent: 'A soft glow', model: 'glm-5.2', locale: 'en', mode: 'direct'};
const suggestion = {candidates: [{id: 'cursor-spotlight', reason: 'Pointer glow'}]};
const output = () => Response.json({choices: [{message: {content: JSON.stringify(suggestion)}}]});

test('static BYOK sends the key only as Authorization to the fixed TokenDance endpoint', async () => {
  let calls = 0;
  const result = await requestSuggestions(input, async (url, options) => {
    calls++; assert.equal(url, tokenDanceEndpoint); assert.equal(options.headers.Authorization, 'Bearer ' + key);
    assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer');
    assert.equal(options.redirect, 'error'); assert.ok(!options.body.includes(key));
    return output();
  });
  assert.equal(calls, 1); assert.deepEqual(result, suggestion.candidates);
});

test('direct and relay modes use the identical model prompt and generation parameters', async () => {
  let directBody, relayBody;
  await requestSuggestions(input, async (_, options) => {directBody = JSON.parse(options.body); return output();});
  const request = new Request('https://intentkit.test/api/translate', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-TokenDance-Key': key}, body: JSON.stringify({intent: input.intent, model: input.model, locale: input.locale})});
  await translate(request, async (_, options) => {relayBody = JSON.parse(options.body); return output();});
  assert.deepEqual(directBody, relayBody);
});

test('static BYOK rejects an unknown endpoint mode or invalid input before any request', async () => {
  let calls = 0;
  for (const change of [{mode: 'https://untrusted.test'}, {key: ''}, {key: 'bad\nkey'}, {model: '../wrong model'}, {locale: 'unknown'}, {intent: 'x'.repeat(2001)}]) {
    await assert.rejects(requestSuggestions({...input, ...change}, async () => {calls++; return output();}), /input/);
  }
  assert.equal(calls, 0);
});

test('static BYOK rejects invented candidates, malformed output and reflected secrets', async () => {
  for (const content of ['not JSON', JSON.stringify({candidates: [{id: 'invented-renderer', reason: 'x'}]}), JSON.stringify({candidates: [{id: 'cursor-spotlight', reason: key}]})]) {
    await assert.rejects(requestSuggestions(input, async () => Response.json({choices: [{message: {content}}]})), /format/);
  }
});

test('static BYOK bounds gateway response size and sanitizes gateway errors', async () => {
  await assert.rejects(requestSuggestions(input, async () => new Response('x'.repeat(180001))), /format/);
  for (const [status, message] of [[401, 'auth'], [429, 'limit'], [404, 'model'], [503, 'network']]) {
    await assert.rejects(requestSuggestions(input, async () => new Response(key, {status})), e => e.message === message && !e.message.includes(key));
  }
  await assert.rejects(requestSuggestions(input, async () => {throw new TypeError(key);}), e => e.message === 'network');
});
