# Modal Dialog Wireframes & Interaction Flows

> Closes #977 — wireframes and interaction specs for the three core modal dialog types. **Source of truth:**
> `soroscan-frontend/components/terminal/Modal.tsx` (shared modal shell used by all three dialogs below).

---

## 1. Confirm Delete

**Component:** `soroscan-frontend/app/contracts/components/DeleteConfirmModal.tsx` (contract), inline usage in
`app/webhooks/page.tsx` (webhook).

```
┌──────────────────────────────────────────────────┐
│ [CONFIRM_DELETE]                            [X]   │  ← header, terminal-green fill
├────────────────────────────────────────────────────┤
│ Are you sure you want to delete contract          │
│ "My Token Contract"?                              │  ← danger-colored warning line
│                                                    │
│ This action cannot be undone. All associated data │
│ will be permanently removed.                      │  ← muted helper line
│                                                    │
│ [ DELETE ]              [ CANCEL ]                │  ← danger primary + secondary
├────────────────────────────────────────────────────┤
│ SYSTEM_AUTH_REQUIRED                        • • •  │
└──────────────────────────────────────────────────┘
```

- **Trigger:** row-level "Delete" action on a contract/webhook.
- **Primary action:** `DELETE` (danger variant), disabled + shows `DELETING...` while the request is in flight.
- **Secondary action:** `CANCEL`, closes without side effects.
- **Initial focus:** first focusable control in the dialog (the `DELETE` button).

---

## 2. Register Contract

**Component:** `soroscan-frontend/app/contracts/components/RegisterModal.tsx`

```
┌──────────────────────────────────────────────────┐
│ [REGISTER_CONTRACT]                         [X]   │
├────────────────────────────────────────────────────┤
│ Contract ID *      [ CA...                     ]  │
│ Name *             [ My Contract               ]  │
│ Description        > [ Optional description... ]  │
│                                        0/256       │
│ Tags (comma-sep)   [ defi, token, swap         ]  │
│ Status             (•) ACTIVE   ( ) INACTIVE       │
│                                                    │
│ [ REGISTER ]             [ CANCEL ]                │
├────────────────────────────────────────────────────┤
│ SYSTEM_AUTH_REQUIRED                        • • •  │
└──────────────────────────────────────────────────┘
```

- **Trigger:** "Register Contract" button in the contracts empty state or toolbar.
- **Validation:** `Contract ID` and `Name` required; inline error banner on submit failure; description capped at 256
  chars with a warning color once ≥90% full.
- **Primary action:** `REGISTER` (primary variant), shows `REGISTERING...` while submitting, closes and resets the form
  on success.
- **Secondary action:** `CANCEL`.
- **Initial focus:** `Contract ID` input.

---

## 3. Edit Webhook

There is currently a **Create Webhook** modal (`app/webhooks/components/CreateWebhookModal.tsx`) but no dedicated
**Edit** mode. This wireframe specifies the target design — reusing the same field set as create, pre-populated with the
existing subscription's values, so the eventual implementation only needs to add an `editingWebhook` prop.

```
┌──────────────────────────────────────────────────┐
│ [EDIT_WEBHOOK]                              [X]   │
├────────────────────────────────────────────────────┤
│ Target URL *       [ https://myapp.com/hook   ]  │
│ Event Types        [x] ALL  [ ] SWAP_COMPLETE ...  │
│ Contract Filter     [ CA... (optional)          ]  │
│ Status              (•) ACTIVE   ( ) PAUSED        │
│ Timeout (s)         [ 30 ]                         │
│ Custom Headers      + Add header                   │
│                                                    │
│ [ SAVE_CHANGES ]         [ CANCEL ]                │
├────────────────────────────────────────────────────┤
│ SYSTEM_AUTH_REQUIRED                        • • •  │
└──────────────────────────────────────────────────┘
```

- **Trigger:** row-level "Edit" action in `WebhookTable`.
- **Difference from Create:** fields pre-filled from the selected webhook; primary button reads `SAVE_CHANGES` instead
  of `CREATE`; the webhook's signing secret is not editable here (rotate via a separate action).
- **Primary action:** `SAVE_CHANGES` (primary variant).
- **Secondary action:** `CANCEL`, discards edits.
- **Initial focus:** `Target URL` input.

---

## 4. Shared Interaction Spec (all three dialogs)

All three dialogs render through the shared `Modal` shell (`components/terminal/Modal.tsx`), so this behavior is
consistent across them:

| Interaction                    | Behavior                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backdrop overlay**           | Full-screen `bg-terminal-black/80` with `backdrop-blur-sm`. Clicking the overlay calls `onClose` (cancels, discards unsaved input).                    |
| **Keyboard — Escape**          | Pressing `Escape` anywhere while the dialog is open calls `onClose`, identical to clicking the backdrop or the `[X]` button.                           |
| **Keyboard — Tab / Shift+Tab** | Focus is trapped inside the dialog's focusable elements. `Tab` from the last element wraps to the first; `Shift+Tab` from the first wraps to the last. |
| **Open animation**             | `zoom-in-95`, 200ms.                                                                                                                                   |
| **Dismiss controls**           | Backdrop click, `[X]` button, `Escape` key, and the dialog's own `CANCEL` button are all equivalent "no side effects" exits.                           |

### Focus Trap Accessibility Specification

- The dialog root has `role="dialog"`, `aria-modal="true"`, and `aria-label` set to the dialog title (e.g.
  `CONFIRM_DELETE`).
- On open, focus moves to the first focusable element inside the dialog (falls back to the dialog container itself if
  none exist).
- While open, focus cannot leave the dialog via keyboard — `Tab`/`Shift+Tab` cycle only through elements inside it.
- On close (via any of the dismiss paths above), focus returns to the element that was focused immediately before the
  dialog opened (typically the button that triggered it).
- Meets WCAG 2.1 SC 2.4.3 (Focus Order) and SC 2.1.2 (No Keyboard Trap — the trap is intentional and reversible via
  `Escape`).

Implementation: `soroscan-frontend/components/terminal/Modal.tsx`. Covered by
`soroscan-frontend/__tests__/terminal-modal.test.tsx`.

---

## 5. Figma Prototype

Out of scope for this pass — no interactive Figma file was produced. The wireframes above are the static, text-based
equivalent (ASCII layout + interaction table) checked into the repo as source of truth; a follow-up design pass can
import these into Figma frames using the existing text/color styles documented in `docs/design-specs/typography.md` and
`docs/design-specs/color-palette.md`.
