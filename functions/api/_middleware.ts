// Retire account endpoints without making any previous user data public.
export const onRequest: PagesFunction = async ({ request, next }) => {
  const path = new URL(request.url).pathname;
  if (/^\/api\/(?:auth|sync|notes|classes|admin)(?:\/|$)/.test(path)) {
    return new Response(JSON.stringify({ error: 'account_features_removed' }), {
      status: 410,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'hsess=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
      },
    });
  }
  return next();
};
