/**
 * SkipToContent – WCAG 2.1 AA §2.4.1 "Bypass Blocks"
 *
 * Renders a visually-hidden anchor that becomes visible on keyboard focus,
 * allowing keyboard users to bypass repeated navigation and jump straight
 * to the main content area.
 *
 * Usage: render as the very first child of <body>, before any navigation.
 * The target element must have id="main-content".
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-terminal-black focus:text-terminal-green focus:border focus:border-terminal-green focus:rounded focus:outline-none font-terminal-mono text-sm font-bold tracking-widest uppercase"
    >
      Skip to main content
    </a>
  );
}
