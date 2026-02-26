---
name: ux-design-commands
type: epic-management
category: general
---

# UX Design Commands

## Analysis & Audit Tools

### Accessibility Testing

```bash
# Install accessibility testing tools
npm install -D @axe-core/react
npm install -D pa11y
npm install -D lighthouse

# Run accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility --view

# Run pa11y accessibility test
npx pa11y http://localhost:3000

# Check color contrast
npx color-contrast-checker "#000000" "#FFFFFF"

# Test with screen reader
# macOS: VoiceOver (Cmd + F5)
# Windows: NVDA (free) or JAWS
# Linux: Orca
```

### Performance Analysis

```bash
# Core Web Vitals check
npx lighthouse http://localhost:3000 --only-categories=performance --view

# Bundle size analysis
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json

# Image optimization check
find . -name "*.jpg" -o -name "*.png" -exec identify -format '%f: %wx%h %Q%%\n' {} \;

# Check Time to Interactive
npx lighthouse http://localhost:3000 --only-audits=interactive --view
```

### Usability Testing Tools

```bash
# Install user testing tools
npm install -D @hotjar/browser
npm install -D fullstory-browser

# Install heatmap tracking
cat > src/analytics/heatmap.js << 'EOF'
// Hotjar Tracking Code
(function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:YOUR_SITE_ID,hjsv:6};
    // ... rest of Hotjar code
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
EOF

# Session recording setup
npm install rrweb rrweb-player
```

## Design System Setup

### Design Tokens

```bash
# Create design tokens structure
mkdir -p src/design-system/tokens
cat > src/design-system/tokens/colors.js << 'EOF'
export const colors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    500: '#2196F3',
    900: '#0D47A1',
  },
  semantic: {
    error: '#F44336',
    warning: '#FF9800',
    success: '#4CAF50',
    info: '#2196F3',
  },
  neutral: {
    0: '#FFFFFF',
    100: '#F5F5F5',
    900: '#212121',
  },
};
EOF

# Typography tokens
cat > src/design-system/tokens/typography.js << 'EOF'
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
EOF

# Spacing system (8-point grid)
cat > src/design-system/tokens/spacing.js << 'EOF'
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};
EOF
```

### Component Documentation

```bash
# Setup Storybook for component documentation
npx storybook@latest init

# Create story template
cat > src/components/Button/Button.stories.js << 'EOF'
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Base button component with multiple variants',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};
EOF

# Run Storybook
npm run storybook
```

## UX Metrics Implementation

### Analytics Setup

```bash
# Google Analytics 4
npm install react-ga4

# Setup GA4
cat > src/analytics/ga4.js << 'EOF'
import ReactGA from "react-ga4";

export const initGA = () => {
  ReactGA.initialize("G-XXXXXXXXXX");
};

export const logPageView = () => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};

export const logEvent = (category, action, label) => {
  ReactGA.event({
    category: category,
    action: action,
    label: label,
  });
};
EOF

# Track user interactions
cat > src/hooks/useClickTracking.js << 'EOF'
import { useCallback } from 'react';
import { logEvent } from '../analytics/ga4';

export const useClickTracking = (category, action) => {
  return useCallback((label) => {
    logEvent(category, action, label);
  }, [category, action]);
};
EOF
```

### User Feedback Collection

```bash
# Install feedback tools
npm install react-hook-form
npm install react-rating-stars-component

# Create feedback form
cat > src/components/FeedbackForm.jsx << 'EOF'
import { useForm } from 'react-hook-form';
import Rating from 'react-rating-stars-component';

export const FeedbackForm = () => {
  const { register, handleSubmit, setValue } = useForm();
  
  const onSubmit = (data) => {
    // Send to analytics or backend
    console.log('Feedback:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Rating
        onChange={(rating) => setValue('rating', rating)}
        count={5}
        size={24}
      />
      <textarea
        {...register('feedback')}
        placeholder="Tell us about your experience"
      />
      <button type="submit">Submit Feedback</button>
    </form>
  );
};
EOF
```

## Responsive Design Testing

