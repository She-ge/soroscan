// Locale constants shared by both server (i18n.ts, middleware.ts) and client
// (components) code. Kept dependency-free (no next-intl/server import) so
// client components can use it without pulling in server-only code.
export const locales = ['en', 'es'] as const;
export const defaultLocale = 'en';
export type AppLocale = (typeof locales)[number];
