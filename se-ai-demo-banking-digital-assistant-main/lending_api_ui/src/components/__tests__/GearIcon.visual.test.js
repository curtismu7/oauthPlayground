/**
 * Visual test for GearIcon component
 * This test verifies the component renders without errors in different scenarios
 */

import React from 'react';
import { render } from '@testing-library/react';
import GearIcon from '../GearIcon';

describe('GearIcon Visual Tests', () => {
  test('renders without crashing with default props', () => {
    const { container } = render(<GearIcon />);
    expect(container.firstChild).toBeTruthy();
    expect(container.firstChild.tagName).toBe('svg');
  });

  test('renders without crashing with custom props', () => {
    const { container } = render(
      <GearIcon 
        width={32} 
        height={32} 
        className="test-gear" 
        style={{ color: 'blue' }}
        data-testid="custom-gear"
      />
    );
    
    const svg = container.firstChild;
    expect(svg).toBeTruthy();
    expect(svg.tagName).toBe('svg');
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
    expect(svg.getAttribute('class')).toBe('test-gear');
    expect(svg.getAttribute('data-testid')).toBe('custom-gear');
  });

  test('maintains proper SVG structure', () => {
    const { container } = render(<GearIcon />);
    const svg = container.firstChild;
    
    // Check SVG attributes
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Settings gear icon');
    
    // Check path element exists
    const path = svg.querySelector('path');
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toBeTruthy();
  });

  test('scales properly with different sizes', () => {
    const sizes = [12, 16, 18, 24, 32, 48];
    
    sizes.forEach(size => {
      const { container } = render(<GearIcon width={size} height={size} />);
      const svg = container.firstChild;
      
      expect(svg.getAttribute('width')).toBe(size.toString());
      expect(svg.getAttribute('height')).toBe(size.toString());
      // ViewBox should remain consistent for proper scaling
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  test('handles edge cases gracefully', () => {
    // Test with zero dimensions
    const { container: container1 } = render(<GearIcon width={0} height={0} />);
    expect(container1.firstChild).toBeTruthy();
    
    // Test with very large dimensions
    const { container: container2 } = render(<GearIcon width={1000} height={1000} />);
    expect(container2.firstChild).toBeTruthy();
    
    // Test with string dimensions (should work with React)
    const { container: container3 } = render(<GearIcon width="24" height="24" />);
    expect(container3.firstChild).toBeTruthy();
  });
});