// בדיקת עשן לקבצי ה־Pages Functions של Cloudflare. בלי Cloudflare ובלי רשת: ה־fetch של גוגל מדומה.
// דורש Node 20 ומעלה. שימוש: node scripts/test-cloudflare-functions.mjs [תיקיית הפרויקט]
// בלי ארגומנט בודק את assets/cloudflare שבתוך הסקיל. עם ארגומנט בודק את הפרויקט שנבנה (התיקייה שמכילה functions/ ו־lib/).
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || path.join(here, '..', 'assets', 'cloudflare'));
const load = (p) => import(pathToFileURL(path.join(root, p)).href);

const BASE = 'https://dash.pages.dev';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const H = { 'X-Requested-With': 'dashboard' };
const env = { GOOGLE_CLIENT_ID: 'cid.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'sec', SESSION_SECRET: 'test-secret-value' };

// fetch מדומה: googleReply קובע מה "גוגל" עונה, calls שומר מה נשלח אליה.
const calls = [];
let googleReply = () => ({ body: {} });
globalThis.fetch = async (url, opt) => {
  calls.push({ url: String(url), body: opt && opt.body ? String(opt.body) : '' });
  const r = googleReply(String(url));
  return new Response(JSON.stringify(r.body), { status: r.status || 200 });
};

const call = (mod, url, init, e) => mod.onRequest({ request: new Request(BASE + url, init), env: e || env });
const setCookies = (res) => res.headers.getSetCookie();
const cookieOf = (res, name) => setCookies(res).find((c) => c.startsWith(name + '='));
const valueOf = (c) => c.split(';')[0].split('=').slice(1).join('=');
const withSession = (value) => ({ ...H, cookie: 'dd_session=' + value });

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + (e && e.message)); }
}

const config = await load('functions/api/config.js');
const login = await load('functions/api/auth/login.js');
const callback = await load('functions/api/auth/callback.js');
const token = await load('functions/api/auth/token.js');
const logout = await load('functions/api/auth/logout.js');

let session; // ערך עוגיית ההתחברות שנוצרת בבדיקת callback ונעשה בה שימוש בהמשך

await test('config מחזיר את ה־clientId', async () => {
  const res = await call(config, '/api/config');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).clientId, env.GOOGLE_CLIENT_ID);
});

