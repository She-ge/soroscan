# Terminal UI System - Design Tokens & Component Guide

This UI system provides a retro-futuristic terminal aesthetic for the Soroscan frontend.

## Colors
- **Terminal Black:** `#0a0e27` (Deep space background)
- **Terminal Green:** `#00ff41` (Classic phosphor green)
- **Terminal Cyan:** `#00d4ff` (Bright operational accent)
- **Terminal Danger:** `#ff3366` (Hot pink/red warning)
- **Terminal Warning:** `#ffaa00` (Amber alert)
- **Terminal Info:** `#38bdf8` (Informational)
- **Terminal Gray:** `#94a3b8` (Accessible muted text — WCAG AA+)

## Typography
- **UI Sans:** `IBM Plex Sans` / `Source Sans 3` (via `--font-terminal-sans`)
- **Terminal Mono:** `JetBrains Mono` (via `--font-terminal-mono`)

See also:
- `docs/architecture/frontend/DESIGN_TOKENS.md`
- `docs/architecture/frontend/ANIMATION_GUIDELINES.md`
- `docs/architecture/frontend/ACCESSIBILITY_CONTRAST_AUDIT.md`

## Design Principles
1. **Glow Effects:** Use `shadow-glow-green`, `shadow-glow-cyan`, and `shadow-glow-danger` for interactive elements.
2. **Box Drawing:** Use `border-terminal` and custom corner decorations for containers.
3. **Scanlines:** Components like `Card` and `Button` feature a scanline animation on hover.
4. **Prompts:** Use the `>` prefix for interactive inputs and buttons.
5. **Motion:** Prefer `animate-terminal-*` utilities and `components/terminal/Motion.tsx` for micro-interactions.

## Component Usage

### Button
```tsx
import { Button } from "@/components/terminal/Button";

<Button variant="primary">Access Mainframe</Button>
<Button variant="danger">Abort Mission</Button>
```

### Card
```tsx
import { Card } from "@/components/terminal/Card";

<Card title="RECON_DATA_01">
  <p>Encrypted telemetry detected...</p>
</Card>
```

### Table
```tsx
import { Table, TableHeader, ... } from "@/components/terminal/Table";

<Table>
  <TableHeader>
     <TableRow>
        <TableHead>Sector</TableHead>
        <TableHead>Status</TableHead>
     </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
       <TableCell>ALPHA-7</TableCell>
       <TableCell>SECURE</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Modal
```tsx
import { Modal } from "@/components/terminal/Modal";

<Modal isOpen={true} onClose={() => {}} title="SYSTEM_ALERT">
  <p>Unauthorized access detected.</p>
</Modal>
```

### Input
```tsx
import { Input } from "@/components/terminal/Input";

<Input label="ENCRYPTION_KEY" placeholder="Type key..." />
```
