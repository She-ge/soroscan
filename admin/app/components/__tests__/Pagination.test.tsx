/**
 * Pagination — FE-151 unit tests
 *
 * Covers all acceptance criteria from the reusable-pagination-component spec:
 *
 * Req 1 — Render pagination controls
 * Req 2 — Cursor-based pagination
 * Req 3 — Page-based pagination
 * Req 4 — Navigation callbacks
 * Req 5 — Terminal styling
 * Req 6 — Disabled button states
 * Req 7 — Configuration props
 * Req 8 — Edge cases
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../Pagination';
import type { PaginationProps } from '../Pagination';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPagination(props: PaginationProps = {}) {
  return render(<Pagination {...props} />);
}

function getPrev() {
  return screen.getByTestId('pagination-prev');
}

function getNext() {
  return screen.getByTestId('pagination-next');
}

function getInfo() {
  return screen.getByTestId('pagination-info');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Pagination (FE-151)', () => {

  // ── Req 1: Render pagination controls ─────────────────────────────────────

  describe('Req 1 — Render pagination controls', () => {
    it('renders the pagination nav element', () => {
      renderPagination();
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    });

    it('renders a prev button', () => {
      renderPagination();
      expect(getPrev()).toBeInTheDocument();
    });

    it('renders a next button', () => {
      renderPagination();
      expect(getNext()).toBeInTheDocument();
    });

    it('renders an info region', () => {
      renderPagination();
      expect(getInfo()).toBeInTheDocument();
    });

    it('displays Page X of Y in page-based mode', () => {
      renderPagination({ currentPage: 2, totalPages: 5 });
      expect(getInfo()).toHaveTextContent(/page 2 of 5/i);
    });

    it('displays item range when totalItems and itemsPerPage are provided (page mode)', () => {
      renderPagination({ currentPage: 1, totalPages: 10, totalItems: 200, itemsPerPage: 20 });
      expect(getInfo()).toHaveTextContent(/showing 1/i);
      expect(getInfo()).toHaveTextContent(/200/);
    });

    it('uses font-mono class for terminal styling', () => {
      renderPagination();
      expect(screen.getByTestId('pagination')).toHaveClass('font-mono');
    });

    it('accepts a custom className prop', () => {
      renderPagination({ className: 'my-custom-class' });
      expect(screen.getByTestId('pagination')).toHaveClass('my-custom-class');
    });
  });

  // ── Req 2: Cursor-based pagination ────────────────────────────────────────

  describe('Req 2 — Cursor-based pagination', () => {
    it('enables next button when nextCursor is provided', () => {
      renderPagination({ nextCursor: 'cursor-abc', previousCursor: null });
      expect(getNext()).not.toBeDisabled();
    });

    it('enables prev button when previousCursor is provided', () => {
      renderPagination({ nextCursor: null, previousCursor: 'cursor-xyz' });
      expect(getPrev()).not.toBeDisabled();
    });

    it('disables next button when nextCursor is null', () => {
      renderPagination({ nextCursor: null, previousCursor: 'cursor-xyz' });
      expect(getNext()).toBeDisabled();
    });

    it('disables prev button when previousCursor is null', () => {
      renderPagination({ nextCursor: 'cursor-abc', previousCursor: null });
      expect(getPrev()).toBeDisabled();
    });

    it('disables both buttons when both cursors are null', () => {
      renderPagination({ nextCursor: null, previousCursor: null });
      expect(getPrev()).toBeDisabled();
      expect(getNext()).toBeDisabled();
    });

    it('displays totalItems count in cursor mode when provided', () => {
      renderPagination({ nextCursor: 'c', previousCursor: null, totalItems: 500 });
      expect(getInfo()).toHaveTextContent('500');
    });
  });

  // ── Req 3: Page-based pagination ──────────────────────────────────────────

  describe('Req 3 — Page-based pagination', () => {
    it('displays "Page X of Y" format', () => {
      renderPagination({ currentPage: 3, totalPages: 10 });
      expect(getInfo()).toHaveTextContent(/page 3 of 10/i);
    });

    it('disables prev button on first page', () => {
      renderPagination({ currentPage: 1, totalPages: 5 });
      expect(getPrev()).toBeDisabled();
    });

    it('disables next button on last page', () => {
      renderPagination({ currentPage: 5, totalPages: 5 });
      expect(getNext()).toBeDisabled();
    });

    it('enables both buttons on an intermediate page', () => {
      renderPagination({ currentPage: 3, totalPages: 5 });
      expect(getPrev()).not.toBeDisabled();
      expect(getNext()).not.toBeDisabled();
    });

    it('enables next and disables prev when on page 1 of multi-page set', () => {
      renderPagination({ currentPage: 1, totalPages: 3 });
      expect(getPrev()).toBeDisabled();
      expect(getNext()).not.toBeDisabled();
    });
  });

  // ── Req 4: Navigation callbacks ───────────────────────────────────────────

  describe('Req 4 — Navigation callbacks', () => {
    it('calls onNext when next button is clicked and enabled', () => {
      const onNext = jest.fn();
      renderPagination({ currentPage: 1, totalPages: 3, onNext });
      fireEvent.click(getNext());
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onPrevious when prev button is clicked and enabled', () => {
      const onPrevious = jest.fn();
      renderPagination({ currentPage: 2, totalPages: 3, onPrevious });
      fireEvent.click(getPrev());
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('does not call onNext when next button is disabled', () => {
      const onNext = jest.fn();
      renderPagination({ currentPage: 3, totalPages: 3, onNext });
      fireEvent.click(getNext());
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not call onPrevious when prev button is disabled', () => {
      const onPrevious = jest.fn();
      renderPagination({ currentPage: 1, totalPages: 3, onPrevious });
      fireEvent.click(getPrev());
      expect(onPrevious).not.toHaveBeenCalled();
    });

    it('calls onNext in cursor mode when nextCursor is available', () => {
      const onNext = jest.fn();
      renderPagination({ nextCursor: 'abc', previousCursor: null, onNext });
      fireEvent.click(getNext());
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onPrevious in cursor mode when previousCursor is available', () => {
      const onPrevious = jest.fn();
      renderPagination({ nextCursor: null, previousCursor: 'xyz', onPrevious });
      fireEvent.click(getPrev());
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('does not throw when callbacks are omitted and buttons are enabled', () => {
      renderPagination({ currentPage: 2, totalPages: 5 });
      expect(() => fireEvent.click(getNext())).not.toThrow();
      expect(() => fireEvent.click(getPrev())).not.toThrow();
    });
  });

  // ── Req 5: Terminal styling ────────────────────────────────────────────────

  describe('Req 5 — Terminal styling', () => {
    it('prev button contains "PREV" text', () => {
      renderPagination();
      expect(getPrev()).toHaveTextContent('PREV');
    });

    it('next button contains "NEXT" text', () => {
      renderPagination();
      expect(getNext()).toHaveTextContent('NEXT');
    });

    it('prev button contains "<" symbol', () => {
      renderPagination();
      expect(getPrev()).toHaveTextContent('<');
    });

    it('next button contains ">" symbol', () => {
      renderPagination();
      expect(getNext()).toHaveTextContent('>');
    });

    it('renders with zinc-900 background', () => {
      renderPagination();
      expect(screen.getByTestId('pagination')).toHaveClass('bg-zinc-900');
    });

    it('renders with zinc-800 border', () => {
      renderPagination();
      expect(screen.getByTestId('pagination')).toHaveClass('border-zinc-800');
    });

    it('info region uses font-mono', () => {
      renderPagination({ currentPage: 1, totalPages: 2 });
      expect(getInfo()).toHaveClass('font-mono');
    });

    it('enabled next button has zinc-200 text styling', () => {
      renderPagination({ currentPage: 1, totalPages: 3 });
      expect(getNext()).toHaveClass('text-zinc-200');
    });
  });

  // ── Req 6: Disabled button states ─────────────────────────────────────────

  describe('Req 6 — Disabled button states', () => {
    it('disabled prev button has opacity class', () => {
      renderPagination({ currentPage: 1, totalPages: 3 });
      expect(getPrev()).toHaveClass('cursor-not-allowed');
    });

    it('disabled next button has opacity class', () => {
      renderPagination({ currentPage: 3, totalPages: 3 });
      expect(getNext()).toHaveClass('cursor-not-allowed');
    });

    it('disabled button has pointer-events-none', () => {
      renderPagination({ currentPage: 1, totalPages: 3 });
      expect(getPrev()).toHaveClass('pointer-events-none');
    });

    it('enabled button does NOT have pointer-events-none', () => {
      renderPagination({ currentPage: 2, totalPages: 3 });
      expect(getPrev()).not.toHaveClass('pointer-events-none');
      expect(getNext()).not.toHaveClass('pointer-events-none');
    });

    it('disabled buttons have aria-disabled=true', () => {
      renderPagination({ currentPage: 1, totalPages: 3 });
      expect(getPrev()).toHaveAttribute('aria-disabled', 'true');
    });

    it('enabled buttons have aria-disabled=false', () => {
      renderPagination({ currentPage: 2, totalPages: 3 });
      expect(getPrev()).toHaveAttribute('aria-disabled', 'false');
      expect(getNext()).toHaveAttribute('aria-disabled', 'false');
    });
  });

  // ── Req 7: Configuration props ────────────────────────────────────────────

  describe('Req 7 — Configuration props', () => {
    it('accepts currentPage prop', () => {
      renderPagination({ currentPage: 4, totalPages: 10 });
      expect(getInfo()).toHaveTextContent(/4/);
    });

    it('accepts totalPages prop', () => {
      renderPagination({ currentPage: 4, totalPages: 10 });
      expect(getInfo()).toHaveTextContent(/10/);
    });

    it('accepts nextCursor prop', () => {
      const onNext = jest.fn();
      renderPagination({ nextCursor: 'next-token', onNext });
      fireEvent.click(getNext());
      expect(onNext).toHaveBeenCalled();
    });

    it('accepts previousCursor prop', () => {
      const onPrevious = jest.fn();
      renderPagination({ previousCursor: 'prev-token', onPrevious });
      fireEvent.click(getPrev());
      expect(onPrevious).toHaveBeenCalled();
    });

    it('accepts totalItems and itemsPerPage props to show range', () => {
      renderPagination({ currentPage: 2, totalPages: 5, totalItems: 100, itemsPerPage: 20 });
      expect(getInfo()).toHaveTextContent(/21/);
      expect(getInfo()).toHaveTextContent(/40/);
      expect(getInfo()).toHaveTextContent(/100/);
    });

    it('accepts onNext callback prop', () => {
      const onNext = jest.fn();
      renderPagination({ currentPage: 1, totalPages: 5, onNext });
      fireEvent.click(getNext());
      expect(onNext).toHaveBeenCalled();
    });

    it('accepts onPrevious callback prop', () => {
      const onPrevious = jest.fn();
      renderPagination({ currentPage: 3, totalPages: 5, onPrevious });
      fireEvent.click(getPrev());
      expect(onPrevious).toHaveBeenCalled();
    });

    it('accepts className prop and applies it', () => {
      renderPagination({ className: 'mt-4 w-full' });
      expect(screen.getByTestId('pagination')).toHaveClass('mt-4', 'w-full');
    });
  });

  // ── Req 8: Edge cases ─────────────────────────────────────────────────────

  describe('Req 8 — Edge cases', () => {
    it('logs a warning when currentPage < 1', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      renderPagination({ currentPage: 0, totalPages: 5 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('out of range'));
      warn.mockRestore();
    });

    it('logs a warning when currentPage > totalPages', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      renderPagination({ currentPage: 10, totalPages: 5 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('out of range'));
      warn.mockRestore();
    });

    it('prioritizes cursor mode when both cursor and page props are provided', () => {
      // In cursor mode, the prev button is enabled only when previousCursor exists.
      // Page mode would enable prev only when currentPage > 1.
      // Here: page 2/5 would enable prev, but previousCursor=null disables it.
      renderPagination({
        nextCursor: 'abc',
        previousCursor: null,   // cursor mode: prev disabled
        currentPage: 2,          // page mode: prev would be enabled
        totalPages: 5,
      });
      expect(getPrev()).toBeDisabled();  // cursor mode wins
      expect(getNext()).not.toBeDisabled();
    });

    it('renders disabled state when no props are provided', () => {
      renderPagination();
      expect(getPrev()).toBeDisabled();
      expect(getNext()).toBeDisabled();
    });

    it('shows dash "—" in info when no page data is provided', () => {
      renderPagination();
      expect(getInfo()).toHaveTextContent('—');
    });

    it('logs a warning when itemsPerPage is 0', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      renderPagination({ currentPage: 1, totalPages: 5, itemsPerPage: 0, totalItems: 100 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('itemsPerPage is 0'));
      warn.mockRestore();
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('nav has aria-label="Pagination"', () => {
      renderPagination();
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Pagination');
    });

    it('prev button has descriptive aria-label', () => {
      renderPagination();
      expect(getPrev()).toHaveAttribute('aria-label', 'Go to previous page');
    });

    it('next button has descriptive aria-label', () => {
      renderPagination();
      expect(getNext()).toHaveAttribute('aria-label', 'Go to next page');
    });

    it('info region has aria-live="polite"', () => {
      renderPagination();
      expect(getInfo()).toHaveAttribute('aria-live', 'polite');
    });

    it('all buttons have type="button"', () => {
      renderPagination();
      expect(getPrev()).toHaveAttribute('type', 'button');
      expect(getNext()).toHaveAttribute('type', 'button');
    });

    it('is keyboard focusable — prev button is focusable when enabled', () => {
      renderPagination({ currentPage: 2, totalPages: 3 });
      getPrev().focus();
      expect(getPrev()).toHaveFocus();
    });
  });

  // ── Responsive layout ─────────────────────────────────────────────────────

  describe('Responsive layout', () => {
    it('uses flex layout for alignment', () => {
      renderPagination();
      expect(screen.getByTestId('pagination')).toHaveClass('flex');
    });

    it('items-center applied for vertical alignment', () => {
      renderPagination();
      expect(screen.getByTestId('pagination')).toHaveClass('items-center');
    });

    it('justify-between applied for spread layout', () => {
      renderPagination();
      expect(screen.getByTestId('pagination')).toHaveClass('justify-between');
    });
  });
});
