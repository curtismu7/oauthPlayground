/**
 * Real credentials integration test
 * Tests actual PingOne API calls using the worker token flow
 */
import { readFileSync } from 'node:fs';

// Parse .env.local manually
const envContent = readFileSync('/Users/cmuir/P1Import-apps/oauth-playground/.env.local', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq > 0) {
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    process.env[key] = val;
  }
}

const BASE = 'https://localhost:3001';

async function api(path, opts = {}) {
  const fetch = (await import('node-fetch')).default;
  const { Agent } = await import('node:https');
  const agent = new Agent({ rejectUnauthorized: false });
  const r = await fetch(BASE + path, { agent, ...opts });
  const ct = r.headers.get('content-type') || '';
  const body = ct.includes('json') ? await r.json() : await r.text();
  return { status: r.status, ok: r.ok, body };
}

const pass = (label, detail='') => console.log(`✅ ${label}${detail ? ' | ' + detail : ''}`);
const fail = (label, detail='') => console.log(`❌ ${label}${detail ? ' | ' + detail : ''}`);

const ENV_ID    = process.env.PINGONE_ENVIRONMENT_ID;
const CLIENT_ID = process.env.PINGONE_CLIENT_ID;
const CLIENT_SECRET = process.env.PINGONE_CLIENT_SECRET;

console.log('\n🔑 Real PingOne Credentials Test Suite\n');
console.log(`  Environment: ${ENV_ID}`);
console.log(`  Worker Client: ${CLIENT_ID}`);
console.log('');

let testsPassed = 0, testsFailed = 0;

// 1. Health check
{
  const r = await api('/api/health');
  if (r.ok) { pass('Health check'); testsPassed++; }
  else { fail('Health check', r.status); testsFailed++; }
}

// 2. Get real worker token from PingOne via server proxy
let workerToken = null;
{
  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString();

  const r = await api('/api/pingone/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environment_id: ENV_ID,
      region: 'us',
      body: tokenBody,
      auth_method: 'client_secret_post',
    }),
  });
  if (r.ok && r.body?.access_token) {
    workerToken = r.body.access_token;
    pass('Worker token from PingOne (real)', `expires_in: ${r.body.expires_in}s, scope: ${r.body.scope || '(none)'}`);
    testsPassed++;
  } else {
    fail('Worker token from PingOne', `${r.status}: ${JSON.stringify(r.body).slice(0, 150)}`);
    testsFailed++;
  }
}

// 3. OIDC Discovery (POST) — needs issuerUrl
{
  const issuerUrl = `https://auth.pingone.com/${ENV_ID}/as`;
  const r = await api('/api/pingone/oidc-discovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issuerUrl }),
  });
  if (r.ok && r.body?.issuer) {
    pass('OIDC Discovery', `issuer: ${r.body.issuer}`);
    testsPassed++;
  } else {
    fail('OIDC Discovery', `${r.status}: ${JSON.stringify(r.body).slice(0, 100)}`);
    testsFailed++;
  }
}

// 4. Search users via server proxy — needs accessToken + identifier
if (workerToken) {
  const r = await api('/api/pingone/users/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environmentId: ENV_ID,
      accessToken: workerToken,
      identifier: 'user',
    }),
  });
  if (r.ok) {
    const users = r.body?.users || r.body?._embedded?.users || [];
    pass('PingOne users lookup (real)', `${users.length} user(s) returned`);
    testsPassed++;
  } else if (r.status === 404) {
    // 404 from PingOne = no matching user, but credentials + proxy work fine
    pass('PingOne users lookup (real)', `authenticated — PingOne 404: ${r.body?.error_description?.slice(0, 60)}`);
    testsPassed++;
  } else if (r.status === 401 || r.status === 403) {
    fail('PingOne users lookup', `${r.status} – scope issue`);
    testsFailed++;
  } else {
    fail('PingOne users lookup', `${r.status}: ${JSON.stringify(r.body).slice(0, 150)}`);
    testsFailed++;
  }
} else {
  console.log('⏭️  Skipping PingOne users test (no token)');
}

// 5. Token introspection via server (needs introspection_endpoint)
if (workerToken) {
  const introspectionEndpoint = `https://auth.pingone.com/${ENV_ID}/as/introspect`;
  const r = await api('/api/introspect-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: workerToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      introspection_endpoint: introspectionEndpoint,
      token_auth_method: 'client_secret_post',
    }),
  });
  if (r.ok) {
    pass('Token introspect (real)', `active: ${r.body?.active ?? r.body?.sub ? 'true' : '?'}`);
    testsPassed++;
  } else {
    fail('Token introspect', `${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    testsFailed++;
  }
}

// 6. Client Credentials flow (full proxied flow)
{
  const r = await api('/api/client-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environment_id: ENV_ID,
      auth_method: 'client_secret_post',
      body: { grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
    }),
  });
  if (r.ok && r.body?.access_token) {
    pass('Client Credentials flow', `token_type: ${r.body.token_type}`);
    testsPassed++;
  } else {
    fail('Client Credentials flow', `${r.status}: ${JSON.stringify(r.body).slice(0, 150)}`);
    testsFailed++;
  }
}

// 7. Settings: environment-id is stored correctly
{
  const r = await api('/api/settings/environment-id');
  const val = r.body?.value || r.body;
  if (r.ok && val?.includes(ENV_ID)) {
    pass('Settings: environment-id', `stored correctly`);
    testsPassed++;
  } else {
    fail('Settings: environment-id', `${r.status}: ${JSON.stringify(r.body).slice(0, 60)}`);
    testsFailed++;
  }
}

// 8. Playground JWKS
{
  const r = await api('/api/playground-jwks');
  if (r.ok && r.body?.keys?.length > 0) {
    pass('Playground JWKS', `${r.body.keys.length} key(s)`);
    testsPassed++;
  } else {
    fail('Playground JWKS', `${r.status}`);
    testsFailed++;
  }
}

console.log(`\n${'='.repeat(55)}`);
const icon = testsFailed === 0 ? '🎉' : '⚠️ ';
console.log(`${icon} Results: ${testsPassed} passed, ${testsFailed} failed out of ${testsPassed + testsFailed} tests`);
console.log('='.repeat(55));
