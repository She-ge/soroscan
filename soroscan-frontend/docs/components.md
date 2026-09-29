# UI Component Guidelines & Design System Tokens

This document outlines the conventions, design system tokens, Tailwind CSS guidelines, and Storybook / showcase practices for building UI components in `soroscan-frontend`.

---

## 1. Component Architecture & Conventions

### Directory Structure & File Naming
- **UI Primitives (`components/ui/`)**: Low-level, reusable design system components (e.g., `button.tsx`, `card.tsx`, `badge.tsx`, `spinner.tsx`). File names use `kebab-case`.
- **Domain Components (`components/[domain]/`)**: High-level, feature-specific components (e.g., `components/events/EventTimeline.tsx`). File names use `PascalCase`.
- **Storybook Stories**: Colocated with components using `.stories.tsx` suffix (e.g., `spinner.stories.tsx`).
- **Unit Tests**: Colocated with components using `.test.tsx` suffix (e.g., `badge.test.tsx`).

### Prop Interface Naming Standards
1. **Interface Naming**: Always name the component's props interface or type as `<ComponentName>Props` (e.g., `ButtonProps`, `BadgeProps`, `StatCardProps`). Export the interface alongside the component.
2. **Standard Element Extension**: Extend standard HTML element attributes using `React.ComponentProps<"element">` or `React.HTMLAttributes<HTMLDivElement>`.
3. **CVA Variant Types**: Use `VariantProps<typeof componentVariants>` to infer props from Class Variance Authority definitions.
4. **Polymorphic Rendering**: Support the `asChild` prop pattern using Radix UI `Slot` when components need to delegate rendering to child elements.

#### Example Pattern
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-terminal-green disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "min-h-[44px] h-11 px-4 py-2 sm:min-h-0 sm:h-9",
        sm: "min-h-[44px] h-11 rounded-md px-3 sm:min-h-0 sm:h-8",
        lg: "min-h-[44px] h-12 rounded-md px-6 sm:min-h-0 sm:h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

---

## 2. Tailwind CSS & Utility Guidelines

### Styling Rules
- **Tailwind CSS v4 Utility First**: Use Tailwind utility classes for element styling. Avoid inline `style` objects.
- **Class Merging (`cn`)**: Always wrap combined or conditional class strings with the `cn(...)` utility helper (from `@/lib/utils`) which merges `clsx` and `tailwind-merge` cleanly.
- **Class Variance Authority (`cva`)**: Use `cva` for defining component variants, sizes, and default variant configurations.
- **Design Token Usage**: Use design system color and typography tokens instead of arbitrary hardcoded values (e.g., `bg-terminal-black`, `text-terminal-green`, `font-terminal-mono`).

### Dark Mode & Accessibility
- **Dark Theme Tokens**: Apply `.dark` root styling and theme variables. Ensure text contrast complies with WCAG 2.1 AA standards against Petrol Teal dark backgrounds.
- **Focus States**: Enforce visible focus indicators via `focus-visible:outline-2 focus-visible:outline-terminal-green focus-visible:outline-offset-2`.
- **Screen Reader Support**: Include screen reader utility classes (`sr-only`) and appropriate `aria-*` attributes for non-text interactive elements.
- **Reduced Motion**: Respect system motion preferences using standard Tailwind `motion-reduce:` modifiers or `@media (prefers-reduced-motion: reduce)`.

---

## 3. Design System Tokens

SoroScan uses a custom **Petrol Teal Theme** tailored for block explorer and developer terminal interfaces, configured in `app/globals.css`.

### Color Palette Tokens
| Token | Variable | Hex / Value | Description |
| :--- | :--- | :--- | :--- |
| **Terminal Black** | `--color-terminal-black` | `#091a21` | Main dark background |
| **Terminal Dark** | `--color-terminal-dark` | `#0e2530` | Muted container & surface background |
| **Terminal Medium** | `--color-terminal-medium` | `#132b36` | Card background & hover states |
| **Terminal Green** | `--color-terminal-green` | `#00e5ff` | Primary brand accent & active indicators |
| **Terminal Cyan** | `--color-terminal-cyan` | `#38bdf8` | Secondary action & highlight color |
| **Terminal Danger** | `--color-terminal-danger` | `#ff3366` | Error states & failed transactions |
| **Terminal Warning** | `--color-terminal-warning` | `#ffaa00` | Warning badges & pending status |
| **Terminal Gray** | `--color-terminal-gray` | `#94a3b8` | Body & secondary text label color |
| **Terminal Muted Gray** | `--color-terminal-gray-muted` | `#64748b` | Disabled text & subtle borders |
| **Terminal Light** | `--color-terminal-light` | `#e2e8f0` | High-contrast body text |
| **Terminal White** | `--color-terminal-white` | `#f8fafc` | Pure text & highlight headers |

