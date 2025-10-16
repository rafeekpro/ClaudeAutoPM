# nextjs:optimize

Optimize Next.js application for production with Context7-verified patterns for images, fonts, builds, and performance.

## Description

Comprehensive Next.js optimization following official Vercel best practices:
- Image optimization (next/image component)
- Font optimization (next/font)
- Build optimization and bundle analysis
- Production configuration
- Caching strategies
- Core Web Vitals improvement

## Required Documentation Access

**MANDATORY:** Before optimization, query Context7 for Next.js best practices:

**Documentation Queries:**
- `mcp://context7/nextjs/image-optimization` - Image component and optimization
- `mcp://context7/nextjs/font-optimization` - Font loading and optimization
- `mcp://context7/nextjs/performance` - Performance best practices
- `mcp://context7/nextjs/production` - Production configuration
- `mcp://context7/nextjs/app-router` - App Router optimization patterns

**Why This is Required:**
- Ensures optimization follows official Next.js documentation
- Applies latest performance patterns from Vercel
- Validates configuration and production setup
- Prevents anti-patterns and common mistakes

## Usage

```bash
/nextjs:optimize [options]
```

## Options

- `--scope <images|fonts|build|all>` - Optimization scope (default: all)
- `--analyze-only` - Analyze without applying changes
- `--output <file>` - Write optimization report
- `--app-router` - Optimize for App Router
- `--pages-router` - Optimize for Pages Router
- `--aggressive` - Apply aggressive optimizations

## Examples

### Full Application Optimization
```bash
/nextjs:optimize
```

### Image Optimization Only
```bash
/nextjs:optimize --scope images --output image-report.md
```

### Font Optimization
```bash
/nextjs:optimize --scope fonts
```

### Build Analysis
```bash
/nextjs:optimize --scope build --analyze-only
```

## Optimization Categories

### 1. Image Optimization with next/image

**Pattern from Context7 (/vercel/next.js):**

#### Remote Images

```tsx
// BEFORE: Standard img tag (no optimization)
<img
  src="https://s3.amazonaws.com/my-bucket/profile.png"
  alt="Picture of the author"
  width={500}
  height={500}
/>

// AFTER: Next.js Image component (optimized)
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="https://s3.amazonaws.com/my-bucket/profile.png"
      alt="Picture of the author"
      width={500}
      height={500}
      priority // For LCP images
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}
```

**Configuration in next.config.js:**

```js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/my-bucket/**',
        search: '',
      },
    ],
  },
}
```

**Benefits:**
- Automatic image optimization (WebP/AVIF)
- Lazy loading by default
- Responsive image sizes
- Prevents layout shift (CLS)
- 40-60% smaller file sizes

#### Responsive Images with sizes

```javascript
import Image from 'next/image'

const Example = () => (
  <div className="grid-element">
    <Image
      src="/example.png"
      layout="fill"
      sizes="(max-width: 768px) 100vw,
             (max-width: 1200px) 50vw,
             33vw"
      priority={false} // Lazy load non-critical images
      quality={75} // Default quality (1-100)
    />
  </div>
)
```

**Why sizes matters:**
- Prevents downloading oversized images
- Improves mobile performance significantly
- Reduces bandwidth usage by 50-70%

#### Background Images with getImageProps

```tsx
import { getImageProps } from 'next/image'

function getBackgroundImage(srcSet = '') {
  const imageSet = srcSet
    .split(', ')
    .map((str) => {
      const [url, dpi] = str.split(' ')
      return `url("${url}") ${dpi}`
    })
    .join(', ')
  return `image-set(${imageSet})`
}

export default function Home() {
  const {
    props: { srcSet },
  } = getImageProps({
    alt: '',
    width: 128,
    height: 128,
    src: '/img.png',
  })

  const backgroundImage = getBackgroundImage(srcSet)
  const style = {
    height: '100vh',
    width: '100vw',
    backgroundImage,
  }

  return (
    <main style={style}>
      <h1>Hello World</h1>
    </main>
  )
}
```

