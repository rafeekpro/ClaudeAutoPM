/**
 * Tailwind CSS Manager
 * Handles Tailwind design system operations
 * TDD Phase: REFACTOR - Extracted from command
 * Task: 6.4
 */

const fs = require('fs').promises;
const path = require('path');

class TailwindManager {
  constructor() {
    this.defaultConfig = {
      content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    };
  }

  /**
   * Initialize Tailwind configuration
   */
  async initializeConfig(options = {}) {
    const config = `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(this.defaultConfig, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'").replace(/'/g, '"').replace(/([a-zA-Z_]\w*):/g, '$1:').replace(/"(\.\/.+?)"/g, '"$1"')}`;

    await fs.writeFile('tailwind.config.js', config);

    return {
      path: 'tailwind.config.js',
      content: this.defaultConfig
    };
  }

  /**
   * Setup PostCSS configuration
   */
  async setupPostCSS(options = {}) {
    const config = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    };

    const configString = `module.exports = ${JSON.stringify(config, null, 2).replace(/"([^"]+)":/g, '$1:')}`;
    await fs.writeFile('postcss.config.js', configString);

    return {
      path: 'postcss.config.js',
      plugins: Object.keys(config.plugins)
    };
  }

  /**
   * Generate design system tokens
   */
  async generateDesignSystem(options = {}) {
    await fs.mkdir(path.join('src', 'styles'), { recursive: true });

    const tokens = [];

    if (options.colors) {
      tokens.push(`// Color System
export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    500: '#6b7280',
    900: '#111827',
  },
};`);
    }

    if (options.typography) {
      tokens.push(`// Typography System
export const typography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'Fira Code, monospace',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
};`);
    }

    const content = `// Design System Tokens
${tokens.length ? tokens.join('\n\n') : `export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    500: '#6b7280',
    900: '#111827',
  },
};

