const allowedServices = new Map([
  ['cybersecurity', 'Cybersecurity'],
  ['software-development', 'Software Development'],
  ['cloud-solutions', 'Cloud Solutions'],
  ['ai-automation', 'AI & Automation'],
  ['data-analytics', 'Data Analytics'],
  ['education-mentorship', 'Education & Mentorship'],
  ['security-consulting-advisory', 'Security Consulting & Advisory'],
]);

const recipient = 'aevumtechnologiesltd@gmail.com';
const maxRequestBytes = 12_000;
const rateLimit = { limit: 5, windowMs: 60_000 };
const recentSubmissions = new Map();
const maxTrackedAddresses = 2_000;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function isValidEmail(value) {
  return value.length <= 254
    && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

function isValidPhone(value) {
  return !value || (
    value.length >= 7
    && value.length <= 30
    && /^\+?[0-9][0-9\s().-]{5,28}$/.test(value)
  );
}

function getSender(env) {
  const sender = typeof env.CONTACT_FROM_EMAIL === 'string' ? env.CONTACT_FROM_EMAIL.trim() : '';
  const address = sender.match(/<([^<>]+)>$/)?.[1] || sender;
  return sender.length <= 254 && !/[\r\n]/.test(sender) && isValidEmail(address) ? sender : '';
}

async function readLimitedBody(request) {
  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxRequestBytes) {
    return null;
  }

  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxRequestBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(body);
  } catch {
    return null;
  }
}

function checkRateLimit(address, now = Date.now()) {
  for (const [key, record] of recentSubmissions) {
    if (record.expiresAt <= now) recentSubmissions.delete(key);
  }

  let record = recentSubmissions.get(address);
  if (!record || record.expiresAt <= now) {
    if (recentSubmissions.size >= maxTrackedAddresses) {
      const oldestAddress = recentSubmissions.keys().next().value;
      if (oldestAddress) recentSubmissions.delete(oldestAddress);
    }
    record = { count: 0, expiresAt: now + rateLimit.windowMs };
    recentSubmissions.set(address, record);
  }

  record.count += 1;
  return record.count <= rateLimit.limit;
}

async function verifyTurnstile(token, secret, request) {
  const parameters = new URLSearchParams({
    secret,
    response: token,
  });
  const address = request.headers.get('CF-Connecting-IP');
  if (address) parameters.set('remoteip', address);

  let response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: parameters,
    });
  } catch {
    console.error('Turnstile verification request failed.');
    return 'unavailable';
  }

  if (!response.ok) {
    console.error('Turnstile verification returned an unsuccessful status.', response.status);
    return 'unavailable';
  }

  let result;
  try {
    result = await response.json();
  } catch {
    console.error('Turnstile verification returned an unreadable response.');
    return 'unavailable';
  }

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    console.error('Turnstile verification returned an invalid response.');
    return 'unavailable';
  }

  const hostname = new URL(request.url).hostname;
  return result.success === true && result.action === 'contact' && result.hostname === hostname
    ? 'verified'
    : 'invalid';
}

async function getConfiguration(env) {
  if (!env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !getSender(env)) {
    return jsonResponse({ error: 'Enquiry delivery is not configured.' }, 503);
  }
  return jsonResponse({ siteKey: env.TURNSTILE_SITE_KEY });
}

async function postContact({ request, env }) {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return jsonResponse({ error: 'This request could not be verified.' }, 403);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'Please submit the enquiry using the website form.' }, 415);
  }

  let bodyText;
  try {
    bodyText = await readLimitedBody(request);
  } catch {
    console.error('Could not read the contact request body.');
    return jsonResponse({ error: 'The enquiry could not be read. Please try again.' }, 400);
  }
  if (bodyText === null) {
    return jsonResponse({ error: 'Your enquiry is too large or could not be read. Please try again.' }, 413);
  }

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return jsonResponse({ error: 'The enquiry could not be read. Please check the form and try again.' }, 400);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return jsonResponse({ error: 'Please complete the enquiry form and try again.' }, 400);
  }

  if (typeof data.website === 'string' && data.website.trim()) {
    return jsonResponse({ message: 'Enquiry received.' });
  }

  const address = request.headers.get('CF-Connecting-IP');
  if (!address) {
    return jsonResponse({ error: 'This request could not be verified.' }, 403);
  }
  if (!checkRateLimit(address)) {
    return jsonResponse({ error: 'Too many enquiries have been sent. Please wait a minute and try again.' }, 429);
  }

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  const service = typeof data.service === 'string' ? data.service : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';

  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    return jsonResponse({ error: 'Please enter a valid name between 2 and 100 characters.' }, 400);
  }
  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Please enter a valid email address.' }, 400);
  }
  if (!isValidPhone(phone)) {
    return jsonResponse({ error: 'Please enter a valid phone number, or leave it blank.' }, 400);
  }
  if (!allowedServices.has(service)) {
    return jsonResponse({ error: 'Please select one of the listed services.' }, 400);
  }
  if (message.length < 10 || message.length > 3_000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)) {
    return jsonResponse({ error: 'Please enter a valid message between 10 and 3000 characters.' }, 400);
  }
  if (data.acknowledge !== true) {
    return jsonResponse({ error: 'Please accept the privacy acknowledgement before sending.' }, 400);
  }

  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) {
    console.error('Contact verification is not configured in Cloudflare Pages.');
    return jsonResponse({ error: 'Secure verification is not configured yet. Please contact us directly.' }, 503);
  }
  if (typeof data.turnstileToken !== 'string' || !data.turnstileToken.trim()) {
    return jsonResponse({ error: 'Please complete the security verification and try again.' }, 403);
  }

  const turnstileResult = await verifyTurnstile(data.turnstileToken, env.TURNSTILE_SECRET_KEY, request);
  if (turnstileResult === 'unavailable') {
    return jsonResponse({ error: 'Secure verification is temporarily unavailable. Please try again later.' }, 503);
  }
  if (turnstileResult !== 'verified') {
    return jsonResponse({ error: 'Security verification failed. Please try again.' }, 403);
  }

  const sender = getSender(env);
  if (!env.RESEND_API_KEY || !sender) {
    console.error('Contact email delivery is not configured in Cloudflare Pages.');
    return jsonResponse({ error: 'Email delivery is not configured yet. Please contact us directly.' }, 503);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || 'Not provided');
  const safeService = escapeHtml(allowedServices.get(service));
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || 'Not provided'}`,
    `Service: ${allowedServices.get(service)}`,
    '',
    message,
  ].join('\n');

  let providerResponse;
  try {
    providerResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: 'New Aevum website enquiry',
        text,
        html: `<h2>New website enquiry</h2><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Phone:</strong> ${safePhone}</p><p><strong>Service:</strong> ${safeService}</p><p><strong>Message:</strong><br>${safeMessage}</p>`,
      }),
    });
  } catch {
    console.error('Could not reach the email provider.');
    return jsonResponse({ error: 'We could not reach the email service. Please try again later.' }, 502);
  }

  if (!providerResponse.ok) {
    console.error('Email provider rejected the contact enquiry.', providerResponse.status);
    return jsonResponse({ error: 'The email service could not send your enquiry. Please try again later.' }, 502);
  }

  return jsonResponse({ message: 'Enquiry submitted.' });
}

export async function onRequest(context) {
  if (context.request.method === 'GET') return getConfiguration(context.env);
  if (context.request.method === 'POST') return postContact(context);
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}