### Typography Tokens
- **Monospace Font Family (`--font-terminal-mono`)**: `"JetBrains Mono", "IBM Plex Mono", monospace` (Used for code, contract addresses, hashes, and data values).
- **Sans-Serif Font Family (`--font-terminal-sans`)**: `"IBM Plex Sans", "Source Sans 3", system-ui, sans-serif` (Used for body text and navigation).

#### Type Hierarchy
- `h1`: `2rem` (32px), weight `600`, line height `1.25`
- `h2`: `1.5rem` (24px), weight `600`, line height `1.3`
- `h3`: `1.125rem` (18px), weight `600`, line height `1.35`
- `body`: `0.875rem` (14px), weight `400`, line height `1.55`
- `caption`: `0.75rem` (12px), weight `400`, line height `1.4`

### Spacing & Sizing Scale
- **Spacing scale**: `xs` (4px), `sm` (8px), `md` (12px), `lg` (16px), `xl` (24px), `2xl` (32px).
- **Control Heights**: `sm` (`2.25rem` / 36px), `md` (`2.75rem` / 44px), `lg` (`3rem` / 48px).
- **Touch Target Minimum**: `44px` (`min-h-[44px]`).

### Shadow & Glow Effects
- `--shadow-glow-green`: `0 0 16px rgba(0, 229, 255, 0.45), 0 0 4px rgba(0, 229, 255, 0.35)`
- `--shadow-glow-cyan`: `0 0 16px rgba(56, 189, 248, 0.45), 0 0 4px rgba(56, 189, 248, 0.35)`
- `--shadow-glow-danger`: `0 0 16px rgba(255, 51, 102, 0.4), 0 0 4px rgba(255, 51, 102, 0.3)`
- `--shadow-glow-warning`: `0 0 16px rgba(255, 170, 0, 0.4), 0 0 4px rgba(255, 170, 0, 0.3)`
- `--shadow-card`: `0 0 20px rgba(0, 229, 255, 0.12)`

---

## 4. Storybook & Component Showcase Guidelines

### Writing Storybook Stories
Colocate `.stories.tsx` files alongside your UI components in `components/ui/`.

#### Story File Structure
```tsx
import type { Meta, StoryObj } from "@storybook/react"
import { Spinner } from "@/components/ui/spinner"

const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["mini", "default", "large"],
      description: "Size variant of the spinner",
    },
    color: {
      control: "select",
      options: ["default", "success", "warning", "error"],
      description: "Color variant of the spinner",
    },
    label: {
      control: "text",
      description: "Accessible screen reader label",
    },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: {},
}

export const Success: Story = {
  args: {
    color: "success",
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="mini" />
      <Spinner />
      <Spinner size="large" />
      <Spinner color="success" />
      <Spinner color="warning" />
      <Spinner color="error" />
    </div>
  ),
}
```

### Best Practices for Showcase Stories
1. **Title Hierarchy**: Standardize story titles under appropriate categories (e.g., `UI/Button`, `UI/Spinner`, `Domain/ContractHealthBadge`).
2. **Enable Autodocs**: Include `tags: ["autodocs"]` in the metadata to enable automatic documentation and control table generation.
3. **Cover Edge Cases**: Add stories for loading, disabled, overflow, error, and dark mode variants.
4. **All Variants Showcase**: Include an `AllVariants` story rendering all sizes and color options together for quick visual regression checking.
5. **In-Browser Gallery**: Interactive component demonstrations can also be explored in the application gallery route at `/gallery`.

---

## 5. Testing & Quality Assurance

- **Unit & Component Testing**: Use React Testing Library with Jest (`pnpm test`).
- **Accessibility Verification**: Include `jest-axe` assertions in component test suites to verify ARIA tags and color contrast.
- **Visual & E2E Testing**: Run Playwright test suites (`pnpm test:e2e`) to validate component behavior across browsers.

---

## 6. Related Documentation

- [Quickstart Guide](./quickstart.md) — Getting started with SoroScan frontend and API.
- [Authentication Guide](./authentication.md) — Authentication patterns and tokens.
- [Webhooks Guide](./webhooks.md) — Configuring real-time event webhooks.
- [Design Specs - Code Block](./design-specs/code-block.md) — Code formatting and syntax highlighter specifications.
- [Design Specs - Team Management](./design-specs/team-management.md) — Team permissions and member management specs.
