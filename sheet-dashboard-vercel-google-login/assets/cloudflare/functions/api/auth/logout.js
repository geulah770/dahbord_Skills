import { SESSION, cookieStr, readSession, guard, json } from '../../../lib/session.js';

export async function onRequest({ request, env }) {
  const bad = guard(request, 'POST');
  if (bad) return bad;

  try {
    const s = await readSession(request, env);
    if (s && s.rt) {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: s.rt }),
      }).catch(() => {});
    }
  } catch (e) { /* גם אם הביטול נכשל, מוחקים את העוגייה */ }
  return json({ ok: true }, 200, [cookieStr(SESSION, '', 0)]);
}
