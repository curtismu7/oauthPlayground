# pingUI.md — MasterFlow API Ping UI (End-User Nano + Astro Nano)

This document is the *implementation guide* for adopting **MasterFlow API Ping UI** in our app using **End-User Nano** (components/layout/utilities) and **Astro Nano** (icons).

It merges:
- Our internal “MasterFlow API Ping UI Design Plan” (uploaded) and
- The practical integration notes from **pingone-davinci-ui-templates** (public reference templates).

---

## 1) What “Ping Authentic” means

- Use Ping’s **official CSS framework** for a first-party PingOne look & feel.
- Use Ping’s **Material Design Icons subset** (`mdi-` icon classes).
- Prefer Ping’s **Bootstrap-like grid** and Ping component classes (cards/forms/buttons/utilities).
- Keep the entire app UI under a single **`.end-user-nano`** namespace wrapper to avoid style collisions.

---

## 2) Required CSS includes (load once)

### Recommended versions (match our plan)
Include these **exactly once** in the app shell / base layout:

```html
<link rel="stylesheet" href="https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css">
<link rel="stylesheet" href="https://assets.pingone.com/ux/end-user-nano/0.1.0-alpha.9/end-user-nano.css">
```

### Notes from the DaVinci UI templates repo
The `pingone-davinci-ui-templates` README historically referenced older versions (alpha.1 / alpha.4). If you see those in the repo or older examples, **do not mix versions** in a real app—choose a single icon version and keep it consistent.

---

## 3) Required wrapper / scoping

Wrap the root of the rendered UI:

```html
<div class="end-user-nano">
  <!-- entire app -->
</div>
```

Rules:
- Do not apply global overrides outside `.end-user-nano`.
- If the app is embedded, ensure the wrapper is applied *inside* the embed root to prevent leaking styles outward.

---

## 4) Logo handling (`.companyLogo`)

The DaVinci UI templates expect a `companyLogo` class and even provide a default implementation.
Use **one** logo stylesheet (or a small section in your overrides) like:

```css
/* ping-overrides.css (scoped) */
.end-user-nano .companyLogo {
  /* Replace with our app/company logo if needed */
  content: url("https://assets.pingone.com/ux/ui-library/5.0.2/images/logo-pingidentity.png");
  width: 65px;
  height: 65px;
}
```

Guidance:
- Keep logo sizing consistent (avoid layout shift across screens).
- If we use a local asset, prefer a stable URL or bundled asset path.
- make sure you use existing services, do not use new code or build new services

---

## 5) Placeholders convention (templates repo)

The DaVinci UI template snippets use a consistent placeholder pattern:
- Text to customize is surrounded by double underscores, e.g. `__TITLE_TEXT__`.

When adapting snippets, replace placeholders with:
- localized strings (if applicable)
- app-specific copy
- collector-provided labels/help/error messages

---

## 6) Component standards (what to use)

### Layout
- `.container`, `.row`, `.col-md-*` for page structure
- Use spacing utilities (`mt-*`, `mb-*`, `me-*`, etc.) instead of bespoke margins
- Prefer responsive columns for “side-nav + content” layouts

### Cards
Use cards for almost all flow surfaces:

- `.card`, `.card-header`, `.card-body`, `.card-title`

### Forms
Use standard Ping form patterns:

- `.form-label`, `.form-control`
- Provide helper text and inline validation feedback
- Ensure `label` is programmatically associated with inputs (id/for or aria attributes)

### Buttons
- `.btn`, `.btn-primary`, `.btn-outline-primary`
- Keep primary action singular per screen, secondary actions visually secondary

### Nav/list patterns (OAuth-like layouts)
- Top nav: `.navbar`, `.navbar-brand`
- Left nav: `.list-group`, `.list-group-item`
- Active state: `.active` where supported, or a minimal scoped override

---

## 7) Icons (Astro Nano / MDI)