#### SVG Images

```jsx
// Enable SVG optimization (use with caution)
// next.config.js
module.exports = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

// Component
<Image src="/my-image.svg" unoptimized />
```

### 2. Font Optimization with next/font

**Pattern from Context7:**

#### Google Fonts

```typescript
// BEFORE: External font loading (layout shift)
import Head from 'next/head'

export default function Page() {
  return (
    <Head>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
        rel="stylesheet"
      />
    </Head>
  )
}

// AFTER: next/font (self-hosted, zero layout shift)
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

**Benefits:**
- Self-hosted fonts (no external requests)
- Zero layout shift (CLS = 0)
- Automatic font subsetting
- Optimal loading strategy

#### Variable Fonts

```typescript
// Variable font (recommended)
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

```css
/* Use CSS variable */
.text {
  font-family: var(--font-inter);
  font-weight: 200;
  font-style: italic;
}
```

#### Non-Variable Fonts (e.g., Roboto)

```typescript
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['400', '700'], // Multiple weights
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.className}>
      <body>{children}</body>
    </html>
  )
}
```

#### Local Fonts

```typescript
// Single font file
import localFont from 'next/font/local'

const myFont = localFont({
  src: './my-font.woff2',
  display: 'swap',
})

// Multiple font files (font family)
const roboto = localFont({
  src: [
    {
      path: './Roboto-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './Roboto-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './Roboto-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.className}>
      <body>{children}</body>
    </html>
  )
}
```

### 3. Build Optimization

**next.config.js Configuration:**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false, // Security
    contentDispositionType: 'attachment',
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['@mui/material', '@chakra-ui/react'],
  },

  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side only optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
```

### 4. Production Configuration

**Environment Variables:**

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.production.com
NODE_ENV=production

# Performance
NEXT_TELEMETRY_DISABLED=1

# Build optimizations
NEXT_PRIVATE_STANDALONE=true
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "analyze": "ANALYZE=true next build",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### 5. Caching Strategies

**App Router Caching:**

```typescript
// Static page (cached indefinitely)
export const revalidate = false

// ISR (revalidate every hour)
export const revalidate = 3600

// Dynamic page (no cache)
export const dynamic = 'force-dynamic'

// Fetch with custom cache
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },
  })
  return res.json()
}
```

**Pages Router Caching:**

```typescript
// Static generation with revalidation
export async function getStaticProps() {
  const data = await fetchData()

  return {
    props: { data },
    revalidate: 3600, // ISR every hour
  }
}

// Server-side rendering (no cache)
export async function getServerSideProps() {
  const data = await fetchData()

  return {
    props: { data },
  }
}
```

### 6. Core Web Vitals Optimization

**Largest Contentful Paint (LCP):**

```tsx
// Prioritize above-the-fold images
<Image
  src="/hero.jpg"
  priority // Preload this image
  alt="Hero"
  width={1920}
  height={1080}
/>

// Preload critical resources
import Head from 'next/head'

<Head>
  <link
    rel="preload"
    href="/fonts/inter-var.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
</Head>
```

**Cumulative Layout Shift (CLS):**

```tsx
// Always specify image dimensions
<Image
  src="/profile.jpg"
  width={400}
  height={400}
  alt="Profile"
/>

// Use font display strategies
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // or 'optional' for best CLS
})
```

**First Input Delay (FID):**

```tsx
// Code splitting for heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Client-side only
})
```

## Optimization Output

```
🚀 Next.js Optimization Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: Next.js 15.1.8 (App Router)
Pages Analyzed: 23
Components Analyzed: 156

📸 Image Optimization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️  Found 15 <img> tags (should use next/image)
     Files: /app/profile/page.tsx, /app/gallery/page.tsx
     💡 Recommendation: Replace with Image component
     ⚡ Impact: 50-70% size reduction, lazy loading

  ⚠️  Missing sizes prop on 8 images
     💡 Recommendation: Add responsive sizes
     ⚡ Impact: Prevent oversized image downloads

  ❌ Hero image not prioritized (/app/page.tsx)
     💡 Recommendation: Add priority prop
     ⚡ Impact: Improve LCP by 1.2s

  ⚠️  Remote images not configured
     💡 Recommendation: Add remotePatterns to next.config.js
     ⚡ Impact: Enable optimization for external images

