# Protect Portal Companies Guide

## Overview

The Protect Portal features comprehensive corporate branding support for major airlines and financial institutions. Each company theme is carefully designed to match official brand guidelines and provide an authentic user experience.

## 🎨 **Supported Companies**

### **1. American Airlines**
- **Theme Name**: `american-airlines`
- **Portal Name**: American Airlines Employee Portal
- **Primary Colors**: 
  - American Blue: `#0b4aa2`
  - American Red: `#e11d48`
- **Typography**: Corporate sans-serif font family
- **Design Elements**: Patriotic color scheme, aviation-focused styling
- **Logo**: Official American Airlines eagle logo
- **User Experience**: Professional airline employee portal with flight operations focus

### **2. United Airlines**
- **Theme Name**: `united-airlines`
- **Portal Name**: United Airlines Employee Portal
- **Primary Colors**:
  - United Blue: `#0033A0`
  - United Orange: `#FF6600`
- **Typography**: Clean, modern sans-serif
- **Design Elements**: Global airline branding, world map motifs
- **Logo**: Official United Airlines globe logo
- **User Experience**: Global airline operations with international focus

### **3. FedEx**
- **Theme Name**: `fedex`
- **Portal Name**: FedEx Employee Portal
- **Primary Colors**:
  - FedEx Purple: `#4D148C`
  - FedEx Orange: `#FF6600`
- **Typography**: FedSans custom font family
- **Design Elements**: Hidden arrow in logo, shipping/package themes
- **Logo**: Official FedEx logo with purple and orange
- **User Experience**: Logistics and shipping operations focus

### **4. Southwest Airlines**
- **Theme Name**: `southwest-airlines`
- **Portal Name**: Southwest Airlines Employee Portal
- **Primary Colors**:
  - Southwest Blue: `#1D4ED8`
  - Southwest Red: `#DC2626`
  - Southwest Gold: `#F59E0B`
- **Typography**: Friendly, approachable sans-serif
- **Design Elements**: Heart logo, casual yet professional
- **Logo**: Official Southwest Airlines heart logo
- **User Experience**: Customer-focused airline operations

### **5. Bank of America**
- **Theme Name**: `bank-of-america`
- **Portal Name**: Bank of America Employee Portal
- **Primary Colors**:
  - Bank of America Blue: `#0033A0`
  - Bank of America Red: `#E31937`
- **Typography**: Professional corporate font family
- **Design Elements**: Flag logo, banking themes, financial security
- **Logo**: Official Bank of America flag logo
- **User Experience**: Secure banking and financial operations

### **6. PingIdentity**
- **Theme Name**: `pingidentity`
- **Portal Name**: PingIdentity Employee Portal
- **Primary Colors**:
  - Ping Blue: `#0066CC`
  - Ping Green: `#00A652`
- **Typography**: Modern tech-focused sans-serif
- **Design Elements**: Identity and security themes
- **Logo**: Official PingIdentity logo
- **User Experience**: Identity and access management focus

## 🎯 **Theme Features**

### **Consistent Components**
All themes include:
- **Responsive Header**: Company logo, portal name, brand selector
- **Navigation**: Consistent menu structure across all themes
- **Authentication**: Custom login forms with brand styling
- **Risk Evaluation**: PingOne Protect integration with brand colors
- **Token Display**: Secure token information display
- **Error Handling**: Brand-consistent error messages and styling

### **Brand-Specific Elements**
- **Color Schemes**: Official brand colors and palettes
- **Typography**: Corporate font families and weights
- **Logo Integration**: Official company logos with proper sizing
- **Iconography**: Brand-appropriate icon sets
- **Visual Hierarchy**: Consistent with brand guidelines

## 🔧 **Technical Implementation**

