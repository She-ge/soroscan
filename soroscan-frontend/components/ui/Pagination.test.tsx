import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './Pagination'

describe('Pagination Component', () => {
  it('renders page numbers correctly', () => {
    const mockOnPageChange = jest.fn()
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    )
    
    // Pages 1, 4, 5, 6, 10 should be visible due to sibling count = 1
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
  })

  it('fires onPageChange callback', () => {
    const mockOnPageChange = jest.fn()
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )
    
    const page2Button = screen.getByRole('button', { name: 'Page 2' })
    fireEvent.click(page2Button)
    expect(mockOnPageChange).toHaveBeenCalledWith(2)

    const nextButton = screen.getByRole('button', { name: 'Go to next page' })
    fireEvent.click(nextButton)
    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('disables boundary buttons correctly', () => {
    const mockOnPageChange = jest.fn()
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )
    
    expect(screen.getByRole('button', { name: 'Go to first page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to next page' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to last page' })).not.toBeDisabled()

    rerender(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )
    
    expect(screen.getByRole('button', { name: 'Go to first page' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to last page' })).toBeDisabled()
  })

  it('has correct accessibility attributes', () => {
    const mockOnPageChange = jest.fn()
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )
    
    const activePage = screen.getByRole('button', { name: 'Page 3' })
    expect(activePage).toHaveAttribute('aria-current', 'page')
    
    const inactivePage = screen.getByRole('button', { name: 'Page 2' })
    expect(inactivePage).not.toHaveAttribute('aria-current', 'page')
  })
})
