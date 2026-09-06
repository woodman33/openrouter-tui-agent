import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete('vc_hat', { path: '/' });
  cookies.delete('vc_session', { path: '/' });
  return redirect('/', 302);
};
