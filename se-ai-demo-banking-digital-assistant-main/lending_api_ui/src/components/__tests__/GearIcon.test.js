import React from 'react';
import { render, screen } from '@testing-library/react';
import GearIcon from '../GearIcon';

describe('GearIcon Component', () => {
  test('renders with default props', () => {
    render(<GearIcon />);
    
    const icon = screen.getByRole('img');
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('aria-label')).toBe('Settings gear icon');
    expect(icon.getAttribute('width')).toBe('18');
    expect(icon.getAttribute('height')).toBe('18');
    expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(icon.getAttribute('fill')).toBe('currentColor');
  });

  test('renders with custom dimensions', () => {
    render(<GearIcon width={24} height={24} />);
    
    const icon = screen.getByRole('img');
    expect(icon.getAttribute('width')).toBe('24');
    expect(icon.getAttribute('height')).toBe('24');
  });

  test('applies custom className', () => {
    render(<GearIcon className="custom-gear-icon" />);
    
    const icon = screen.getByRole('img');
    expect(icon.getAttribute('class')).toBe('custom-gear-icon');
  });

  test('passes through additional props', () => {
    render(<GearIcon data-testid="gear-icon" />);
    
    const icon = screen.getByTestId('gear-icon');
    expect(icon).toBeTruthy();
  });

  test('has proper accessibility attributes', () => {
    render(<GearIcon />);
    
    const icon = screen.getByRole('img');
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Settings gear icon');
  });

  test('contains the correct SVG path', () => {
    render(<GearIcon />);
    
    const icon = screen.getByRole('img');
    const path = icon.querySelector('path');
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toBeTruthy();
    
    // Verify it contains the gear icon path (partial check)
    const pathData = path.getAttribute('d');
    expect(pathData).toContain('M12,15.5A3.5,3.5');
    expect(pathData).toContain('M19.43,12.97C19.47,12.65');
  });
});