# V3 Style System Guide

## Overview

The V3 architecture introduces a comprehensive design system to replace 3,000+ lines of inline styles with maintainable, centralized design tokens and utility functions.

---

## Design Tokens

Design tokens are centralized in `designTokens.ts` and provide consistent values for:

### Colors

```typescript
import { colors } from '@/v8/styles/designTokens';

// Primary colors (Blue)
colors.primary[500]  // #3b82f6 - Main primary color
colors.primary[600]  // Darker shade
colors.primary[400]  // Lighter shade

// Success colors (Green)
colors.success[500]  // #10b981 - Main success color

// Warning colors (Amber)
colors.warning[500]  // #f59e0b - Main warning color

// Error colors (Red)
colors.error[600]    // #dc2626 - Main error color

// Semantic shortcuts
colors.background.primary    // #ffffff
colors.text.primary         // #1f2937
colors.border.light         // #e5e7eb
```

### Spacing

```typescript
import { spacing } from '@/v8/styles/designTokens';

spacing[0]   // 0
spacing[1]   // 4px
spacing[2]   // 8px
spacing[3]   // 12px
spacing[4]   // 16px
spacing[6]   // 24px
spacing[8]   // 32px
```

### Typography

```typescript
import { typography } from '@/v8/styles/designTokens';

typography.fontSize.base     // 14px
typography.fontSize.lg       // 16px
typography.fontWeight.medium // 500
```

---

## Style Utilities

Style utilities in `styleUtils.ts` make it easy to use design tokens:

### Layout Utilities

```typescript
import { flex, gap, padding, margin } from '@/v8/styles/styleUtils';

// Flexbox layouts
<div style={flex.row()}>...</div>
<div style={flex.column()}>...</div>
<div style={flex.center()}>...</div>
<div style={flex.between()}>...</div>

// Gap spacing
<div style={{...flex.row(), ...gap(4)}}>...</div>

// Padding
<div style={padding.all(6)}>...</div>
<div style={padding.x(4)}>...</div>  // Horizontal
<div style={padding.y(3)}>...</div>  // Vertical

// Margin
<div style={margin.bottom(6)}>...</div>
```

### Button Styles

```typescript
import { button } from '@/v8/styles/styleUtils';

<button style={button.primary(disabled)}>Primary</button>
<button style={button.success(disabled)}>Success</button>
<button style={button.warning(disabled)}>Warning</button>
<button style={button.error(disabled)}>Error</button>
<button style={button.secondary(disabled)}>Secondary</button>
```

### Input Styles

```typescript
import { input } from '@/v8/styles/styleUtils';

<input style={input.base(disabled)} />
```

### Card Styles

```typescript
import { card } from '@/v8/styles/styleUtils';

<div style={card.base()}>...</div>
<div style={card.interactive()}>...</div>  // With hover effect
```

### Badge Styles

```typescript
import { badge } from '@/v8/styles/styleUtils';

<span style={badge.success()}>Active</span>
<span style={badge.warning()}>Pending</span>
<span style={badge.error()}>Failed</span>
<span style={badge.info()}>Info</span>
<span style={badge.neutral()}>Default</span>
```

### Alert Styles

```typescript
import { alert } from '@/v8/styles/styleUtils';

<div style={alert.success()}>Success message</div>
<div style={alert.warning()}>Warning message</div>
<div style={alert.error()}>Error message</div>
<div style={alert.info()}>Info message</div>
```

### Text Styles

```typescript
import { text } from '@/v8/styles/styleUtils';

<h1 style={text.heading(1)}>Heading 1</h1>
<h2 style={text.heading(2)}>Heading 2</h2>
<p style={text.body()}>Body text</p>
<span style={text.secondary()}>Secondary text</span>
<label style={text.label()}>Label</label>
```

---

## Migration Examples

### Before (Inline Styles)

```typescript
<button
  style={{
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: disabled ? '#9ca3af' : '#3b82f6',
    color: 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
  }}
>
  Click Me
</button>
```

### After (Design Tokens)

```typescript
import { button } from '@/v8/styles/styleUtils';

<button style={button.primary(disabled)}>
  Click Me
</button>
```

**Benefits:**
- ✅ 12 lines → 1 line
- ✅ Consistent styling
- ✅ Type-safe
- ✅ Easy to maintain

---

## Helper Functions

### Merge Styles

```typescript
import { mergeStyles, button, padding } from '@/v8/styles/styleUtils';

<button style={mergeStyles(
  button.primary(false),
  padding.x(6),
  { marginTop: '20px' }
)}>
  Custom Button
</button>
```

### Conditional Styles

```typescript
import { conditionalStyle } from '@/v8/styles/styleUtils';

<div style={conditionalStyle(
  isActive,
  { background: colors.primary[500] },
  { background: colors.gray[200] }
)}>
  Content
</div>
```

### Focus Styles

```typescript
import { focusStyles } from '@/v8/styles/styleUtils';

<input style={{
  ...input.base(),
  ...focusStyles('primary')
}} />
```

---

## Best Practices

### ✅ DO

- Use design tokens for all colors, spacing, and typography
- Use style utilities for common patterns
- Keep inline styles minimal
- Use semantic color names (primary, success, warning, error)
- Merge styles when needed

### ❌ DON'T

- Hard-code color values (#3b82f6)
- Hard-code spacing values (16px, 24px)
- Duplicate style patterns
- Use magic numbers
- Mix design systems

---

## Component Examples

### Section Component

```typescript
import { card, text, flex, gap } from '@/v8/styles/styleUtils';

export const MySection: React.FC = () => {
  return (
    <div style={card.base()}>
      <h2 style={text.heading(2)}>Section Title</h2>
      <div style={{...flex.column(), ...gap(4)}}>
        <p style={text.body()}>Content here</p>
      </div>
    </div>
  );
};
```

### Button with Custom Styles

```typescript
import { button, mergeStyles } from '@/v8/styles/styleUtils';

<button style={mergeStyles(
  button.primary(disabled),
  { width: '100%' }
)}>
  Full Width Button
</button>
```

---

## Migration Checklist

When migrating a component to V3 style system:

1. ✅ Import design tokens and utilities
2. ✅ Replace hard-coded colors with `colors.*`
3. ✅ Replace hard-coded spacing with `spacing[*]`
4. ✅ Use style utilities for common patterns
5. ✅ Remove duplicate inline styles
6. ✅ Test component appearance
7. ✅ Verify responsive behavior

---

## Resources

- **Design Tokens:** `src/v8/styles/designTokens.ts`
- **Style Utilities:** `src/v8/styles/styleUtils.ts`
- **Component Examples:** `src/v8/components/sections/`

---

## Support

For questions or issues with the V3 style system:
1. Check this style guide
2. Review existing section components for examples
3. Refer to design tokens documentation
4. Ask the team for guidance

---

**Last Updated:** 2026-01-27  
**Version:** 3.0.0