- Use **`mdi-`** prefixed icon classes (Material Design Icons subset).
- Replace emojis/custom icons in key flows with MDI classes.
- Common examples:
  - `mdi-cellphone`
  - `mdi-fingerprint`
  - `mdi-email-outline`
  - `mdi-account-key-outline`

---

## 8) Allowed custom CSS (keep it tiny)

Create **one** scoped overrides file (example: `ping-overrides.css`) and load it *after* Ping CSS.

Allowlist:
- Selected/hover states for “device selection” tiles/cards
- Minor spacing/layout fixes where the app’s DOM doesn’t perfectly match template assumptions
- Optional brand helpers (logo, app shell spacing)

Rules:
- Scope everything under `.end-user-nano`.
- Avoid “re-theming” the design system—prefer the native classes/utilities.
- Delete dead CSS aggressively.

---

## 9) Implementation checklist

### Integration
- [ ] `icons.css` and `end-user-nano.css` are included once in the base layout
- [ ] Entire app is wrapped by `.end-user-nano`
- [ ] `ping-overrides.css` exists and is loaded last

### UX consistency
- [ ] Buttons/inputs/cards use Ping classes
- [ ] Grid + spacing utilities replace bespoke layout CSS
- [ ] MDI icons are used consistently (no mixed icon sets)

### Accessibility
- [ ] Visible focus states
- [ ] Keyboard navigation intact
- [ ] Input errors are associated with inputs (aria-describedby / id/for)
- [ ] No layout shift when showing validation messages

---

## 10) Reference: our original plan

Below is the original “Ping Authentic UI Design Plan” content, included for completeness.

---

# Ping Authentic UI Design Plan

This plan presents a third design option that leverages Ping's official CSS framework (Astro Nano and End-User Nano) to create an authentic PingOne experience that aligns with their design system and brand standards.

## Design Philosophy: "Ping Authentic"

### **Brand Alignment**
- Uses Ping's official CSS framework for authentic look and feel
- Leverages Ping's icon system (Material Design Icons subset)
- Follows Ping's color palette and typography standards
- Maintains consistency with actual PingOne admin console

### **Key Characteristics**
- **Official Ping Components**: Uses Ping's CSS classes and utilities
- **Authentic Icons**: Ping's MDI icon subset for consistency
- **Responsive Grid**: Ping's Bootstrap-inspired grid system
- **Professional Polish**: Production-ready enterprise styling
- **Accessibility**: Built-in accessibility features from Ping's framework

## Technical Implementation

### **CSS Framework Integration**
```html
<!-- Ping's Official CSS -->
<link rel="stylesheet" href="https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css">
<link rel="stylesheet" href="https://assets.pingone.com/ux/end-user-nano/0.1.0-alpha.9/end-user-nano.css">
```

### **Icon System**
- Uses `mdi-` prefixed classes for Material Design Icons
- Available icons: `mdi-cellphone`, `mdi-fingerprint`, `mdi-email-outline`, `mdi-account-key-outline`
- Consistent with Ping's icon usage patterns

### **CSS Classes**
- Uses `.end-user-nano` namespace for all components
- Bootstrap-inspired utility classes (`.container`, `.row`, `.col-md-*`)
- Ping-specific component classes

## Design Option 3: "Ping Authentic"

