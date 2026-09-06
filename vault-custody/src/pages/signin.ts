// GET /signin?hat=<hat> — the sign-in stub. Sets the seeded session cookies
// and lands on the hat's home sheet. No real auth yet.
import type { APIRoute } from 'astro';
import { hats, isHat } from '../lib/hats';

export const prerender = false;

export const GET: APIRoute = ({ url, cookies, redirect }) => {
  const hat = url.searchParams.get('hat');
  if (!isHat(hat)) return redirect('/#hats', 302);
  const opts = { path: '/', sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 30, httpOnly: false, secure: url.protocol === 'https:' };
  cookies.set('vc_hat', hat, opts);
  cookies.set('vc_session', hats[hat].session, opts);
  return redirect(hats[hat].home, 302);
};
