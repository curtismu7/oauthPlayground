# GearIcon Component

A reusable SVG gear icon component that matches the design from the banking UI for consistency across the platform.

## Features

- **Scalable**: Uses SVG format with proper viewBox for crisp rendering at any size
- **Accessible**: Includes proper ARIA attributes (role="img", aria-label)
- **Customizable**: Accepts width, height, className, and other props
- **Consistent**: Uses the same gear icon path as the banking UI

## Usage

```jsx
import { GearIcon } from '../components';

// Basic usage with default size (18x18)
<GearIcon />

// Custom size
<GearIcon width={24} height={24} />

// With custom styling
<GearIcon className="my-gear-icon" style={{ color: 'blue' }} />

// With additional props
<GearIcon data-testid="settings-gear" onClick={handleClick} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | number \| string | 18 | Width of the SVG icon |
| height | number \| string | 18 | Height of the SVG icon |
| className | string | '' | CSS class name to apply |
| ...props | any | - | Any additional props are passed through to the SVG element |

## Accessibility

The component includes proper accessibility attributes:
- `role="img"` - Identifies the SVG as an image
- `aria-label="Settings gear icon"` - Provides a descriptive label for screen readers

## Design

The gear icon uses a Material Design inspired path that creates a classic settings gear appearance with:
- Central circular gear body
- 8 gear teeth around the perimeter
- Inner circle representing the gear center/hole
- Optimized for 24x24 viewBox with proper scaling

## Testing

The component includes comprehensive tests covering:
- Default rendering behavior
- Custom prop handling
- Accessibility attributes
- SVG structure validation
- Visual rendering scenarios

Run tests with:
```bash
npm test -- --testPathPattern=GearIcon
```