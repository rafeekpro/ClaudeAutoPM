/**
 * React Scaffold Manager
 * Centralized React application scaffolding functionality
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Configuration
 */
const CONFIG = {
  defaults: {
    bundler: 'vite',
    port: 3000,
    testFramework: 'vitest'
  }
};

/**
 * Templates
 */
const TEMPLATES = {
  vitePackage: {
    name: 'react-app',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      lint: 'eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0',
      preview: 'vite preview',
      test: 'vitest'
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@types/react': '^18.2.43',
      '@types/react-dom': '^18.2.17',
      '@vitejs/plugin-react': '^4.2.1',
      eslint: '^8.55.0',
      'eslint-plugin-react': '^7.33.2',
      'eslint-plugin-react-hooks': '^4.6.0',
      'eslint-plugin-react-refresh': '^0.4.5',
      vite: '^5.0.8'
    }
  }
};

class ReactScaffoldManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Creates React app
   */
  async createApp(name = 'app', options = {}) {
    const bundler = options.bundler || CONFIG.defaults.bundler;
    const typescript = options.typescript || false;

    const appDir = path.join(this.projectRoot, name);
    await fs.mkdir(appDir, { recursive: true });
    await fs.mkdir(path.join(appDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(appDir, 'public'), { recursive: true });

    // Create package.json
    const packageJson = { ...TEMPLATES.vitePackage, name };

    if (typescript) {
      packageJson.devDependencies.typescript = '^5.2.2';
      packageJson.devDependencies['@typescript-eslint/eslint-plugin'] = '^6.14.0';
      packageJson.devDependencies['@typescript-eslint/parser'] = '^6.14.0';
    }

    await fs.writeFile(
      path.join(appDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create vite.config.js
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: ${CONFIG.defaults.port}
  }
})
`;

    await fs.writeFile(path.join(appDir, 'vite.config.js'), viteConfig);

    // Create index.html
    const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

    await fs.writeFile(path.join(appDir, 'index.html'), indexHtml);

    // Create main.jsx
    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

    await fs.writeFile(path.join(appDir, 'src', 'main.jsx'), mainJsx);

    // Create App.jsx
    const appJsx = `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>React + Vite</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </>
  )
}

