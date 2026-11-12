import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from './contact.js';

const endpoint = 'https://aevum.test/api/contact';
const validPayload = {
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  phone: '+234 807 991 2429',
  service: 'software-development',
  message: 'I would like to discuss a website project.',
  acknowledge: true,
  turnstileToken: 'valid-turnstile-token',
};
const env = {
  RESEND_API_KEY: 'test-resend-key',
  CONTACT_FROM_EMAIL: 'Aevum <contact@example.test>',
  TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
  TURNSTILE_SITE_KEY: 'test-turnstile-site-key',
};

function contactRequest(payload, address = '192.0.2.1') {
  return new Request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: new URL(endpoint).origin,
      'CF-Connecting-IP': address,
    },
    body: JSON.stringify(payload),
  });
}

function turnstileResponse({ success = true, action = 'contact', hostname = 'aevum.test' } = {}) {
  return new Response(JSON.stringify({ success, action, hostname }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function installFetchMock(t, handler) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
}

test('accepts a valid enquiry and sends it to the fixed recipient', async (t) => {
  const requests = [];
  installFetchMock(t, async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes('/siteverify')) return turnstileResponse();
    return new Response('{"id":"test-email-id"}', { status: 200 });
  });

  const response = await onRequest({ request: contactRequest(validPayload, '192.0.2.11'), env });
  const result = await response.json();
  const emailRequest = requests.find(({ url }) => url.includes('api.resend.com'));
  const email = JSON.parse(emailRequest.options.body);

  assert.equal(response.status, 200);
  assert.equal(result.message, 'Enquiry submitted.');
  assert.deepEqual(email.to, ['aevumtechnologiesltd@gmail.com']);
  assert.equal(email.reply_to, validPayload.email);
  assert.match(email.text, /I would like to discuss a website project/);
});

test('rejects invalid email addresses', async () => {
  const response = await onRequest({
    request: contactRequest({ ...validPayload, email: 'not-an-email' }, '192.0.2.12'),
    env,
  });
  assert.equal(response.status, 400);
});

test('rejects missing required fields', async () => {
  const { message, ...payload } = validPayload;
  const response = await onRequest({ request: contactRequest(payload, '192.0.2.13'), env });
  assert.equal(response.status, 400);
});

test('rejects unlisted services', async () => {
  const response = await onRequest({
    request: contactRequest({ ...validPayload, service: 'other' }, '192.0.2.14'),
    env,
  });
  assert.equal(response.status, 400);
});

test('rejects invalid phone numbers and too-short messages', async () => {
  const invalidPhone = await onRequest({
    request: contactRequest({ ...validPayload, phone: 'call me' }, '192.0.2.21'),
    env,
  });
  const invalidMessage = await onRequest({
    request: contactRequest({ ...validPayload, message: 'Too short' }, '192.0.2.22'),
    env,
  });
  assert.equal(invalidPhone.status, 400);
  assert.equal(invalidMessage.status, 400);
});

test('rejects request bodies over the configured size limit', async () => {
  const response = await onRequest({
    request: contactRequest({ ...validPayload, message: 'x'.repeat(13_000) }, '192.0.2.23'),
    env,
  });
  assert.equal(response.status, 413);
});

test('silently accepts a honeypot submission without contacting providers', async (t) => {
  installFetchMock(t, async () => {
    assert.fail('A honeypot submission must not contact a provider.');
  });
  const response = await onRequest({
    request: contactRequest({ ...validPayload, website: 'bot-filled-value' }, '192.0.2.15'),
    env,
  });
  assert.equal(response.status, 200);
});

test('rejects failed Turnstile verification', async (t) => {
  installFetchMock(t, async () => turnstileResponse({ success: false }));
  const response = await onRequest({
    request: contactRequest(validPayload, '192.0.2.16'),
    env,
  });
  assert.equal(response.status, 403);
});

test('applies an isolate-level rate limit after five requests per minute', async (t) => {
  installFetchMock(t, async () => turnstileResponse({ success: false }));
  const address = '192.0.2.17';
  const responses = [];
  for (let index = 0; index < 6; index += 1) {
    responses.push(await onRequest({ request: contactRequest(validPayload, address), env }));
  }
  assert.deepEqual(responses.map(({ status }) => status), [403, 403, 403, 403, 403, 429]);
});

test('reports provider failures without returning provider details', async (t) => {
  installFetchMock(t, async (url) => {
    if (String(url).includes('/siteverify')) return turnstileResponse();
    return new Response('private provider error', { status: 500 });
  });
  const response = await onRequest({
    request: contactRequest(validPayload, '192.0.2.18'),
    env,
  });
  const result = await response.json();
  assert.equal(response.status, 502);
  assert.doesNotMatch(JSON.stringify(result), /private provider error/);
});

test('rejects cross-origin requests', async () => {
  const request = new Request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://attacker.example',
      'CF-Connecting-IP': '192.0.2.19',
    },
    body: JSON.stringify(validPayload),
  });
  const response = await onRequest({ request, env });
  assert.equal(response.status, 403);
});

test('serves only the public Turnstile site key from the configuration endpoint', async () => {
  const response = await onRequest({
    request: new Request(endpoint),
    env,
  });
  const config = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(config, { siteKey: env.TURNSTILE_SITE_KEY });
  assert.equal(JSON.stringify(config).includes(env.TURNSTILE_SECRET_KEY), false);
});

test('does not advertise the form as ready when credentials are missing', async () => {
  const { RESEND_API_KEY, ...incompleteEnv } = env;
  const response = await onRequest({
    request: new Request(endpoint),
    env: incompleteEnv,
  });
  assert.equal(response.status, 503);
});
