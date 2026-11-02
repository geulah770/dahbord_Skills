import { json } from '../../lib/session.js';

export function onRequest({ env }) {
  return json({ clientId: env.GOOGLE_CLIENT_ID || '' });
}