### Device Testing

```bash
# Browser device emulation
# Chrome DevTools: Cmd+Shift+M (Mac) or Ctrl+Shift+M (Windows)

# Responsive design checker
npx playwright test --headed --viewport-size="375,667"  # iPhone
npx playwright test --headed --viewport-size="768,1024" # iPad
npx playwright test --headed --viewport-size="1920,1080" # Desktop

# Create responsive test suite
cat > tests/responsive.spec.js << 'EOF'
const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
];

viewports.forEach(({ name, width, height }) => {
  test(`Responsive: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: `screenshots/${name}.png` });
  });
});
EOF
```

## A/B Testing Setup

### Feature Flags

```bash
# Install feature flag service
npm install @growthbook/growthbook-react

# Setup A/B test
cat > src/experiments/ButtonTest.jsx << 'EOF'
import { useFeature } from "@growthbook/growthbook-react";

export const ButtonTest = () => {
  const feature = useFeature("new-button-design");
  
  if (feature.on) {
    return <NewButton />;
  }
  
  return <OldButton />;
};
EOF

# Track conversion
cat > src/tracking/conversion.js << 'EOF'
export const trackConversion = (variant, action) => {
  // Send to analytics
  window.gtag('event', 'conversion', {
    experiment_variant: variant,
    action: action,
  });
};
EOF
```

## Visual Regression Testing

### Percy Setup

```bash
# Install Percy
npm install -D @percy/cli @percy/playwright

# Create visual test
cat > tests/visual.spec.js << 'EOF'
import percySnapshot from '@percy/playwright';

test('Homepage visual test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await percySnapshot(page, 'Homepage');
});
EOF

# Run visual tests
export PERCY_TOKEN=your_token_here
npx percy exec -- npx playwright test tests/visual.spec.js
```

## User Journey Tracking

### Funnel Analysis

```bash
# Track user journey
cat > src/analytics/journey.js << 'EOF'
class UserJourney {
  constructor() {
    this.steps = [];
    this.startTime = Date.now();
  }

  addStep(stepName, metadata = {}) {
    const step = {
      name: stepName,
      timestamp: Date.now(),
      timeFromStart: Date.now() - this.startTime,
      metadata,
    };
    this.steps.push(step);
    this.sendToAnalytics(step);
  }

  sendToAnalytics(step) {
    // Send to your analytics service
    console.log('Journey step:', step);
  }

  complete(outcome) {
    const journey = {
      steps: this.steps,
      outcome,
      totalTime: Date.now() - this.startTime,
    };
    // Send complete journey
    console.log('Journey complete:', journey);
  }
}

export default UserJourney;
EOF
```

## Form UX Optimization

### Form Validation

```bash
# Real-time validation setup
cat > src/hooks/useFormValidation.js << 'EOF'
import { useState, useCallback } from 'react';

export const useFormValidation = (rules) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((name, value) => {
    const rule = rules[name];
    if (!rule) return true;

    const error = rule(value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
    
    return !error;
  }, [rules]);

  const touch = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  return { errors, touched, validate, touch };
};
EOF
```

## Loading State Patterns

### Skeleton Screens

```bash
# Create skeleton component
cat > src/components/Skeleton.jsx << 'EOF'
export const Skeleton = ({ width, height, rounded = false }) => {
  return (
    <div
      className="skeleton-loader"
      style={{
        width,
        height,
        borderRadius: rounded ? '50%' : '4px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        animation: 'shimmer 2s infinite',
      }}
    />
  );
};
EOF

# Add CSS animation
cat >> src/styles/animations.css << 'EOF'
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
EOF
```

## Error Handling UX

### User-Friendly Errors

```bash
# Error boundary with UX
cat > src/components/ErrorBoundary.jsx << 'EOF'
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Oops! Something went wrong</h2>
          <p>We're sorry for the inconvenience. Please try:</p>
          <ul>
            <li>Refreshing the page</li>
            <li>Checking your internet connection</li>
            <li>Contacting support if the problem persists</li>
          </ul>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
EOF
```