### **MFA Flow Example**
```html
<div class="end-user-nano">
  <div class="container">
    <div class="row">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">
              <i class="mdi-fingerprint me-2"></i>
              MFA Device Registration
            </h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="card device-card selected">
                  <div class="card-body text-center">
                    <i class="mdi-cellphone mdi-3x text-primary mb-3"></i>
                    <h5>SMS Authentication</h5>
                    <p class="text-muted">Fast setup, widely supported</p>
                    <span class="badge bg-success">Popular</span>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card device-card">
                  <div class="card-body text-center">
                    <i class="mdi-fingerprint mdi-3x text-info mb-3"></i>
                    <h5>FIDO2 Security Key</h5>
                    <p class="text-muted">Hardware-based authentication</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### **OAuth Flow Example**
```html
<div class="end-user-nano">
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">
      <a class="navbar-brand" href="#">
        <i class="mdi-account-key-outline me-2"></i>
        PingOne Playground
      </a>
    </div>
  </nav>
  
  <div class="container mt-4">
    <div class="row">
      <div class="col-md-3">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">OAuth Flows</h6>
          </div>
          <div class="list-group list-group-flush">
            <a href="#" class="list-group-item list-group-item-action active">
              <i class="mdi-key me-2"></i>
              Authorization Code
              <small class="text-muted d-block">PKCE enabled</small>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
              <i class="mdi-code-braces me-2"></i>
              Client Credentials
              <small class="text-muted d-block">Machine-to-machine</small>
            </a>
          </div>
        </div>
      </div>
      
      <div class="col-md-9">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">Authorization Code Flow Configuration</h5>
            <span class="badge bg-primary ms-auto">Ready</span>
          </div>
          <div class="card-body">
            <form class="row g-3">
              <div class="col-md-6">
                <label for="envId" class="form-label">Environment ID</label>
                <input type="text" class="form-control" id="envId" placeholder="ping-one-env-id">
              </div>
              <div class="col-md-6">
                <label for="clientId" class="form-label">Client ID</label>
                <input type="text" class="form-control" id="clientId" placeholder="your-client-id">
              </div>
              <div class="col-12">
                <button type="button" class="btn btn-outline-primary me-2">Test Configuration</button>
                <button type="button" class="btn btn-primary">Start Authorization Flow</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## CSS Styling with Ping Framework

### **Custom Ping Styles**
```css
/* Ping Authentic Custom Styles */
.end-user-nano .device-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
}

.end-user-nano .device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.end-user-nano .device-card.selected {
  border-color: #0d6efd;
  background-color: #f8f9fa;
}

.end-user-nano .navbar-brand {
  font-weight: 600;
  color: #495057;
}

.end-user-nano .list-group-item.active {
  background-color: #e7f1ff;
  border-color: #0d6efd;
  color: #0d6efd;
}

.end-user-nano .card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

/* Ping Color Palette */
:root {
  --ping-blue: #0d6efd;
  --ping-blue-light: #e7f1ff;
  --ping-green: #198754;
  --ping-orange: #fd7e14;
  --ping-gray: #6c757d;
}
```

## Page Layout & Width Settings

### Standard Page Width
All Ping UI pages use a consistent width for optimal user experience:

```css
/* Global width settings for all Ping UI pages */
.end-user-nano .ping-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}
```

### Usage in Components
```html
<div class="end-user-nano">
  <div class="ping-container">
    <!-- Page content here -->
  </div>
</div>
```

**Benefits:**
- **Consistent Layout**: All pages have the same width and spacing
- **Responsive**: Works well on different screen sizes
- **Professional**: Provides adequate space for complex forms and data
- **Accessible**: Maintains readable line lengths

## Custom Button Styling

### Light Button Variations

To provide subtle visual differentiation and better user feedback, we've implemented custom light button colors:

#### Light Red Buttons (`btn-light-red`)
- **Purpose**: Secondary actions, clearing operations, or attention-grabbing elements
- **Colors**: Light red background with dark red text
- **Use Cases**: Clear Selection, Configure Worker Token, Refresh actions

#### Light Grey Buttons (`btn-light-grey`)  
- **Purpose**: Neutral actions, primary operations, or standard interactions
- **Colors**: Light grey background with dark grey text
- **Use Cases**: Load Devices, Select All, Clear filters actions

#### Active/Pressed States
All custom buttons include visual feedback when clicked:
- **Active state**: Darker background color
- **Focus state**: Subtle shadow effect matching button color
- **Hover state**: Slightly darker background for visual feedback

### CSS Implementation

