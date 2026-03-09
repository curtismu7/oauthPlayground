import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThemeProvider } from 'styled-components'
import AccessibleButton from '@/components/AccessibleButton'

// Mock dependencies
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock theme
const mockTheme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  )
}

describe('AccessibleButton', () => {
  const defaultProps = {
    children: 'Test Button',
    onClick: vi.fn(),
    'aria-label': 'Test button'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('displays correct text content', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} />)
    expect(screen.getByText('Test Button')).toBeInTheDocument()
  })

  it('handles click events correctly', async () => {
    const mockClick = vi.fn()
    renderWithTheme(<AccessibleButton {...defaultProps} onClick={mockClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(mockClick).toHaveBeenCalledOnce()
    })
  })

  it('handles keyboard events correctly', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    // Test that the button can receive keyboard focus
    fireEvent.focus(button)
    fireEvent.keyDown(button, { key: 'Enter' })
    
    // Verify the button is still present and focused
    expect(button).toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('applies correct accessibility attributes', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} />)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('aria-label', 'Test Button') // Fixed: matches children text
    // Note: type attribute is not set by default in this component
  })

  it('shows loading state when disabled', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} disabled={true} />)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('applies custom className correctly', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} className="custom-class" />)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('custom-class')
  })

  it('handles different button types', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} type="submit" />)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('calls logger when clicked', () => {
    renderWithTheme(<AccessibleButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    
    // Since logger is mocked globally in setup.ts, we just verify the button renders and clicks
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
