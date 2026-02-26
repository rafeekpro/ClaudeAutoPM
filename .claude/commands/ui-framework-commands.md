---
name: ui-framework-commands
type: epic-management
category: general
---

# UI Framework Commands

## Installation Commands

### Material-UI (MUI)

```bash
# Install MUI v5
npm install @mui/material @emotion/react @emotion/styled

# With styled-components instead
npm install @mui/material @mui/styled-engine-sc styled-components

# Icons and Lab components
npm install @mui/icons-material @mui/lab

# MUI System
npm install @mui/system

# Data Grid (Pro features require license)
npm install @mui/x-data-grid
```

### Chakra UI

```bash
# Install Chakra UI v2
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion

# Icons
npm install @chakra-ui/icons

# Additional tools
npm install @chakra-ui/theme-tools
```

### Ant Design

```bash
# Install Ant Design v5
npm install antd

# Icons
npm install @ant-design/icons

# ProComponents
npm install @ant-design/pro-components

# Charts
npm install @ant-design/charts
```

### Bootstrap

```bash
# Install Bootstrap v5
npm install bootstrap

# React Bootstrap
npm install react-bootstrap

# Bootstrap Icons
npm install bootstrap-icons
```

### Tailwind CSS

```bash
# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Tailwind Forms Plugin
npm install -D @tailwindcss/forms

# Tailwind Typography Plugin
npm install -D @tailwindcss/typography

# Headless UI (for React)
npm install @headlessui/react
```

## Setup Commands

### MUI Theme Setup

```bash
# Create theme file
mkdir -p src/theme
cat > src/theme/index.ts << 'EOF'
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
EOF
```

### Chakra UI Theme Setup

```bash
# Create theme file
mkdir -p src/theme
cat > src/theme/index.ts << 'EOF'
import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  colors: {
    brand: {
      900: '#1a365d',
      800: '#153e75',
      700: '#2a69ac',
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
});
EOF
```

### Ant Design Config Setup

```bash
# Create config provider setup
cat > src/App.tsx << 'EOF'
import { ConfigProvider } from 'antd';

const theme = {
  token: {
    colorPrimary: '#00b96b',
    borderRadius: 2,
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      {/* Your app content */}
    </ConfigProvider>
  );
}
EOF
```

### Tailwind Configuration

```bash
# Update tailwind.config.js
cat > tailwind.config.js << 'EOF'
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      },
    },
  },
  plugins: [],
}
EOF

# Add Tailwind directives to CSS
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
```

## Development Commands

### Component Generation

```bash
# Generate MUI component
cat > src/components/Button.tsx << 'EOF'
import { Button as MuiButton, ButtonProps } from '@mui/material';

export const Button = (props: ButtonProps) => {
  return <MuiButton variant="contained" {...props} />;
};
EOF

# Generate Chakra component
cat > src/components/Button.tsx << 'EOF'
import { Button as ChakraButton, ButtonProps } from '@chakra-ui/react';

export const Button = (props: ButtonProps) => {
  return <ChakraButton colorScheme="brand" {...props} />;
};
EOF

# Generate Ant Design component
cat > src/components/Button.tsx << 'EOF'
import { Button as AntButton, ButtonProps } from 'antd';

export const Button = (props: ButtonProps) => {
  return <AntButton type="primary" {...props} />;
};
EOF
```

### Testing Commands

```bash
# Test with React Testing Library
npm install -D @testing-library/react @testing-library/user-event

# Visual regression with Playwright
npx playwright test --ui

# Accessibility testing
npm install -D @axe-core/react
npm install -D jest-axe

# Run component tests
npm test -- --coverage
```

### Build Optimization

```bash
# Analyze bundle size
npm install -D webpack-bundle-analyzer
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json

# Check for unused CSS (Tailwind)
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch --minify

# Tree-shake MUI imports
# Use specific imports instead of barrel imports
# Good: import Button from '@mui/material/Button';
# Bad: import { Button } from '@mui/material';
```

## Validation Commands

### Linting

```bash
# ESLint for React
npm install -D eslint-plugin-react eslint-plugin-react-hooks

# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Type Checking

```bash
# TypeScript checking
npx tsc --noEmit

# Generate types for CSS modules
npm install -D typescript-plugin-css-modules
```

### Accessibility Checking

```bash
# Install accessibility linter
npm install -D eslint-plugin-jsx-a11y

# Run accessibility audit
npx lighthouse http://localhost:3000 --view

# Test with screen reader
# macOS: Enable VoiceOver (Cmd + F5)
# Windows: Enable Narrator (Win + Ctrl + Enter)
```

## Production Commands

### Build

```bash
# Production build
npm run build

# Serve production build locally
npx serve -s build
```

### Performance Monitoring

```bash
# Add Web Vitals
npm install web-vitals

# Monitor performance
cat > src/reportWebVitals.ts << 'EOF'
import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
EOF
```

## Troubleshooting Commands

### Clear Cache

```bash
# Clear npm cache
npm cache clean --force

# Clear build cache
rm -rf node_modules/.cache
rm -rf build

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Debug Styling Issues

```bash
# Check CSS specificity (for CSS-in-JS)
# Add this to component for debugging
console.log(window.getComputedStyle(element))

# Check theme values (MUI)
console.log(theme.palette)

# Check Chakra theme
console.log(useTheme())

# Debug Tailwind classes
npx tailwindcss --help
```

### Version Checking

```bash
# Check installed versions
npm list @mui/material
npm list @chakra-ui/react
npm list antd
npm list bootstrap
npm list tailwindcss

# Check for updates
npm outdated

# Update to latest
npm update
```