```css
/* Light button color variations */
.end-user-nano .btn-light-red {
  background-color: #f8d7da;
  border-color: #f5c2c7;
  color: #721c24;
}

.end-user-nano .btn-light-red:hover {
  background-color: #f5c2c7;
  border-color: #f1b0b7;
}

.end-user-nano .btn-light-red:active {
  background-color: #f1b0b7;
  border-color: #f1b0b7;
  transform: translateY(1px);
}

.end-user-nano .btn-light-red:focus {
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.end-user-nano .btn-light-grey {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #495057;
}

.end-user-nano .btn-light-grey:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
}

.end-user-nano .btn-light-grey:active {
  background-color: #dee2e6;
  border-color: #ced4da;
  transform: translateY(1px);
}

.end-user-nano .btn-light-grey:focus {
  box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.25);
}
```

### Usage Examples

```html
<!-- Light grey for primary actions -->
<button class="btn btn-light-grey">
  <i class="mdi-refresh me-2"></i>
  Load Devices
</button>

<!-- Light red for secondary/clearing actions -->
<button class="btn btn-light-red">
  <i class="mdi-close me-2"></i>
  Clear Selection
</button>
```

## Comparison with Previous Options

| Aspect | Option 1: Minimal | Option 2: Enterprise | Option 3: Ping Authentic |
|--------|-------------------|----------------------|-------------------------|
| **Design Source** | Custom minimal | Custom enterprise | Ping official framework |
| **Brand Consistency** | Low | Medium | **High** |
| **Development Effort** | Low | Medium | **Low** (uses existing CSS) |
| **Maintenance** | High | Medium | **Low** (Ping updates framework) |
| **Authenticity** | Low | Medium | **High** |
| **Component Library** | Custom | Custom | **Ping's built-in components** |
| **Icon System** | Emoji | Custom SVG | **Ping's MDI icons** |
| **Responsive** | Custom CSS | Custom CSS | **Ping's responsive grid** |
| **Accessibility** | Manual | Manual | **Built-in to Ping framework** |

## Implementation Strategy

### **Phase 1: Framework Integration**
1. Add Ping CSS links to HTML templates
2. Create Ping-specific component wrappers
3. Map existing components to Ping classes

### **Phase 2: Component Migration**
1. Replace custom cards with Ping card components
2. Update icons to use MDI classes
3. Apply Ping's utility classes for spacing and layout

### **Phase 3: Styling Refinement**
1. Add custom Ping brand colors
2. Fine-tune component interactions
3. Ensure responsive behavior matches Ping standards

### **Phase 4: Testing & Validation**
1. Test across different screen sizes
2. Validate accessibility compliance
3. Ensure consistency with PingOne admin console

## Benefits of Ping Authentic Approach

### **Brand Alignment**
- **Authentic Look**: Matches actual PingOne products
- **User Familiarity**: Users recognize Ping's design patterns
- **Professional Polish**: Production-ready enterprise styling

### **Development Efficiency**
- **Reduced CSS**: Leverage Ping's existing framework
- **Consistent Updates**: Ping maintains and updates the framework
- **Built-in Components**: Cards, forms, navigation already styled

### **Maintenance Advantages**
- **Framework Support**: Ping provides ongoing updates
- **Bug Fixes**: Framework issues handled by Ping team
- **Accessibility**: Built-in WCAG compliance

### **User Experience**
- **Familiar Interface**: Matches PingOne admin console
- **Professional Feel**: Enterprise-grade styling
- **Consistent Interactions**: Standard UI patterns

## Success Metrics

- **Brand Recognition**: Users immediately identify as PingOne product
- **Development Speed**: 50% faster implementation using Ping framework
- **Maintenance Reduction**: 70% less custom CSS to maintain
- **User Satisfaction**: Higher familiarity and comfort levels
- **Accessibility Score**: WCAG 2.1 AA compliance out of the box

## Recommendation

**Option 3 (Ping Authentic)** is strongly recommended for:
- Production deployments requiring brand consistency
- Teams wanting to reduce custom CSS maintenance
- Projects needing authentic PingOne look and feel
- Rapid development with professional results
- Long-term maintenance with minimal overhead

This approach provides the most authentic PingOne experience while significantly reducing development and maintenance overhead through the use of Ping's official design framework.
