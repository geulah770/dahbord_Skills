import { STATE, SCOPE, cookieStr, origin, randomHex, redirect } from '../../../lib/session.js';

export function onRequest({ request, env }) {
  const state = randomHex(16);
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || '',
    redirect_uri: origin(request, env) + '/api/auth/callback',
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent select_account',
    state,
  }).toString();
  return redirect(u.toString(), [cookieStr(STATE, state, 600)]);
}
