import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Alert } from './alert'

describe('Alert Component', () => {
  it('renders all variants correctly', () => {
    const { rerender } = render(<Alert variant="info" title="Info Title" />)
    expect(screen.getByText('Info Title')).toBeInTheDocument()

    rerender(<Alert variant="success" title="Success Title" />)
    expect(screen.getByText('Success Title')).toBeInTheDocument()

    rerender(<Alert variant="warning" title="Warning Title" />)
    expect(screen.getByText('Warning Title')).toBeInTheDocument()

    rerender(<Alert variant="error" title="Error Title" />)
    expect(screen.getByText('Error Title')).toBeInTheDocument()
  })

  it('renders icons based on variants', () => {
    const { container, rerender } = render(<Alert variant="info" title="Test" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    
    rerender(<Alert variant="error" title="Test" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('allows dismissing the alert', () => {
    const mockOnDismiss = jest.fn()
    render(<Alert title="Dismiss Me" dismissible onDismiss={mockOnDismiss} />)
    
    expect(screen.getByText('Dismiss Me')).toBeInTheDocument()
    
    const dismissButton = screen.getByLabelText('Dismiss alert')
    fireEvent.click(dismissButton)
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Dismiss Me')).not.toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<Alert title="A11y Test" />)
    const alertElement = screen.getByRole('alert')
    expect(alertElement).toBeInTheDocument()
  })
})