await test('login מפנה לגוגל עם state שזהה לעוגייה', async () => {
  const res = await call(login, '/api/auth/login');
  assert.equal(res.status, 302);
  const u = new URL(res.headers.get('location'));
  assert.equal(u.origin + u.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(u.searchParams.get('client_id'), env.GOOGLE_CLIENT_ID);
  assert.equal(u.searchParams.get('redirect_uri'), BASE + '/api/auth/callback');
  assert.equal(u.searchParams.get('scope'), SCOPE);
  assert.equal(u.searchParams.get('access_type'), 'offline');
  const c = cookieOf(res, 'dd_state');
  assert.ok(c, 'חסרה עוגיית state');
  assert.equal(valueOf(c), u.searchParams.get('state'));
  assert.match(c, /HttpOnly/);
  assert.match(c, /Secure/);
});

await test('token דוחה בקשה בלי הכותרת, בשיטה שגויה ובלי התחברות', async () => {
  assert.equal((await call(token, '/api/auth/token')).status, 400);
  assert.equal((await call(token, '/api/auth/token', { method: 'POST', headers: H })).status, 400);
  assert.equal((await call(token, '/api/auth/token', { headers: H })).status, 401);
});

await test('callback עם state שגוי או שגיאה מגוגל חוזר עם autherror', async () => {
  let res = await call(callback, '/api/auth/callback?state=bad&code=x', { headers: { cookie: 'dd_state=other' } });
  assert.equal(res.headers.get('location'), '/?autherror=state');
  res = await call(callback, '/api/auth/callback?error=access_denied');
  assert.equal(res.headers.get('location'), '/?autherror=access_denied');
});

await test('callback חסר scope או refresh_token נדחה', async () => {
  const init = { headers: { cookie: 'dd_state=abc' } };
  googleReply = () => ({ body: { refresh_token: 'RT1', scope: 'openid' } });
  assert.equal((await call(callback, '/api/auth/callback?state=abc&code=x', init)).headers.get('location'), '/?autherror=missing_scope');
  googleReply = () => ({ body: { scope: SCOPE } });
  assert.equal((await call(callback, '/api/auth/callback?state=abc&code=x', init)).headers.get('location'), '/?autherror=no_refresh_token');
});

await test('callback תקין שומר עוגייה מוצפנת ל־60 יום בלי לחשוף את אסימון הרענון', async () => {
  calls.length = 0;
  googleReply = () => ({ body: { refresh_token: 'RT1', scope: SCOPE } });
  const res = await call(callback, '/api/auth/callback?state=abc&code=xyz', { headers: { cookie: 'dd_state=abc' } });
  assert.equal(res.headers.get('location'), '/');
  const c = cookieOf(res, 'dd_session');
  assert.ok(c, 'חסרה עוגיית התחברות');
  assert.match(c, /Max-Age=5184000/);
  assert.match(c, /HttpOnly/);
  session = valueOf(c);
  assert.ok(!session.includes('RT1') && !decodeURIComponent(session).includes('RT1'));
  assert.match(calls[0].body, /grant_type=authorization_code/);
  assert.match(calls[0].body, /code=xyz/);
  assert.match(cookieOf(res, 'dd_state'), /Max-Age=0/);
});

await test('token עם התחברות מחזיר אסימון גישה ומחדש את העוגייה', async () => {
  calls.length = 0;
  googleReply = () => ({ body: { access_token: 'AT', expires_in: 3599 } });
  const res = await call(token, '/api/auth/token', { headers: withSession(session) });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { access_token: 'AT', expires_in: 3599 });
  assert.match(calls[0].body, /grant_type=refresh_token/);
  assert.match(calls[0].body, /refresh_token=RT1/);
  assert.match(cookieOf(res, 'dd_session'), /Max-Age=5184000/);
});

await test('token כש־invalid_grant מוחק את העוגייה', async () => {
  googleReply = () => ({ status: 400, body: { error: 'invalid_grant' } });
  const res = await call(token, '/api/auth/token', { headers: withSession(session) });
  assert.equal(res.status, 401);
  assert.match(cookieOf(res, 'dd_session'), /Max-Age=0/);
});

await test('token כשגוגל נכשלת מחזיר 502 ולא מוחק את ההתחברות', async () => {
  googleReply = () => ({ status: 500, body: { error: 'backend_error' } });
  const res = await call(token, '/api/auth/token', { headers: withSession(session) });
  assert.equal(res.status, 502);
  assert.equal(cookieOf(res, 'dd_session'), undefined);
});

await test('עוגייה מקולקלת או מסוד אחר נחשבת לא מחוברת', async () => {
  assert.equal((await call(token, '/api/auth/token', { headers: withSession(session.slice(0, -4) + 'AAAA') })).status, 401);
  const res = await call(token, '/api/auth/token', { headers: withSession(session) }, { ...env, SESSION_SECRET: 'another-secret' });
  assert.equal(res.status, 401);
});

await test('SESSION_SECRET חסר נכשל בקול (500) ולא נראה כהתנתקות', async () => {
  const res = await call(token, '/api/auth/token', { headers: withSession(session) }, { ...env, SESSION_SECRET: '' });
  assert.equal(res.status, 500);
});

await test('logout מבטל את האסימון בגוגל ומוחק את העוגייה', async () => {
  calls.length = 0;
  googleReply = () => ({ body: {} });
  assert.equal((await call(logout, '/api/auth/logout', { headers: H })).status, 400); // GET נדחה
  const res = await call(logout, '/api/auth/logout', { method: 'POST', headers: withSession(session) });
  assert.equal(res.status, 200);
  assert.match(cookieOf(res, 'dd_session'), /Max-Age=0/);
  assert.ok(calls.some((c) => c.url.includes('/revoke') && c.body.includes('token=RT1')), 'לא נשלחה בקשת ביטול לגוגל');
});

console.log(`\n${passed} עברו, ${failed} נכשלו`);
process.exit(failed ? 1 : 0);
