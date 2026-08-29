import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './lib/locales';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Default locale has no prefix (/, /contracts); other locales are
  // prefixed (/es, /es/contracts).
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|es)/:path*'],
};
