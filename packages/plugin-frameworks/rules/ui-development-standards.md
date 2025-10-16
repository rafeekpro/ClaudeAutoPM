# UI Development Standards Rule

> **PURPOSE**: Mandatory standards for consistent UI/UX development across projects.

## CRITICAL UI FRAMEWORK SELECTION

### 1. FRAMEWORK DECISION MATRIX

**Bootstrap** - Use `react-ui-expert` (framework=bootstrap):

- Rapid prototyping and MVP development
- Component-heavy applications (dashboards, admin panels)
- Team prefers pre-built components
- Consistent enterprise-grade design needed
- Less custom design requirements

**TailwindCSS** - Use `tailwindcss-expert`:

- Custom design systems and unique branding
- High-performance applications (smaller bundle sizes)
- Design flexibility and utility-first approach needed
- Developer team comfortable with utility classes
- Modern, cutting-edge UI requirements

**Selection Criteria**:

```
IF (rapid_development && pre_built_components) → Bootstrap
IF (custom_design && performance_critical) → TailwindCSS
IF (design_system_needed) → TailwindCSS
IF (enterprise_consistency) → Bootstrap
```

### 2. RESPONSIVE DESIGN REQUIREMENTS

**MANDATORY Responsive Breakpoints**:

- Mobile First: Design for mobile, enhance for desktop
- Breakpoints: 576px (sm), 768px (md), 992px (lg), 1200px (xl), 1400px (xxl)
- Touch-friendly: Minimum 44px touch targets
- Readable text: Minimum 16px font size on mobile

**Testing Requirements**:

- Test on actual devices, not just browser dev tools
- Validate touch interactions on mobile devices
- Ensure content reflows properly at all breakpoints
- Test landscape and portrait orientations

### 3. ACCESSIBILITY STANDARDS (WCAG 2.1 AA)

**MANDATORY Accessibility Features**:

- Semantic HTML structure (headings h1-h6 hierarchy)
- Alt text for all images and meaningful graphics
- Proper form labels and error messages
- Keyboard navigation support
- Color contrast ratio ≥ 4.5:1 for normal text
- Focus indicators visible and high contrast

**Implementation Requirements**:

```html
<!-- ALWAYS include proper ARIA labels -->
<button aria-label="Close modal" aria-expanded="false">×</button>

<!-- ALWAYS use semantic HTML -->
<nav role="navigation">
  <ul>
    <li><a href="#section1">Section 1</a></li>
  </ul>
</nav>

<!-- ALWAYS provide alternative text -->
<img src="chart.png" alt="Sales increased 25% in Q3 2024">
```

### 4. PERFORMANCE STANDARDS

**Bootstrap Projects**:

- Bundle size limit: < 300KB (CSS + JS gzipped)
- Custom builds: Include only required components
- Optimize images: WebP format with fallbacks
- Minimize DOM depth: < 15 levels deep

**TailwindCSS Projects**:

- PurgeCSS enabled: Remove unused utilities
- Bundle size limit: < 50KB (CSS gzipped)
- JIT mode enabled for development
- Production builds must be optimized

**Performance Metrics** (REQUIRED):

- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3.5s

### 5. BROWSER COMPATIBILITY REQUIREMENTS

**Supported Browsers** (MINIMUM):

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions  
- Safari: Last 2 versions
- Mobile Safari (iOS): Last 2 versions
- Chrome Mobile (Android): Last 2 versions

**Fallback Strategies**:

- Progressive enhancement approach
- Graceful degradation for unsupported features
- Polyfills for critical missing features
- Alternative layouts for older browsers

### 6. COMPONENT ARCHITECTURE STANDARDS

**Bootstrap Components**:

```html
<!-- ALWAYS use consistent class patterns -->
<div class="card h-100 shadow-sm">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h5 class="card-title mb-0">Title</h5>
    <button class="btn btn-sm btn-outline-secondary">Action</button>
  </div>
  <div class="card-body">
    <p class="card-text">Content</p>
  </div>
</div>
```

**TailwindCSS Components**:

```html
<!-- ALWAYS extract component patterns -->
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-semibold text-gray-900">Title</h3>
    <button class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">
      Action
    </button>
  </div>
  <p class="text-gray-600">Content</p>
</div>
```

### 7. FORM VALIDATION STANDARDS

**Client-Side Validation** (MANDATORY):

- Real-time validation feedback
- Clear error messages
- Visual error indicators
- Success confirmation states

**Implementation Pattern**:

```html
<!-- Bootstrap form validation -->
<form class="needs-validation" novalidate>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email" required>
    <div class="invalid-feedback">Please provide a valid email.</div>
    <div class="valid-feedback">Looks good!</div>
  </div>
</form>

<!-- TailwindCSS form validation -->
<form>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
    <input 
      type="email" 
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      required
    >
    <p class="mt-1 text-sm text-red-600 hidden">Please provide a valid email.</p>
  </div>
</form>
```

### 8. DARK MODE IMPLEMENTATION

**TailwindCSS Dark Mode**:

```html
<!-- ALWAYS support dark mode with TailwindCSS -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Title</h1>
  <p class="text-gray-600 dark:text-gray-300">Content</p>
</div>
```

**Bootstrap Dark Mode**:

```html
<!-- Use Bootstrap 5.3+ dark mode support -->
<html data-bs-theme="dark">
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Dark Mode Card</h5>
  </div>
</div>
</html>
```

### 9. TESTING REQUIREMENTS

**Visual Testing** (MANDATORY):

- Screenshot testing across breakpoints
- Cross-browser visual comparison
- Accessibility audit with tools (axe, WAVE)
- Color contrast validation

**Functional Testing**:

- Form submission and validation
- Interactive component behavior
- Navigation and routing
- Mobile touch interactions

**Performance Testing**:

- Bundle size monitoring
- Load time measurement
- Core Web Vitals tracking
- Lighthouse audit scores ≥ 90

### 10. CODE ORGANIZATION STANDARDS

**File Structure**:

```
src/
├── styles/
│   ├── bootstrap/          # Bootstrap customizations
│   │   ├── variables.scss  # Custom variables
│   │   └── custom.scss     # Custom components
│   └── tailwind/           # TailwindCSS customizations
│       ├── config.js       # Tailwind configuration
│       └── components/     # Component patterns
├── components/             # Reusable UI components
└── assets/                 # Images, fonts, icons
```

**Code Quality**:

- Consistent indentation (2 spaces)
- Meaningful class names and comments
- Component reusability and modularity
- Documentation for complex components

## VIOLATIONS AND ENFORCEMENT

**CRITICAL VIOLATIONS** (Block deployment):

- Missing responsive design implementation
- Accessibility violations (WCAG 2.1 AA failures)
- Bundle size exceeds limits
- No fallback for unsupported browsers

**MAJOR VIOLATIONS** (Require fixes):

- Inconsistent design patterns
- Missing form validation
- No dark mode support (for TailwindCSS projects)
- Performance metrics below thresholds

**MINOR VIOLATIONS** (Address in next iteration):

- Suboptimal component organization
- Missing hover/focus states
- Incomplete documentation
- Non-semantic HTML usage

These standards ensure consistent, accessible, and performant UI development across all projects.
