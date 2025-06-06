# CSS Architecture Documentation

## Overview

This project uses a **three-layer CSS architecture** that combines design tokens, component-based styling, and utility classes. This approach provides scalability, maintainability, and consistency while avoiding the common pitfalls of CSS-at-scale.

## Architecture Layers

### 1. 🎨 Design System Layer (CSS Custom Properties)
### 2. 🏗️ Component Layer (BEM Methodology)  
### 3. ⚡ Utility Layer (Atomic CSS Classes)

---

## Layer 1: Design System (CSS Custom Properties)

### Purpose
Provides a single source of truth for all design decisions through CSS custom properties (CSS variables). This ensures consistency and makes global changes effortless.

### Location
- Primary definitions: `src/index.css` (`:root` section)
- Component-specific tokens: Individual component CSS files

### Categories

#### Color System
```css
/* Core Brand Colors */
--primary-color: #00008f;
--background-color: white;
--text-color: #343c3d;
--border-color: #e5e7eb;

/* Status Colors */
--success-color: #4caf50;
--warning-color: #ffbc11;
--danger-color: #d9534f;
```

#### Spacing System
```css
/* Consistent spacing scale */
--spacing-xs: 0.25rem;     /* 4px */
--spacing-sm: 0.375rem;    /* 6px */
--spacing-md: 0.5rem;      /* 8px */
--spacing-lg: 0.625rem;    /* 10px */
--spacing-xl: 0.9375rem;   /* 15px */
--spacing-2xl: 1.25rem;    /* 20px */
--spacing-3xl: 1.5rem;     /* 24px */
--spacing-4xl: 2rem;       /* 32px */
```

#### Typography System
```css
/* Font size scale */
--font-size-xs: 0.6875rem;   /* 11px */
--font-size-sm: 0.875rem;    /* 14px */
--font-size-md: 1rem;        /* 16px */
--font-size-lg: 1.125rem;    /* 18px */
--font-size-xl: 1.5rem;      /* 24px */

/* Font weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Benefits
- **Consistency**: All components use the same values
- **Maintainability**: Change once, update everywhere
- **Theming**: Easy to implement dark mode or brand variants
- **Documentation**: Self-documenting design decisions

---

## Layer 2: Component Layer (BEM Methodology)

### Purpose
Provides semantic, modular CSS for complex UI components. Uses BEM (Block Element Modifier) methodology for clear structure and naming.

### BEM Structure
- **Block**: Independent component (`.modal`, `.button`, `.card`)
- **Element**: Part of a block (`.modal__header`, `.modal__content`)
- **Modifier**: Variation of a block/element (`.button--primary`, `.modal--large`)

### Examples

#### Modal Component
```css
/* Block */
.modal {
  background-color: white;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-strong);
}

/* Elements */
.modal__header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.modal__content {
  padding: 1.25rem;
  overflow-y: auto;
}

.modal__close-button {
  background: transparent;
  border: none;
  cursor: pointer;
}
```

#### Form Controls
```css
/* Block */
.field-label {
  font-weight: var(--font-weight-semibold);
  color: var(--secondary-color);
}

/* Modifier */
.field-value--currency {
  font-size: var(--font-size-sm);
}

/* Status variations */
.status-badge--completed {
  color: var(--success-color);
}

.status-badge--in-progress {
  color: var(--warning-color);
}
```

### Benefits
- **Semantic**: Class names describe purpose, not appearance
- **Modular**: Components can be moved between projects
- **Predictable**: Clear naming convention prevents conflicts
- **Maintainable**: Easy to locate and modify component styles

---

## Layer 3: Utility Layer (Atomic CSS)

### Purpose
Provides small, single-purpose classes for layout, spacing, typography, and other common patterns. Reduces the need for custom CSS and ensures consistency.

### Categories

#### Layout Utilities
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-md { gap: var(--spacing-md); }
```

#### Spacing Utilities
```css
.m-0 { margin: 0; }
.mb-4 { margin-bottom: var(--spacing-xl); }
.p-md { padding: var(--spacing-md); }
.mt-micro { margin-top: var(--spacing-micro); }
```

#### Typography Utilities
```css
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-uppercase { text-transform: uppercase; }
.font-bold { font-weight: var(--font-weight-bold); }
.text-sm { font-size: var(--font-size-sm); }
```

### Benefits
- **Rapid Development**: Common patterns available instantly
- **Consistency**: Prevents arbitrary values
- **Small CSS**: Highly reusable classes
- **Responsive**: Easy to apply different styles at breakpoints

