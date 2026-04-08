import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { auth } from "@/auth"

const i18nMiddleware = createMiddleware(routing);


export default auth((req) => {
  const isAuthPage = req.nextUrl.pathname.includes('/login');
  const session = req.auth;

  if (isAuthPage) {
    if (session) {
      return Response.redirect(new URL(`/${req.nextUrl.locale || 'fr'}/dashboard`, req.nextUrl));
    }
    return i18nMiddleware(req);
  }

  if (!session && req.nextUrl.pathname.includes('/dashboard')) {
    return Response.redirect(new URL(`/${req.nextUrl.locale || 'fr'}/login`, req.nextUrl));
  }

  return i18nMiddleware(req);
})

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /static (static files)
  // - /_vercel (Vercel internals)
  // - favicon.ico, sitemap.xml, robots.txt (static files)
  matcher: ['/((?!api|_next|static|_vercel|[\\w-]+\\.\\w+).*)']
};