export const typography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'Fira Code, monospace',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
};`}`;

    await fs.writeFile(path.join('src', 'styles', 'design-tokens.js'), content);

    return {
      path: 'src/styles/design-tokens.js',
      tokens: {
        colors: options.colors || false,
        typography: options.typography || false
      }
    };
  }

  /**
   * Generate Tailwind component
   */
  async generateComponent(name, options = {}) {
    await fs.mkdir(path.join('src', 'components'), { recursive: true });

    const variant = options.variant || 'default';
    const component = `import React from 'react';

const ${name} = ({ children, className = '', ...props }) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    default: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };

  return (
    <button
      className={\`px-4 py-2 rounded font-medium transition-colors \${variants['${variant}']} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ${name};`;

    const filePath = path.join('src', 'components', `${name}.jsx`);
    await fs.writeFile(filePath, component);

    return {
      name,
      variant,
      path: filePath,
      type: 'functional'
    };
  }

  /**
   * Create utility classes
   */
  async createUtilities(type = 'custom', options = {}) {
    await fs.mkdir(path.join('src', 'styles'), { recursive: true });

    const utilities = this.generateUtilityClasses(type);
    const filePath = path.join('src', 'styles', 'utilities.css');

    await fs.writeFile(filePath, utilities);

    return {
      type,
      path: filePath,
      categories: ['spacing', 'typography', 'layout', 'animation']
    };
  }

  /**
   * Generate utility classes based on type
   */
  generateUtilityClasses(type) {
    const baseUtilities = `/* Custom Tailwind Utilities */

@layer utilities {`;

    const spacingUtilities = `
  /* Spacing utilities */
  .spacing-xs { @apply p-1; }
  .spacing-sm { @apply p-2; }
  .spacing-md { @apply p-4; }
  .spacing-lg { @apply p-8; }
  .spacing-xl { @apply p-16; }`;

    const typographyUtilities = `
  /* Typography utilities */
  .text-balance {
    text-wrap: balance;
  }`;

    const layoutUtilities = `
  /* Layout utilities */
  .center {
    @apply flex items-center justify-center;
  }`;

    const animationUtilities = `
  /* Animation utilities */
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }`;

    let content = baseUtilities;

    if (type === 'spacing') {
      content += spacingUtilities;
    } else {
      content += spacingUtilities;
      content += typographyUtilities;
      content += layoutUtilities;
      content += animationUtilities;
    }

    content += '\n}';

    return content;
  }

  /**
   * Configure theme
   */
  async configureTheme(options = {}) {
    const config = {
      content: this.defaultConfig.content,
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#eff6ff',
              500: '#3b82f6',
              900: '#1e3a8a',
            },
            secondary: {
              50: '#f0f9ff',
              500: '#0ea5e9',
              900: '#0c4a6e',
            },
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['Fira Code', 'monospace'],
          },
        },
      },
      plugins: [],
    };

    if (options.dark) {
      config.darkMode = 'class';
    }

    const configString = this.generateConfigString(config);
    await fs.writeFile('tailwind.config.js', configString);

    return {
      path: 'tailwind.config.js',
      darkMode: options.dark || false,
      theme: 'extended'
    };
  }

  /**
   * Setup responsive breakpoints
   */
  async setupResponsive(options = {}) {
    const screens = {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    };

    if (options.custom) {
      screens['mobile'] = '320px';
      screens['tablet'] = '768px';
      screens['laptop'] = '1024px';
      screens['desktop'] = '1440px';
    }

    const config = {
      content: this.defaultConfig.content,
      theme: {
        screens,
        extend: {},
      },
      plugins: [],
    };

    const configString = this.generateConfigString(config);
    await fs.writeFile('tailwind.config.js', configString);

    return {
      path: 'tailwind.config.js',
      breakpoints: Object.keys(screens),
      custom: options.custom || false
    };
  }

  /**
   * Optimize for production
   */
  async optimizeProduction(options = {}) {
    // Ensure CSS file exists
    const cssPath = path.join('src', 'styles', 'main.css');
    try {
      await fs.access(cssPath);
    } catch {
      await fs.mkdir(path.join('src', 'styles'), { recursive: true });
      await fs.writeFile(cssPath, '@tailwind base;\n@tailwind components;\n@tailwind utilities;');
    }

    const config = {
      content: this.defaultConfig.content,
      theme: {
        extend: {},
      },
      plugins: [],
      corePlugins: {
        preflight: true,
      },
    };

    if (options.purge) {
      config.purge = {
        enabled: 'process.env.NODE_ENV === \'production\'',
        content: [
          './src/**/*.{js,jsx,ts,tsx}',
          './public/index.html',
        ],
        options: {
          safelist: [],
        },
      };
    }

    const configString = this.generateConfigString(config, options.purge);
    await fs.writeFile('tailwind.config.js', configString);

    return {
      path: 'tailwind.config.js',
      optimizations: {
        purge: options.purge || false,
        preflight: true
      }
    };
  }

  /**
   * Generate config string from object
   */
  generateConfigString(config, hasPurge = false) {
    let configStr = `/** @type {import('tailwindcss').Config} */
module.exports = {`;

    // Content
    configStr += `
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],`;

    // Dark mode if present
    if (config.darkMode) {
      configStr += `
  darkMode: "${config.darkMode}",`;
    }

    // Theme
    configStr += `
  theme: {`;

    if (config.theme.screens) {
      configStr += `
    screens: {
      ${Object.entries(config.theme.screens).map(([key, val]) => `'${key}': '${val}'`).join(',\n      ')},
    },`;
    }

    if (config.theme.extend && Object.keys(config.theme.extend).length > 0) {
      configStr += `
    extend: {`;

      if (config.theme.extend.colors) {
        configStr += `
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },`;
      }

      if (config.theme.extend.fontFamily) {
        configStr += `
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },`;
      }

      configStr += `
    },`;
    } else {
      configStr += `
    extend: {},`;
    }

    configStr += `
  },
  plugins: [],`;

    // Core plugins
    if (config.corePlugins) {
      configStr += `
  // Production optimizations
  corePlugins: {
    preflight: true,
  },`;
    }

    // Purge config
    if (hasPurge) {
      configStr += `

  // PurgeCSS configuration
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/**/*.{js,jsx,ts,tsx}',
      './public/index.html',
    ],
    options: {
      safelist: [],
    },
  },`;
    }

    configStr += `
}`;

    return configStr;
  }
}

module.exports = TailwindManager;