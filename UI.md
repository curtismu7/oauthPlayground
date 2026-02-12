# Windsurf Framework/Layout Expectations for Portal Apps

**Last Updated**: February 12, 2026  
**Version**: 1.0.0  
**Purpose**: Complete framework and layout expectations for Windsurf portal applications

---

## 🏗️ **Core Framework Structure**

### **1. React + TypeScript Foundation**

```
src/pages/protect-portal/
├── ProtectPortalApp.tsx          # Main application component
├── components/                   # Reusable UI components
├── themes/                      # Company theme system
├── types/                       # TypeScript interfaces
└── layouts/                     # Layout wrappers
```

### **2. Styled-Components for Styling**

```typescript
import styled from 'styled-components';

const ComponentContainer = styled.div`
  background: var(--brand-primary);
  color: var(--brand-text);
  padding: var(--brand-spacing-md);
`;
```

---

## 🎨 **Company Theme System**

### **1. Brand Theme Interface**

```typescript
interface BrandTheme {
  name: string;
  displayName: string;
  portalName: string;
  logo: {
    url: string;
    alt: string;
    width: string;
    height: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    // Additional theme colors
    primaryLight: string;
    primaryDark: string;
    secondaryLight: string;
    secondaryDark: string;
    errorLight: string;
    warningLight: string;
    successLight: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    bodyFont: string;
    weights: {
      light: number;
      normal: number;
      medium: number;
      bold: number;
    };
    sizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  brandSpecific: {
    messaging: {
      welcome: string;
      security: string;
      success: string;
      error: string;
    };
    layout: {
      navigationHeight?: string;
      heroHeight?: string;
      useFullWidthLayout?: boolean;
      showNavigation?: boolean;
      showHero?: boolean;
      showFooter?: boolean;
      contentMaxWidth?: string;
      contentPadding?: string;
    };
  };
}
```

### **2. CSS Custom Properties System**

```css
:root {
  --brand-primary: #0033A0;
  --brand-secondary: #FFFFFF;
  --brand-accent: #E31937;
  --brand-background: #FFFFFF;
  --brand-surface: #FFFFFF;
  --brand-text: #1F2937;
  --brand-text-secondary: #6B7280;
  --brand-font-family: "Owners Bold", "Helvetica Neue", Arial, sans-serif;
  --brand-heading-font: "Owners Bold", "Helvetica Neue", Arial, sans-serif;
  --brand-body-font: "Inter", system-ui, sans-serif;
  --brand-spacing-xs: 0.25rem;
  --brand-spacing-sm: 0.5rem;
  --brand-spacing-md: 1rem;
  --brand-spacing-lg: 1.5rem;
  --brand-spacing-xl: 2rem;
  --brand-spacing-xxl: 3rem;
  --brand-radius-sm: 0.25rem;
  --brand-radius-md: 0.5rem;
  --brand-radius-lg: 0.75rem;
  --brand-radius-xl: 1rem;
}
```

---

## 🏢 **Company-Specific Layout Patterns**

### **1. American Airlines Layout**

```typescript
// Hero section with patriotic branding
const HeroContainer = styled.section`
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
  padding: 2rem 2rem;
  text-align: center;
  color: white;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    background: url('data:image/svg+xml,<svg>...</svg>');
    opacity: 0.3;
  }
`;
```