🔤 Font Optimization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ Using Google Fonts CDN (layout/page.tsx)
     💡 Recommendation: Use next/font/google
     ⚡ Impact: Eliminate layout shift (CLS), self-host fonts

  ✅ Inter font properly configured (app/layout.tsx)
  ✅ Using variable fonts for optimal loading

📦 Build Optimization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Current Bundle Size: 342 KB (first load JS)
  Target: < 200 KB

  ⚠️  Large bundle detected
     Top contributors:
     - @mui/material: 128 KB
     - lodash: 45 KB
     - moment: 38 KB

     💡 Recommendations:
     1. Enable optimizePackageImports for @mui
     2. Replace lodash with lodash-es (tree-shakeable)
     3. Replace moment with date-fns (92% smaller)
     ⚡ Impact: Reduce bundle by 180 KB (53%)

  ⚠️  No code splitting detected
     💡 Recommendation: Use dynamic imports
     ⚡ Impact: Faster initial load

⚡ Performance Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Current Core Web Vitals:
  - LCP: 3.2s (❌ needs improvement, target: < 2.5s)
  - FID: 80ms (✅ good, target: < 100ms)
  - CLS: 0.18 (⚠️  needs improvement, target: < 0.1)

  Optimization Impact:
  - LCP: 3.2s → 1.8s (1.4s improvement)
  - CLS: 0.18 → 0.02 (0.16 improvement)

🔧 Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️  Missing production optimizations
     💡 Recommendations:
     1. Enable compress: true
     2. Set poweredByHeader: false
     3. Configure removeConsole in production
     4. Add cache headers

Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Optimizations: 18

  🔴 Critical: 3 (fix immediately)
  🟡 High Impact: 8 (recommended)
  🟢 Low Impact: 7 (optional)

  Estimated Performance Improvement:
  - Bundle size: -53% (342 KB → 161 KB)
  - LCP: -44% (3.2s → 1.8s)
  - CLS: -89% (0.18 → 0.02)
  - Image bandwidth: -60%

  Run with --aggressive to apply all optimizations
```

## Implementation

This command uses the **@react-frontend-engineer** agent with Next.js expertise:

1. Query Context7 for Next.js optimization patterns
2. Analyze next.config.js configuration
3. Scan for image and font usage
4. Analyze bundle size and composition
5. Check Core Web Vitals metrics
6. Generate optimization recommendations
7. Optionally apply automated fixes

## Best Practices Applied

Based on Context7 documentation from `/vercel/next.js`:

1. **next/image** - Automatic image optimization
2. **next/font** - Self-hosted font optimization
3. **Build Configuration** - Production-ready settings
4. **Caching Strategies** - ISR and static generation
5. **Code Splitting** - Dynamic imports
6. **Core Web Vitals** - LCP, FID, CLS optimization
7. **Bundle Analysis** - Size reduction techniques
8. **Security** - Header configuration

## Related Commands

- `/react:optimize` - React component optimization
- `/bundle:analyze` - Deep bundle analysis
- `/lighthouse:audit` - Lighthouse performance audit
- `/vercel:deploy` - Vercel deployment optimization

## Troubleshooting

### Images Not Optimizing
- Check remotePatterns in next.config.js
- Verify Image component props (width, height)
- Ensure src is accessible

### Fonts Causing Layout Shift
- Use display: 'swap' or 'optional'
- Apply font to html element
- Preload critical fonts

### Large Bundle Size
- Enable optimizePackageImports
- Use dynamic imports
- Replace heavy dependencies

## Version History

- v2.0.0 - Initial Schema v2.0 release with Context7 integration
- Next.js 15+ App Router support
- Image and font optimization patterns
- Core Web Vitals focus
