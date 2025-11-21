---
title: UI Accessibility Rules
inclusion: always
---

# UI Accessibility and Readability Rules

## Text Contrast Requirements

### CRITICAL: Never Use Dark Text on Dark Backgrounds
❌ **FORBIDDEN COMBINATIONS:**
- Black text (#000000, #1f2937, #374151) on dark backgrounds (#1e293b, #0f172a, #334155)
- Dark gray text on medium gray backgrounds
- Any text color that doesn't meet WCAG AA contrast ratio (4.5:1 for normal text)

✅ **REQUIRED COMBINATIONS:**
- Dark text on light backgrounds (white, #f9fafb, #f3f4f6, #e5e7eb)
- Light text on dark backgrounds (white, #f9fafb on #1f2937, #0f172a)
- Use light greys (#f9fafb, #f3f4f6) for shading instead of pure white

### Color Palette for V8

**Light Backgrounds (for dark text):**
- `#ffffff` - Pure white (use sparingly)
- `#f9fafb` - Light grey (preferred for backgrounds)
- `#f3f4f6` - Slightly darker grey (for shading/depth)
- `#e5e7eb` - Border grey

**Dark Text Colors:**
- `#1f2937` - Primary dark text
- `#374151` - Secondary dark text
- `#6b7280` - Tertiary/muted text

**Dark Backgrounds (for light text):**
- `#1f2937` - Primary dark background
- `#0f172a` - Deeper dark background

**Light Text Colors:**
- `#ffffff` - White text
- `#f9fafb` - Off-white text

## Code Comments Required

When setting text colors, ALWAYS add a comment:
```typescript
// ✅ GOOD - Comment explains contrast
style={{
  color: '#1f2937',  // Dark text on light background
  background: '#f9fafb'  // Light grey background
}}

// ❌ BAD - No comment, unclear contrast
style={{
  color: '#1f2937',
  background: '#334155'  // This would be unreadable!
}}
```

## Shading and Depth

Use light greys for visual hierarchy instead of pure white:
```typescript
// ✅ GOOD - Subtle shading with light greys
<div style={{ background: '#f9fafb' }}>  // Main background
  <div style={{ background: '#f3f4f6' }}>  // Nested/shaded area
    <div style={{ background: '#e5e7eb' }}>  // Border/separator
```

## Testing Checklist

Before committing UI code:
- [ ] Check all text is readable on its background
- [ ] Use browser DevTools to verify contrast ratios
- [ ] Test in both light and dark mode (if applicable)
- [ ] Add comments explaining color choices
- [ ] Use light greys (#f9fafb, #f3f4f6) for shading

## Tools

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Inspect element → Accessibility tab → Contrast ratio

## Examples

### Modal Headers
```typescript
// ✅ GOOD
<div style={{
  background: 'linear-gradient(to right, #fef3c7 0%, #fde68a 100%)',  // Light yellow
  color: '#92400e'  // Dark brown text - high contrast
}}>
```

### Info Boxes
```typescript
// ✅ GOOD
<div style={{
  background: '#dbeafe',  // Light blue
  border: '1px solid #93c5fd',  // Medium blue border
  color: '#1e40af'  // Dark blue text - high contrast
}}>
```

### Form Inputs
```typescript
// ✅ GOOD
<input style={{
  background: '#ffffff',  // White input
  color: '#1f2937',  // Dark text
  border: '1px solid #d1d5db'  // Grey border
}} />
```

---

**Last Updated:** 2024-11-16  
**Version:** 1.0.0  
**Status:** Active - All UI code must follow these rules
