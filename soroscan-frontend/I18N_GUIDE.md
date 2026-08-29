# i18n Contributor Guide

SoroScan's frontend uses [`next-intl`](https://next-intl.dev/) for translations.
Supported locales are English (`en`, default) and Spanish (`es`).

## Current scope

Translation is wired up app-wide: `app/layout.tsx` provides a `NextIntlClientProvider`
to every route (not just pages under `app/[locale]/`), so any component can call
`useTranslations()`. The `Navbar`/`NavDrawer` (landing page navigation) are wired up
as a working example. Most existing pages (contracts, webhooks, dashboard, admin,
docs, etc.) still have hardcoded English strings — extracting those into translation
keys is ongoing follow-up work, not yet complete.

## Routing

- Locale routing lives in `middleware.ts` and `i18n.ts`.
- The default locale (`en`) has **no URL prefix** (`/`, `/contracts`, ...).
- Other locales are prefixed (`/es`, `/es/contracts`, ...).
- `lib/locales.ts` holds the plain `locales`/`defaultLocale`/`AppLocale` constants
  with no next-intl import, so client components can use them without pulling in
  `next-intl/server`.

## Adding a new translation key

1. Add the key to `messages/en.json` first.
2. Add the same key, translated, to `messages/es.json`. Keep the nesting identical —
   a script or test that walks both files expects exact key parity between locales.
3. Use it in a component:

   ```tsx
   import { useTranslations } from "next-intl"

   function MyComponent() {
     const t = useTranslations("MyNamespace")
     return <p>{t("myKey")}</p>
   }
   ```

4. Never hardcode user-visible English strings in JSX going forward — add a key
   instead, even if the Spanish translation is a first draft.

## Adding a new locale

1. Add the locale code to `locales` in `lib/locales.ts`.
2. Create `messages/<locale>.json` with the same key structure as `messages/en.json`.
3. That's it — routing, the language selector (`components/ui/LanguageSelector.tsx`),
   and the root layout's `<html lang>` all derive from `lib/locales.ts`.

## Testing

Components that call `useTranslations()`/`useLocale()` are automatically mocked in
Jest via `__mocks__/next-intl.tsx`, which resolves real strings from
`messages/en.json` — no per-test provider wrapper needed. If you introduce a new
`next-intl` export, extend that mock file rather than mocking `next-intl` per test.
