import { SESSION, STATE, SCOPE, MAX_AGE, cookies, cookieStr, origin, seal, googleToken, redirect } from '../../../lib/session.js';

export async function onRequest({ request, env }) {
  const q = new URL(request.url).searchParams;
  const want = cookies(request)[STATE];
  const setCookies = [cookieStr(STATE, '', 0)]; // ה־state חד־פעמי
  const back = (err) => redirect(err ? '/?autherror=' + encodeURIComponent(err) : '/', setCookies);

  if (q.get('error')) return back(q.get('error'));
  if (!want || q.get('state') !== want || !q.get('code')) return back('state');
  try {
    const { ok, data } = await googleToken(env, {
      grant_type: 'authorization_code',
      code: q.get('code'),
      redirect_uri: origin(request, env) + '/api/auth/callback',
    });
    if (!ok || !data.refresh_token) return back(data.error || 'no_refresh_token');
    if (String(data.scope || '').indexOf(SCOPE) < 0) return back('missing_scope');
    setCookies.push(cookieStr(SESSION, await seal(env, { rt: data.refresh_token }), MAX_AGE));
    return back();
  } catch (e) {
    return back('server');
  }
}
