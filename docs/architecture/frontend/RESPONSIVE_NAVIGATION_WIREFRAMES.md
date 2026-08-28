# Responsive Navigation Wireframes

Issue: #966

This document is the design handoff for SoroScan's responsive dashboard navigation at **375 px** and **768 px** viewports. It covers the application navigation drawer, responsive filter controls, and the transformation of event tables into cards.

> Figma prototype: **{{FIGMA_PROTOTYPE_URL}}**
>
> The repository SVG frames below are the source-of-truth wireframes and are ready to import into Figma. Replace the placeholder only after the imported frames are wired as a prototype and the share URL is available.

## Wireframe frames

| Viewport / state | Source |
| --- | --- |
| 375 px — dashboard | [`mockups/responsive-navigation-375.svg`](./mockups/responsive-navigation-375.svg) |
| 375 px — navigation drawer open | [`mockups/responsive-navigation-375-drawer.svg`](./mockups/responsive-navigation-375-drawer.svg) |
| 768 px — dashboard | [`mockups/responsive-navigation-768.svg`](./mockups/responsive-navigation-768.svg) |
| 768 px — navigation drawer open | [`mockups/responsive-navigation-768-drawer.svg`](./mockups/responsive-navigation-768-drawer.svg) |

The wireframes use the same dark, terminal-oriented visual language as the rest of the dashboard design documentation. They are intentionally low-fidelity: spacing, hierarchy, interaction, and responsive behavior are specified without locking implementation to a final visual treatment.

## Responsive behavior

| Area | 375 px | 768 px | 1024 px and above |
| --- | --- | --- | --- |
| Application navigation | Hidden by default; opened from hamburger button into a left overlay drawer | Hidden by default; opened from hamburger button into a wider left overlay drawer | Persistent sidebar |
| Drawer width | 320 px, capped at 85vw | 360 px, capped at 85vw | Not applicable |
| Search | Full width | Full width | May share a toolbar row |
| Filters | Primary `Filters (n)` button; detailed filters open in a secondary filter surface | Compact inline filter bar plus `More filters (n)` | Full filter controls/sidebar |
| Event results | One-column cards | Two-column cards | Data table |
| Primary actions | Full-width or icon + label | Compact controls | Desktop controls |

The recommended breakpoint keeps the persistent application sidebar out of the 768 px layout so the event content remains usable. The current implementation can treat this document as the target handoff for a later responsive-navigation implementation task; this issue changes design assets and documentation only.

## Navigation drawer interaction

### Trigger

- The hamburger button is the first interactive control in the application header on 375 px and 768 px layouts.
- The button must expose an accessible name such as `Open navigation`.
- Activating the button slides the navigation drawer in from the left.

### Open state

- The drawer is modal at both target viewports.
- A dimmed backdrop covers the remaining viewport.
- Width is 320 px at 375 px and 360 px at 768 px, with a maximum width of 85vw.
- The current route is visually distinct from inactive routes.
- Navigation grouping and labels follow the dashboard information architecture: Events, Performance, Multi-Region, Live Stream, Contracts, Webhooks, Organization, Admin, and Settings.

### Close behavior

The drawer closes when the user:

1. activates the close button,
2. activates the backdrop,
3. presses `Escape`, or
4. chooses a destination that causes navigation.

After closing, keyboard focus returns to the hamburger trigger.

### Motion

- Enter: translate from `-100%` to `0`.
- Exit: translate from `0` to `-100%`.
- Recommended duration: 180–220 ms.
- Respect `prefers-reduced-motion`; when reduced motion is requested, remove the sliding transition.

### Keyboard and screen-reader behavior

- Move focus into the drawer when it opens.
- Keep focus within the modal drawer while it is open.
- Use `aria-modal="true"` and an appropriate dialog/navigation label.
- Preserve visible focus indicators.
- Do not use the backdrop alone as the only way to close the drawer.

## Event table → card transformation

The desktop event table becomes cards below 1024 px.

### Card information hierarchy

Each event card preserves the most important table information in this order:

1. event type and event/status icon,
2. relative or absolute timestamp,
3. contract ID,
4. ledger sequence,
5. transaction hash,
6. event topics/tags,
7. row-level actions where available.

Long identifiers use the existing truncated presentation, while copy actions must retain the complete identifier.

### 375 px

- One card per row.
- Minimum horizontal page padding: 16 px.
- Card content uses stacked label/value pairs.
- Secondary metadata can wrap onto multiple lines.
- Row actions should remain at least 44 × 44 CSS pixels when they are touch targets.

### 768 px

- Two-column card grid when enough usable content width remains.
- Gap: 20–24 px.
- If localization, zoom, or container width makes the cards too narrow, fall back to a single column instead of truncating labels aggressively.

### Card activation

- Selecting a card opens the same event detail destination as selecting a desktop table row.
- Nested controls such as copy buttons, selection checkboxes, menus, and external links must not also trigger card navigation.

## Filter bars

### 375 px

The compact filter toolbar contains:

- `Filters (n)` — opens detailed filtering controls,
- sort control,
- active-filter count.

The detailed filter surface should present the existing contract, event type, date/time, ledger, and topic controls in a single vertical column. `Apply filters` and `Clear` remain easy to reach without scrolling back to the top.

### 768 px

Expose the highest-value filters directly in a compact bar:

- Event type,
- Contract,
- Date range,
- `More filters (n)`.

The `More filters` control opens the remaining filters without reducing the result grid to an unusably narrow width.

### Filter state

- Active filters survive opening and closing the drawer.
- The active-filter count is visible on the collapsed control.
- Clear-all is available from the detailed filter surface.
- Applying filters announces the updated result count to assistive technologies where practical.

## Terminal-theme notes

- Use monochrome line icons with `currentColor`.
- Preserve strong contrast on the dark dashboard surface.
- Avoid relying on color alone for event or health state.
- Pair state icons with text or an accessible label.
- Use the icon set in [`../../design-specs/assets/soroban-event-status-icons/README.md`](../../design-specs/assets/soroban-event-status-icons/README.md) where a semantic event/status icon is needed.

## Figma prototype setup

Import the four SVG files into a single Figma page named `Responsive navigation`.

Create four top-level frames using the imported artwork:

- `375 / Dashboard`
- `375 / Nav open`
- `768 / Dashboard`
- `768 / Nav open`

Wire the prototype as follows:

- hamburger → corresponding `Nav open` frame,
- close control → corresponding `Dashboard` frame,
- backdrop → corresponding `Dashboard` frame,
- use a smart-animate or move-in transition from the left when motion is enabled.

Set `375 / Dashboard` as the mobile flow starting point and `768 / Dashboard` as the tablet flow starting point. Publish/share the prototype and replace the placeholder at the top of this file with the Figma prototype URL.

## Developer handoff boundaries

This contribution is a **design specification**. It intentionally does not change application breakpoints, React components, table rendering code, or filter logic. The implementation task can use the source wireframes and rules here to update the existing application shell, drawer, filters, and event-result components without mixing implementation changes into issue #966.

## Related documentation

- [Dashboard layout and information architecture](./DASHBOARD_LAYOUT_IA.md)
- [Design color palette](../../design-specs/color-palette.md)
- [Soroban event/status icon usage](../../design-specs/assets/soroban-event-status-icons/README.md)