### **Theme Structure**
Each theme follows the `BrandTheme` interface:

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
    text: string;
    colors?: Record<string, string>;
  };
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    // ... more color definitions
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    bodyFont: string;
    weights: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: string;
}
```

### **CSS Custom Properties**
Themes use CSS custom properties for dynamic styling:

```css
:root {
  --brand-primary: #0b4aa2;
  --brand-primary-dark: #073a80;
  --brand-secondary: #111827;
  --brand-accent: #e11d48;
  --brand-background: #ffffff;
  --brand-surface: #ffffff;
  --brand-text: #1F2937;
  --brand-text-secondary: #6B7280;
  --brand-heading-font: 'Inter', sans-serif;
  --brand-body-font: 'Inter', sans-serif;
  --brand-radius-sm: 0.375rem;
  --brand-radius-md: 0.5rem;
  --brand-radius-lg: 0.75rem;
  --brand-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --brand-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --brand-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --brand-transition: all 0.15s ease-in-out;
}
```

### **Theme Switching**
Dynamic theme switching is handled by the `BrandThemeProvider`:

```typescript
const { activeTheme, setTheme } = useBrandTheme();

// Switch to American Airlines theme
setTheme(americanAirlinesTheme);

// Switch to United Airlines theme
setTheme(unitedAirlinesTheme);
```

## 🎨 **Design Guidelines**

### **Logo Sizing**
- **Standard Size**: 120px width × 40px height
- **Mobile Size**: 100px width × 35px height
- **Hover Effect**: Subtle scale (1.02) on hover
- **Loading State**: Placeholder with company name

### **Typography Hierarchy**
- **Portal Title**: 1.25rem, font-weight 600
- **Section Headers**: 1.125rem, font-weight 600
- **Body Text**: 0.875rem, font-weight 400
- **Button Text**: 0.8rem, font-weight 500

### **Spacing Guidelines**
- **Header Padding**: 1rem 1.5rem
- **Section Spacing**: 2rem between sections
- **Component Spacing**: 1rem between components
- **Button Padding**: 0.375rem 0.75rem

### **Color Usage**
- **Primary**: Main brand color for actions and highlights
- **Secondary**: Background and surface colors
- **Accent**: Secondary brand color for emphasis
- **Text**: High contrast for readability
- **Borders**: Subtle borders using brand colors

## 🔐 **Security Considerations**

### **Brand Consistency**
- All themes maintain consistent security patterns
- Risk evaluation displays use brand-appropriate colors
- Error states use brand-consistent styling
- Success states use brand green variations

### **Accessibility**
- WCAG 2.1 AA compliance across all themes
- High contrast ratios for text
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators using brand colors

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Mobile Adaptations**
- Simplified header layout
- Collapsible navigation
- Touch-friendly button sizes
- Optimized logo sizing
- Streamlined content flow

## 🚀 **Performance Optimization**

### **Theme Loading**
- Lazy loading of theme assets
- CSS custom properties for fast switching
- Optimized logo loading with fallbacks
- Minimal repaints during theme changes

### **Asset Optimization**
- Compressed logo images
- CSS minification
- Font loading optimization
- Bundle size optimization

## 🔄 **Theme Maintenance**

### **Brand Updates**
- Monitor brand guideline changes
- Update color palettes as needed
- Refresh logo assets periodically
- Test theme consistency

### **Quality Assurance**
- Cross-browser testing
- Device testing
- Accessibility validation
- Performance monitoring

## 📞 **Support and Documentation**

### **Developer Resources**
- Theme development guide
- Component styling documentation
- Brand asset management
- Testing procedures

### **User Documentation**
- Theme switching guide
- Brand feature overview
- Accessibility features
- Troubleshooting guide

---

## 🎯 **Best Practices**

### **For Developers**
1. **Use CSS Custom Properties**: Always use `--brand-*` variables
2. **Maintain Consistency**: Follow brand guidelines strictly
3. **Test Responsively**: Ensure themes work on all devices
4. **Consider Accessibility**: Maintain WCAG compliance
5. **Performance**: Optimize asset loading and rendering

### **For Designers**
1. **Brand Guidelines**: Follow official brand standards
2. **Color Consistency**: Use official brand colors
3. **Typography**: Maintain brand font families
4. **Logo Usage**: Follow logo usage guidelines
5. **User Experience**: Create intuitive, brand-consistent interfaces

---

**Last Updated**: February 15, 2026  
**Version**: 1.0  
**Compatible with**: Protect Portal v9.6.6+