export default App
`;

    await fs.writeFile(path.join(appDir, 'src', 'App.jsx'), appJsx);

    // Create basic CSS files
    await fs.writeFile(path.join(appDir, 'src', 'index.css'), '/* Global styles */\n');
    await fs.writeFile(path.join(appDir, 'src', 'App.css'), '/* App styles */\n');

    if (typescript) {
      await this.setupTypeScript(appDir);
    }

    return {
      name,
      bundler,
      typescript,
      path: appDir
    };
  }

  /**
   * Sets up TypeScript
   */
  async setupTypeScript(appDir) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }]
    };

    await fs.writeFile(
      path.join(appDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    return tsConfig;
  }

  /**
   * Creates app structure
   */
  async createStructure() {
    const dirs = [
      'src',
      'src/components',
      'src/pages',
      'src/hooks',
      'src/utils',
      'src/services',
      'src/assets',
      'src/assets/images',
      'src/assets/styles',
      'public'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.projectRoot, dir), { recursive: true });
    }

    // Create .gitignore
    const gitignore = `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;

    await fs.writeFile(path.join(this.projectRoot, '.gitignore'), gitignore);

    return {
      directories: dirs,
      gitignore: true
    };
  }

  /**
   * Creates component
   */
  async createComponent(name = 'Component', options = {}) {
    const type = options.type || 'functional';
    const styled = options.styled || false;
    const typescript = options.typescript || false;
    const ext = typescript ? 'tsx' : 'jsx';

    const componentsDir = path.join(this.projectRoot, 'src', 'components');
    await fs.mkdir(componentsDir, { recursive: true });

    let componentCode;

    if (type === 'functional') {
      componentCode = `import React from 'react';
${styled ? `import './${name}.css';` : ''}

const ${name} = (props) => {
  return (
    <div className="${name.toLowerCase()}">
      <h2>${name}</h2>
      {props.children}
    </div>
  );
};

export default ${name};
`;
    } else {
      componentCode = `import React, { Component } from 'react';
${styled ? `import './${name}.css';` : ''}

class ${name} extends Component {
  render() {
    return (
      <div className="${name.toLowerCase()}">
        <h2>${name}</h2>
        {this.props.children}
      </div>
    );
  }
}

export default ${name};
`;
    }

    await fs.writeFile(
      path.join(componentsDir, `${name}.${ext}`),
      componentCode
    );

    if (styled) {
      const styleContent = `.${name.toLowerCase()} {
  /* ${name} styles */
  padding: 1rem;
  margin: 1rem 0;
}
`;
      await fs.writeFile(
        path.join(componentsDir, `${name}.css`),
        styleContent
      );
    }

    // Create test file
    const testContent = `import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

describe('${name}', () => {
  it('renders ${name} component', () => {
    render(<${name} />);
    const element = screen.getByText('${name}');
    expect(element).toBeInTheDocument();
  });
});
`;

    await fs.writeFile(
      path.join(componentsDir, `${name}.test.${ext}`),
      testContent
    );

    return {
      name,
      type,
      path: `src/components/${name}.${ext}`,
      styled,
      test: `src/components/${name}.test.${ext}`
    };
  }

  /**
   * Sets up state management
   */
  async setupStore(type = 'redux') {
    const storeDir = path.join(this.projectRoot, 'src', 'store');
    await fs.mkdir(storeDir, { recursive: true });

    if (type === 'redux') {
      return await this.setupReduxStore(storeDir);
    } else if (type === 'zustand') {
      return await this.setupZustandStore(storeDir);
    } else {
      throw new Error(`Unknown store type: ${type}`);
    }
  }

  /**
   * Sets up Redux store
   */
  async setupReduxStore(storeDir) {
    const storeConfig = `import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`;

    await fs.writeFile(path.join(storeDir, 'index.js'), storeConfig);

    // Create reducers directory
    await fs.mkdir(path.join(storeDir, 'reducers'), { recursive: true });

    const rootReducer = `import { combineReducers } from '@reduxjs/toolkit';

const rootReducer = combineReducers({
  // Add your reducers here
});

export default rootReducer;
`;

    await fs.writeFile(path.join(storeDir, 'reducers', 'index.js'), rootReducer);

    // Create example slice
    const exampleSlice = `import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: 0,
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
`;

    await fs.writeFile(path.join(storeDir, 'counterSlice.js'), exampleSlice);

    return {
      type: 'redux',
      store: 'src/store/index.js',
      reducers: 'src/store/reducers/',
      example: 'src/store/counterSlice.js'
    };
  }

  /**
   * Sets up Zustand store
   */
  async setupZustandStore(storeDir) {
    const zustandStore = `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface StoreState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useStore = create<StoreState>()(
  devtools(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
        decrement: () => set((state) => ({ count: state.count - 1 })),
        reset: () => set({ count: 0 }),
      }),
      {
        name: 'app-storage',
      }
    )
  )
);

export default useStore;
`;

    await fs.writeFile(path.join(storeDir, 'index.js'), zustandStore);

    return {
      type: 'zustand',
      store: 'src/store/index.js'
    };
  }

  /**
   * Sets up routing
   */
  async setupRouting() {
    const srcDir = path.join(this.projectRoot, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    // Create router configuration
    const routerConfig = `import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
`;

    await fs.writeFile(path.join(srcDir, 'router.jsx'), routerConfig);

    // Create pages
    await this.createPages();

    // Create Layout component
    await this.createLayoutComponent();

    return {
      router: 'src/router.jsx',
      pages: ['HomePage', 'AboutPage', 'NotFoundPage'],
      layout: 'src/components/Layout.jsx'
    };
  }

  /**
   * Creates page components
   */
  async createPages() {
    const pagesDir = path.join(this.projectRoot, 'src', 'pages');
    await fs.mkdir(pagesDir, { recursive: true });

    const pages = {
      HomePage: `import React from 'react';

const HomePage = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the React app!</p>
    </div>
  );
};

export default HomePage;
`,
      AboutPage: `import React from 'react';

const AboutPage = () => {
  return (
    <div>
      <h1>About Page</h1>
      <p>This is the about page.</p>
    </div>
  );
};

export default AboutPage;
`,
      NotFoundPage: `import React from 'react';

const NotFoundPage = () => {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
};

export default NotFoundPage;
`
    };

    for (const [name, content] of Object.entries(pages)) {
      await fs.writeFile(path.join(pagesDir, `${name}.jsx`), content);
    }
  }

  /**
   * Creates Layout component
   */
  async createLayoutComponent() {
    const componentsDir = path.join(this.projectRoot, 'src', 'components');
    await fs.mkdir(componentsDir, { recursive: true });

    const layout = `import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
`;

    await fs.writeFile(path.join(componentsDir, 'Layout.jsx'), layout);
  }

  /**
   * Sets up testing
   */
  async setupTesting(framework = CONFIG.defaults.testFramework) {
    if (framework === 'vitest') {
      return await this.setupVitest();
    } else if (framework === 'jest') {
      return await this.setupJest();
    } else {
      throw new Error(`Unknown test framework: ${framework}`);
    }
  }

  /**
   * Sets up Vitest
   */
  async setupVitest() {
    const vitestConfig = `/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
`;

    await fs.writeFile(
      path.join(this.projectRoot, 'vitest.config.js'),
      vitestConfig
    );

    // Create test setup
    const testDir = path.join(this.projectRoot, 'src', 'test');
    await fs.mkdir(testDir, { recursive: true });

    const setupFile = `import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
`;

    await fs.writeFile(path.join(testDir, 'setup.js'), setupFile);

    // Create example test
    const exampleTest = `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders headline', () => {
    render(<App />);
    const headline = screen.getByText(/React/i);
    expect(headline).toBeInTheDocument();
  });
});
`;

    await fs.writeFile(path.join(testDir, 'App.test.jsx'), exampleTest);

    return {
      framework: 'vitest',
      config: 'vitest.config.js',
      setup: 'src/test/setup.js',
      example: 'src/test/App.test.jsx'
    };
  }

  /**
   * Sets up Jest
   */
  async setupJest() {
    const jestConfig = {
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-react',
          ],
        }],
      },
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'jest.config.json'),
      JSON.stringify(jestConfig, null, 2)
    );

    return {
      framework: 'jest',
      config: 'jest.config.json'
    };
  }
}

module.exports = ReactScaffoldManager;