---

## How the Layers Work Together

### Example: PruefensterModal
```tsx
<div className="case-info-grid text-left mb-8">
  {/* ^semantic component ^utility classes */}
  
  <div className="info-field flex flex-col">
    {/* ^BEM element ^utility layout */}
    
    <span className="field-label text-left text-uppercase">
      {/* ^BEM element ^utility modifiers */}
      Case Number
    </span>
    
    <span className="field-value text-left mt-micro">
      {/* ^BEM element ^utility classes */}
      {audit.id}
    </span>
  </div>
</div>
```

### Example: Modal Header
```tsx
<div className="modal__header flex justify-between items-center">
  {/* ^BEM element ^utility layout classes */}
  <h3 className="modal__title">{title}</h3>
  <button className="modal__close-button">×</button>
</div>
```

### The Rule of Thumb
1. **Use BEM** for component identity and semantic meaning
2. **Use utilities** for layout, spacing, and common modifications
3. **Use design tokens** for all values (colors, spacing, fonts)

---

## Guidelines and Best Practices

### When to Use Each Layer

#### Use Design Tokens When:
- Defining any color, spacing, or typography value
- Creating consistent visual hierarchies
- Building themeable interfaces

#### Use BEM When:
- Creating new UI components
- Styling complex interactive elements
- Need semantic meaning in class names
- Component has multiple states or variations

#### Use Utilities When:
- Applying layout (flexbox, grid)
- Adding margins/padding
- Setting text alignment or typography
- Quick styling that doesn't need semantic meaning

### Naming Conventions

#### Design Tokens
```css
--{category}-{property}-{variant}: value;
--color-text-primary: #333;
--spacing-margin-large: 2rem;
--font-size-heading-small: 1.125rem;
```

#### BEM Classes
```css
.{block} { }
.{block}__{element} { }
.{block}--{modifier} { }
.{block}__{element}--{modifier} { }
```

#### Utility Classes
```css
.{property}-{value} { }
.text-center { }
.mb-4 { }
.flex-col { }
```

### File Organization

```
src/
├── index.css              # Global styles + design tokens
├── App.css               # App-level styles
└── components/
    ├── common/
    │   ├── Modal.css      # BEM component styles
    │   ├── Modal.tsx
    │   ├── FormControls.css
    │   └── FormControls.tsx
    └── QuarterlySelection.css  # Feature-specific styles
```

---

## Benefits of This Architecture

### 🔧 Maintainability
- Design tokens enable global changes
- BEM provides clear component boundaries
- Utilities reduce duplicate CSS

### 📱 Consistency
- Design system prevents arbitrary values
- Utilities ensure consistent spacing/typography
- BEM creates predictable component patterns

### ⚡ Performance
- Utilities are highly cacheable and reusable
- Design tokens reduce CSS bundle size
- Component styles are modular and tree-shakeable

### 🧩 Scalability
- New developers can quickly understand the system
- Components can be easily moved or reused
- Design system grows systematically

### 🎯 Developer Experience
- Predictable class naming
- Easy to locate styles
- Fast development with utilities
- Clear separation of concerns

---

## Migration and Adoption

### For New Components
1. Define semantic structure with BEM
2. Use design tokens for all values
3. Apply utilities for layout and spacing
4. Document any new design tokens needed

### For Existing Components
1. Gradually replace magic numbers with design tokens
2. Refactor semantic styles to use BEM
3. Replace repetitive CSS with utilities
4. Ensure responsive behavior

### Common Pitfalls to Avoid
- ❌ Don't mix utility classes with custom CSS properties
- ❌ Don't use arbitrary values (use design tokens)
- ❌ Don't over-nest BEM elements (keep it flat)
- ❌ Don't use utilities for complex component logic

---

## Tools and Resources

### Development Tools
- CSS custom properties for design tokens
- PostCSS for CSS processing
- ESLint rules for consistent class naming

### Recommended Reading
- [BEM Methodology](http://getbem.com/)
- [CSS Custom Properties Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Atomic CSS](https://acss.io/)

---

## Conclusion

This three-layer architecture provides the benefits of modern CSS approaches while maintaining clarity and avoiding the pitfalls of any single methodology. It's designed to grow with the project while keeping styles maintainable and predictable.

The combination of design tokens, BEM components, and utility classes creates a robust foundation that serves both rapid development and long-term maintenance needs. 