**Characteristics:**
- Patriotic color scheme (American Blue #0033A0, American Red #E31937)
- "Owners Bold" font family for brand authenticity
- Hero section with subtle grid pattern overlay
- Professional aviation industry styling

### **2. Southwest Airlines Layout**

```typescript
// Clean white background with subtle branding
const HeroContainer = styled.div`
  width: 100%;
  background: white;
  position: relative;
  overflow: hidden;
`;

const HeroBackground = styled.div`
  position: absolute;
  background: linear-gradient(135deg, rgba(46, 75, 177, 0.02) 0%, rgba(229, 29, 35, 0.01) 100%);
  opacity: 1;
`;
```

**Characteristics:**
- Clean white background with minimal branding
- Southwest blue and red accent colors
- "Transfarency®" messaging and service focus
- Simple, user-friendly interface design

### **3. FedEx Layout**

```typescript
// Professional logistics theme
const HeroContainer = styled.div`
  background: linear-gradient(135deg, #4D148C 0%, #FF6600 100%);
  color: white;
  padding: 3rem 2rem;
`;
```

**Characteristics:**
- FedEx purple (#4D148C) and orange (#FF6600) brand colors
- Professional logistics and shipping theme
- Bold, confident typography
- Service-oriented layout

---

## 📱 **Responsive Design Framework**

### **1. Mobile-First Approach**

```typescript
const ResponsiveContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
  
  @media (min-width: 1024px) {
    padding: 3rem;
  }
`;
```

### **2. Component Responsiveness**

```typescript
const HeroTitle = styled.h1`
  font-size: 2rem;
  line-height: 1.2;
  
  @media (min-width: 768px) {
    font-size: 3rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 4rem;
  }
`;
```

**Breakpoints:**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

---

## 🎯 **SWE-15 Compliance Framework**

### **1. Single Responsibility Principle**

```typescript
// Each component has one clear purpose
const CompanyHeader: React.FC<CompanyHeaderProps> = ({ showBrandSelector }) => {
  // Only handles header display and branding
};

const HeroSection: React.FC<HeroProps> = ({ company, onLoginStart }) => {
  // Only handles hero content and login initiation
};
```

### **2. Open/Closed Principle**

```typescript
// Extensible theme system
interface BrandTheme {
  // Core properties that all themes must implement
  name: string;
  colors: ColorPalette;
  typography: TypographySystem;
  
  // Extensible brand-specific properties
  brandSpecific: {
    [key: string]: any; // Allows extension without modification
  };
}
```

### **3. Dependency Inversion**

```typescript
// Components depend on theme abstractions
const ThemedComponent: React.FC<ThemedComponentProps> = ({ theme, children }) => {
  const currentTheme = useBrandTheme(); // Injected dependency
  return <div style={{ color: currentTheme.colors.primary }}>{children}</div>;
};
```

---

## 🔧 **Component Architecture**

### **1. Main App Structure**

```typescript
const ProtectPortalApp: React.FC = () => {
  return (
    <BrandThemeProvider>
      <PortalContainer>
        <CompanyHeader showBrandSelector={true} />
        <PortalContent>
          {/* Dynamic hero component based on theme */}
          <DynamicHero />
        </PortalContent>
      </PortalContainer>
    </BrandThemeProvider>
  );
};
```

### **2. Theme-Specific Components**

```typescript
// Each company has its own hero component
const AmericanAirlinesHero: React.FC<HeroProps> = ({ onLoginStart }) => {
  const theme = useBrandTheme();
  return (
    <HeroContainer>
      <HeroContent>
        <HeroTitle>American Airlines Employee Portal</HeroTitle>
        <CustomLoginForm onLoginStart={onLoginStart} />
      </HeroContent>
    </HeroContainer>
  );
};
```

---

## 📋 **Expected File Structure**

```
src/pages/protect-portal/
├── ProtectPortalApp.tsx              # Main application
├── components/
│   ├── CompanyHeader.tsx              # Header with logo and branding
│   ├── AmericanAirlinesHero.tsx       # AA-specific hero
│   ├── SouthwestAirlinesHero.tsx      # SW-specific hero
│   ├── FedExAirlinesHero.tsx          # FedEx-specific hero
│   ├── CustomLoginForm.tsx             # Login form component
│   └── BrandDropdownSelector.tsx      # Theme switcher
├── themes/
│   ├── theme-provider.tsx            # Theme context provider
│   ├── brand-theme.interface.ts       # Theme interface definitions
│   ├── american-airlines.theme.ts     # AA theme configuration
│   ├── southwest-airlines.theme.ts    # SW theme configuration
│   ├── fedex.theme.ts                 # FedEx theme configuration
│   └── pingidentity.theme.ts          # Default theme
├── types/
│   └── protectPortal.types.ts         # TypeScript interfaces
└── layouts/
    └── PortalPageLayout.tsx           # Layout wrapper
```

---

## 🎨 **Key Design Principles**

### **1. Brand Authenticity**

- ✅ Use actual company colors and fonts
- ✅ Match real website layouts and patterns
- ✅ Follow brand guidelines and messaging
- ✅ Implement authentic company logos and branding

### **2. Responsive Design**

- ✅ Mobile-first approach
- ✅ Flexible layouts that work on all devices
- ✅ Touch-friendly interactions
- ✅ Optimized for various screen sizes

### **3. Accessibility**

- ✅ WCAG compliant design
- ✅ Proper ARIA labels and semantic HTML
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility

### **4. Performance**

- ✅ Optimized images and assets
- ✅ Efficient CSS with custom properties
- ✅ Lazy loading for large components
- ✅ Minimal bundle size impact

---

## 🚀 **Implementation Checklist**

For any new portal app, Windsurf expects:

### **✅ Theme System**
- [ ] Complete brand theme with CSS custom properties
- [ ] Brand-specific color palette and typography
- [ ] Logo implementation and brand messaging
- [ ] Theme switching functionality

### **✅ Responsive Layout**
- [ ] Mobile-first design with breakpoints
- [ ] Flexible layouts for all screen sizes
- [ ] Touch-friendly interactions
- [ ] Proper viewport meta tags

### **✅ Component Architecture**
- [ ] SWE-15 compliant components
- [ ] Single responsibility principle
- [ ] Interface segregation
- [ ] Dependency inversion

### **✅ Type Safety**
- [ ] Full TypeScript interfaces and typing
- [ ] Proper prop interfaces for all components
- [ ] Type-safe theme system
- [ ] Error boundary implementation

### **✅ Brand Consistency**
- [ ] Authentic company branding and messaging
- [ ] Consistent use of brand colors and fonts
- [ ] Proper logo implementation
- [ ] Brand guidelines adherence

### **✅ Accessibility**
- [ ] WCAG compliant design and navigation
- [ ] Proper ARIA labels and semantic HTML
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility

### **✅ Performance**
- [ ] Optimized loading and rendering
- [ ] Efficient CSS with custom properties
- [ ] Lazy loading for large components
- [ ] Minimal bundle size impact

### **✅ Documentation**
- [ ] Clear component documentation
- [ ] TypeScript interface documentation
- [ ] Theme configuration documentation
- [ ] Implementation guidelines

---

## 🎨 **Company Theme Examples**

### **American Airlines Theme**
```typescript
export const americanAirlinesTheme: BrandTheme = {
  name: 'american-airlines',
  displayName: 'American Airlines',
  portalName: 'American Airlines Employee Portal',
  colors: {
    primary: '#0033A0', // American Blue
    secondary: '#FFFFFF', // White
    accent: '#E31937', // American Red
    // ... additional colors
  },
  typography: {
    fontFamily: '"Owners Bold", "Helvetica Neue", Arial, sans-serif',
    headingFont: '"Owners Bold", "Helvetica Neue", Arial, sans-serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    // ... typography settings
  },
  brandSpecific: {
    messaging: {
      welcome: 'Welcome to American Airlines Employee Portal',
      security: 'Secure access to your American Airlines account',
      // ... messaging
    }
  }
};
```

### **Southwest Airlines Theme**
```typescript
export const southwestAirlinesTheme: BrandTheme = {
  name: 'southwest-airlines',
  displayName: 'Southwest Airlines',
  portalName: 'Southwest Airlines Employee Portal',
  colors: {
    primary: '#464EB8', // Southwest Blue
    secondary: '#FFFFFF', // White
    accent: '#E51B24', // Southwest Red
    // ... additional colors
  },
  brandSpecific: {
    layout: {
      useFullWidthLayout: true,
      showNavigation: true,
      // ... layout settings
    }
  }
};
```

---

## 🔍 **Quality Assurance**

### **Before Release Checklist**

- [ ] All TypeScript errors resolved
- [ ] All linting issues fixed
- [ ] Components follow SWE-15 principles
- [ ] Themes are responsive and accessible
- [ ] Authentication flow works end-to-end
- [ ] Error handling is comprehensive
- [ ] No console errors or warnings
- [ ] Brand consistency verified
- [ ] Cross-browser testing completed
- [ ] Performance optimization completed

### **Testing Requirements**

- [ ] Unit tests for critical components
- [ ] Integration tests for theme switching
- [ ] Responsive design testing on all devices
- [ ] Accessibility audit (WCAG compliance)
- [ ] Cross-browser compatibility testing
- [ ] Performance testing and optimization
- [ ] Security review completed

---

## 📚 **Additional Resources**

### **Documentation**
- [SWE-15_PROTECT_PORTAL_GUIDE.md](./SWE-15_PROTECT_PORTAL_GUIDE.md) - SWE-15 compliance guide
- [PROTECT_PORTAL_INVENTORY.md](./PROTECT_PORTAL_INVENTORY.md) - Issue tracking and prevention
- [PingOne Protect Documentation](https://docs.pingidentity.com/pingone/protect/v1/api/) - API reference

### **Tools & Utilities**
- **Theme Validator**: Ensures themes follow brand guidelines
- **Flow Tester**: Tests complete authentication flows
- **Performance Monitor**: Tracks component rendering performance
- **Accessibility Auditor**: Validates WCAG compliance

---

**Remember**: Always follow the SWE-15 principles and brand guidelines when implementing portal applications. This framework ensures consistent, maintainable, and brand-authentic portal applications that scale across multiple companies and use cases.
