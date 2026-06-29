/**
 * __tests__/ui-button.test.tsx
 *
 * Unit tests for `components/ui/button.tsx`
 * Covers: variants, sizes, disabled state, loading state, icon slots.
 * Closes #788
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const LeadingIcon = () => <svg data-testid="leading-icon" aria-hidden />;
const TrailingIcon = () => <svg data-testid="trailing-icon" aria-hidden />;

/* -------------------------------------------------------------------------- */
/*  Rendering                                                                  */
/* -------------------------------------------------------------------------- */

describe('Button — rendering', () => {
  it('renders children as the button label', () => {
    render(<Button>Index Contract</Button>);
    expect(screen.getByRole('button', { name: /index contract/i })).toBeInTheDocument();
  });

  it('renders as a <button> element by default', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('forwards data-slot="button" attribute', () => {
    render(<Button data-testid="btn">OK</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('data-slot', 'button');
  });

  it('forwards extra HTML attributes', () => {
    render(<Button data-testid="btn" aria-label="custom label">X</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('aria-label', 'custom label');
  });
});

/* -------------------------------------------------------------------------- */
/*  Variants                                                                   */
/* -------------------------------------------------------------------------- */

describe('Button — variants', () => {
  const variants = ['default', 'primary', 'secondary', 'ghost', 'outline', 'destructive', 'link'] as const;

  it.each(variants)('renders variant="%s" without crashing', (variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('sets data-variant attribute to the given variant', () => {
    render(<Button variant="secondary" data-testid="btn">Secondary</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('data-variant', 'secondary');
  });

  it('applies primary class (bg-primary) for variant="default"', () => {
    render(<Button variant="default" data-testid="btn">OK</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('bg-primary');
  });

  it('applies bg-secondary class for variant="secondary"', () => {
    render(<Button variant="secondary" data-testid="btn">OK</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('bg-secondary');
  });

  it('applies border class for variant="outline"', () => {
    render(<Button variant="outline" data-testid="btn">OK</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('border');
  });

  it('applies bg-destructive class for variant="destructive"', () => {
    render(<Button variant="destructive" data-testid="btn">Delete</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('bg-destructive');
  });
});

/* -------------------------------------------------------------------------- */
/*  Sizes                                                                      */
/* -------------------------------------------------------------------------- */

describe('Button — sizes', () => {
  it('sets data-size attribute to the given size', () => {
    render(<Button size="sm" data-testid="btn">Small</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('data-size', 'sm');
  });

  it('applies h-8 class for size="sm"', () => {
    render(<Button size="sm" data-testid="btn">Small</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('h-8');
  });

  it('applies h-9 class for size="default" (medium)', () => {
    render(<Button size="default" data-testid="btn">Medium</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('h-9');
  });

  it('applies h-10 class for size="lg"', () => {
    render(<Button size="lg" data-testid="btn">Large</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('h-10');
  });

  it('applies size-9 class for size="icon"', () => {
    render(<Button size="icon" aria-label="add" data-testid="btn">+</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('size-9');
  });
});

/* -------------------------------------------------------------------------- */
/*  Disabled state                                                             */
/* -------------------------------------------------------------------------- */

describe('Button — disabled state', () => {
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies disabled:opacity-50 via the class list', () => {
    render(<Button disabled data-testid="btn">Disabled</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('disabled:opacity-50');
  });
});

/* -------------------------------------------------------------------------- */
/*  Loading state                                                              */
/* -------------------------------------------------------------------------- */

describe('Button — loading state', () => {
  it('renders a spinner (Loader2 svg) when isLoading=true', () => {
    render(<Button isLoading>Saving…</Button>);
    // Loader2 renders as an <svg> inside the button
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('is disabled when isLoading=true', () => {
    render(<Button isLoading>Saving…</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy="true" when isLoading=true', () => {
    render(<Button isLoading data-testid="btn">Saving…</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('aria-busy', 'true');
  });

  it('sets data-loading attribute when isLoading=true', () => {
    render(<Button isLoading data-testid="btn">Saving…</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('data-loading', 'true');
  });

  it('does not fire onClick when isLoading=true', () => {
    const handleClick = jest.fn();
    render(<Button isLoading onClick={handleClick}>Saving…</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('still renders label text alongside the spinner', () => {
    render(<Button isLoading>Indexing…</Button>);
    expect(screen.getByText('Indexing…')).toBeInTheDocument();
  });

  it('does not render aria-busy when not loading', () => {
    render(<Button data-testid="btn">OK</Button>);
    expect(screen.getByTestId('btn')).not.toHaveAttribute('aria-busy');
  });
});

/* -------------------------------------------------------------------------- */
/*  Icon slots                                                                 */
/* -------------------------------------------------------------------------- */

describe('Button — icon slots', () => {
  it('renders leading icon before the label', () => {
    render(
      <Button leadingIcon={<LeadingIcon />}>Search</Button>
    );
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders trailing icon after the label', () => {
    render(
      <Button trailingIcon={<TrailingIcon />}>Next</Button>
    );
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders both leading and trailing icons simultaneously', () => {
    render(
      <Button leadingIcon={<LeadingIcon />} trailingIcon={<TrailingIcon />}>
        Export
      </Button>
    );
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
  });

  it('hides leading icon and shows spinner when isLoading=true', () => {
    render(
      <Button isLoading leadingIcon={<LeadingIcon />}>
        Loading
      </Button>
    );
    // The spinner SVG should be present instead of the leading icon
    expect(screen.queryByTestId('leading-icon')).not.toBeInTheDocument();
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('hides trailing icon when isLoading=true', () => {
    render(
      <Button isLoading trailingIcon={<TrailingIcon />}>
        Loading
      </Button>
    );
    expect(screen.queryByTestId('trailing-icon')).not.toBeInTheDocument();
  });

  it('renders no icon elements when no icon props are provided', () => {
    render(<Button data-testid="btn">Plain</Button>);
    expect(screen.getByTestId('btn').querySelector('svg')).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  Click behaviour                                                            */
/* -------------------------------------------------------------------------- */

describe('Button — click behaviour', () => {
  it('calls onClick when clicked in default state', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('works with all variants when clicked', () => {
    const variants = ['default', 'secondary', 'ghost', 'outline'] as const;
    variants.forEach((variant) => {
      const handleClick = jest.fn();
      const { unmount } = render(
        <Button variant={variant} onClick={handleClick}>{variant}</Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
      unmount();
    });
  });

  it('works with all sizes when clicked', () => {
    const sizes = ['sm', 'default', 'lg'] as const;
    sizes.forEach((size) => {
      const handleClick = jest.fn();
      const { unmount } = render(
        <Button size={size} onClick={handleClick}>{size}</Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
      unmount();
    });
  });
});
