/**
 * Button.stories.tsx
 *
 * Storybook documentation for the SoroScan `Button` component.
 * Covers every combination required by issue #788:
 *   - Variants  : Primary, Secondary, Ghost, Outline (+ Destructive, Link)
 *   - Sizes     : Small (sm), Medium (md / default), Large (lg)
 *   - States    : Default, Hover (via CSS), Disabled, Loading
 *   - Icons     : Leading icon slot, Trailing icon slot, Icon-only
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Search, ArrowRight, Download, Loader2, Plus, Trash2, ExternalLink } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*  Meta                                                                       */
/* -------------------------------------------------------------------------- */

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The \`Button\` component is the primary interactive element across SoroScan's UI.
It supports four visual **variants**, three **sizes**, two **states** (disabled / loading),
and optional **leading / trailing icon** slots.

\`\`\`tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md" onClick={handleClick}>
  Index Contract
</Button>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      description: 'Visual style of the button.',
      control: 'select',
      options: ['default', 'primary', 'secondary', 'ghost', 'outline', 'destructive', 'link'],
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      description: 'Controls padding and height.',
      control: 'select',
      options: ['sm', 'default', 'md', 'lg', 'xs', 'icon', 'icon-sm', 'icon-lg'],
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    disabled: {
      description: 'Prevents interaction and renders an opacity-reduced style.',
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    isLoading: {
      description: 'Shows a spinner, disables the button, and sets `aria-busy`.',
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    children: {
      description: 'Button label / content.',
      control: 'text',
    },
    onClick: { action: 'clicked' },
  },
  args: {
    onClick: fn(),
    children: 'Button',
    isLoading: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------- */
/*  Playground (interactive controls)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Use the Controls panel below to toggle any prop in real-time.
 */
export const Playground: Story = {
  args: {
    variant: 'default',
    size: 'default',
    children: 'Button',
  },
};

/* -------------------------------------------------------------------------- */
/*  Variants                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * **Primary** — high-emphasis filled button for the most important action on screen.
 * Maps to `variant="default"` or the explicit alias `variant="primary"`.
 */
export const Primary: Story = {
  args: { variant: 'primary', children: 'Index Contract' },
};

/**
 * **Secondary** — muted filled button for supporting actions.
 */
export const Secondary: Story = {
  args: { variant: 'secondary', children: 'View Details' },
};

/**
 * **Ghost** — no background; lowest visual weight, used inside toolbars and menus.
 */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel' },
};

/**
 * **Outline** — bordered, transparent background.
 * Use when a button needs to be visible but not dominant.
 */
export const Outline: Story = {
  args: { variant: 'outline', children: 'Export CSV' },
};

/**
 * **Destructive** — signals a dangerous or irreversible action.
 */
export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete Contract' },
};

/**
 * **Link** — inline text link styled as a button.
 */
export const Link: Story = {
  args: { variant: 'link', children: 'Learn more' },
};

/* -------------------------------------------------------------------------- */
/*  All Variants — visual reference row                                        */
/* -------------------------------------------------------------------------- */

/**
 * All six variants side-by-side for a quick visual comparison.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side view of every available `variant`.',
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Sizes                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * **Small (sm)** — compact button for dense UIs, tables, and inline controls.
 */
export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

/**
 * **Medium (default)** — the standard size used in most contexts.
 */
export const Medium: Story = {
  args: { size: 'default', children: 'Medium' },
};

/**
 * **Large (lg)** — prominent CTA buttons, hero sections, onboarding flows.
 */
export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

/**
 * All three primary sizes rendered together for quick visual comparison.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <Button variant="default" size="sm">Small</Button>
      <Button variant="default" size="default">Medium</Button>
      <Button variant="default" size="lg">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Small (`sm`), Medium (`default`), and Large (`lg`) next to each other.',
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  States                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * **Disabled** — `pointer-events-none` + 50 % opacity. No click events fire.
 */
export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

/**
 * **Loading** — replaces the label icon with a `Loader2` spinner and sets
 * `aria-busy="true"` plus `disabled` so the button cannot be clicked.
 */
export const Loading: Story = {
  args: { isLoading: true, children: 'Indexing…' },
};

/**
 * Loading state applied across all variants simultaneously.
 */
export const LoadingAllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default" isLoading>Primary</Button>
      <Button variant="secondary" isLoading>Secondary</Button>
      <Button variant="ghost" isLoading>Ghost</Button>
      <Button variant="outline" isLoading>Outline</Button>
      <Button variant="destructive" isLoading>Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The loading spinner replaces any leading icon and the button becomes non-interactive.',
      },
    },
  },
};

/**
 * Disabled state applied across all variants.
 */
export const DisabledAllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Icons                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * **Leading icon** — icon rendered to the left of the label.
 * Use to reinforce the action (e.g. a search icon before "Search").
 */
export const WithLeadingIcon: Story = {
  args: {
    variant: 'default',
    leadingIcon: <Search size={16} aria-hidden />,
    children: 'Search Events',
  },
};

/**
 * **Trailing icon** — icon rendered to the right of the label.
 * Use to indicate navigation or output actions (e.g. "Export →").
 */
export const WithTrailingIcon: Story = {
  args: {
    variant: 'outline',
    trailingIcon: <ArrowRight size={16} aria-hidden />,
    children: 'View All',
  },
};

/**
 * **Both icons** — leading and trailing icons together.
 */
export const WithBothIcons: Story = {
  args: {
    variant: 'secondary',
    leadingIcon: <Download size={16} aria-hidden />,
    trailingIcon: <ExternalLink size={16} aria-hidden />,
    children: 'Download Report',
  },
};

/**
 * **Icon-only** — use `size="icon"` with an accessible `aria-label`.
 * No visible text; the icon carries all meaning.
 */
export const IconOnly: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    'aria-label': 'Add contract',
    children: <Plus size={18} aria-hidden />,
  },
};

/**
 * Icon-only destructive variant — e.g. a delete row button.
 */
export const IconOnlyDestructive: Story = {
  args: {
    variant: 'destructive',
    size: 'icon',
    'aria-label': 'Delete record',
    children: <Trash2 size={18} aria-hidden />,
  },
};

/**
 * Icons combined with the loading state — the spinner replaces the leading icon
 * while the trailing icon is hidden to avoid confusion.
 */
export const IconWithLoading: Story = {
  args: {
    variant: 'default',
    isLoading: true,
    leadingIcon: <Download size={16} aria-hidden />,
    trailingIcon: <ArrowRight size={16} aria-hidden />,
    children: 'Downloading…',
  },
};

/* -------------------------------------------------------------------------- */
/*  Full matrix — all variants × all sizes                                    */
/* -------------------------------------------------------------------------- */

/**
 * Complete reference grid: every variant at every size.
 */
export const FullMatrix: Story = {
  render: () => {
    const variants = ['default', 'secondary', 'ghost', 'outline', 'destructive'] as const;
    const sizes = ['sm', 'default', 'lg'] as const;
    const sizeLabels: Record<string, string> = { sm: 'sm', default: 'md', lg: 'lg' };

    return (
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left font-semibold text-muted-foreground">Variant \ Size</th>
              {sizes.map((s) => (
                <th key={s} className="p-3 text-center font-semibold text-muted-foreground">
                  {sizeLabels[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v} className="border-t">
                <td className="p-3 font-mono text-xs text-muted-foreground capitalize">{v}</td>
                {sizes.map((s) => (
                  <td key={s} className="p-3 text-center">
                    <Button variant={v} size={s}>{v}</Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Every variant × size combination rendered in a reference grid.',
      },
    },
  },
};
