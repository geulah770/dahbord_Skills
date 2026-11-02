// עזרים משותפים ל־Pages Functions. רץ על Workers runtime: Web Crypto בלבד, בלי מודולים של Node.
export const SESSION = 'dd_session';
export const STATE = 'dd_state';
export const MAX_AGE = 60 * 24 * 3600; // 60 ימים, מתחדש בכל שימוש
export const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const te = new TextEncoder();
const td = new TextDecoder();

function toB64u(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64u(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function randomHex(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function getKey(env) {
  if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
  const digest = await crypto.subtle.digest('SHA-256', te.encode(env.SESSION_SECRET));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

// פורמט העוגייה: iv (12 בתים) ואחריו הצופן עם תג האימות ש־AES-GCM של Web Crypto מוסיף בסוף.
export async function seal(env, obj) {
  const key = await getKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj))));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toB64u(out);
}

export async function open(env, str) {
  // המפתח נבנה מחוץ ל־try בכוונה: SESSION_SECRET חסר צריך להיכשל בקול (500) ולא להיראות כהתנתקות (401).
  const key = await getKey(env);
  try {
    const b = fromB64u(str);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, key, b.slice(12));
    return JSON.parse(td.decode(pt));
  } catch (e) {
    return null;
  }
}

export function cookies(request) {
  const out = {};
  String(request.headers.get('cookie') || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i <= 0) return;
    try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { /* עוגייה פגומה, מתעלמים */ }
  });
  return out;
}

export function cookieStr(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function origin(request, env) {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export async function readSession(request, env) {
  const v = cookies(request)[SESSION];
  return v ? open(env, v) : null;
}

export function json(data, status = 200, setCookies = []) {
  const h = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  setCookies.forEach((c) => h.append('Set-Cookie', c));
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function redirect(location, setCookies = []) {
  const h = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  setCookies.forEach((c) => h.append('Set-Cookie', c));
  return new Response(null, { status: 302, headers: h });
}

// מחזיר Response אם הבקשה לא תקינה, אחרת null. הכותרת X-Requested-With חוסמת בקשות חוצות־אתרים.
export function guard(request, method) {
  if (request.method !== method || request.headers.get('x-requested-with') !== 'dashboard') {
    return json({ error: 'bad_request' }, 400);
  }
  return null;
}

export async function googleToken(env, params) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID || '',
      client_secret: env.GOOGLE_CLIENT_SECRET || '',
      ...params,
    }),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, data: j };
}
