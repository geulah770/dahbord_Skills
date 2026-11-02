import { SESSION, MAX_AGE, cookieStr, readSession, seal, guard, googleToken, json } from '../../../lib/session.js';

export async function onRequest({ request, env }) {
  const bad = guard(request, 'GET');
  if (bad) return bad;

  let s;
  try { s = await readSession(request, env); } catch (e) { return json({ error: 'server_config' }, 500); }
  if (!s || !s.rt) return json({ error: 'no_session' }, 401);

  try {
    const { ok, data } = await googleToken(env, { grant_type: 'refresh_token', refresh_token: s.rt });
    if (!ok) {
      if (data.error === 'invalid_grant') return json({ error: 'expired' }, 401, [cookieStr(SESSION, '', 0)]);
      return json({ error: 'google' }, 502);
    }
    // תוקף העוגייה מתחדש בכל שימוש
    const renewed = cookieStr(SESSION, await seal(env, { rt: s.rt }), MAX_AGE);
    return json({ access_token: data.access_token, expires_in: data.expires_in }, 200, [renewed]);
  } catch (e) {
    return json({ error: 'server' }, 502);
  }
}
