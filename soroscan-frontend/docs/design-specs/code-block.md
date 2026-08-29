# Code Block Component Specs
**Issue:** #1001

## Syntax Highlighting Token Colors (Dark Mode)
*   **Background:** `hsl(var(--background-secondary))` (or `#1E1E1E`)
*   **Strings:** `#A5D6FF` (Light Blue)
*   **Keywords:** `#FF7B72` (Soft Red)
*   **Booleans/Numbers:** `#79C0FF` (Azure)
*   **Comments:** `#8B949E` (Muted Gray)
*   **Functions:** `#D2A8FF` (Lavender)

## UI States & Affordances
*   **Copy Button (Default):** Hidden on standard view, appears on hover (Opacity 0 -> 100 transition). Uses the `Clipboard` icon.
*   **Copy Button (Success):** Icon swaps to a green `Check` mark upon successful clipboard write. Persists for 2000ms before reverting.
*   **Line Numbers:** Rendered in `#6E7681` (Muted text) with `user-select: none` to prevent messy copy/pasting.