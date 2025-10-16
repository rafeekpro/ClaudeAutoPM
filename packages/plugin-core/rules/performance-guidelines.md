# ⚡ Performance Guidelines & Optimization

> **Performance is a feature. Slow is broken.**

## Performance Targets

### 🌐 Web Performance Metrics

#### Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.5s
- **TTI (Time to Interactive)**: < 5s
- **TBT (Total Blocking Time)**: < 300ms

#### Page Load Targets

- **3G Network**: < 3 seconds
- **4G Network**: < 1.5 seconds
- **Broadband**: < 1 second
- **Repeat Visit**: < 500ms (with cache)

### 🔧 API Performance Targets

| Operation Type | Target | Maximum |
|---------------|--------|----------|
| Simple Query | < 50ms | 100ms |
| Complex Query | < 200ms | 500ms |
| Search | < 300ms | 1s |
| File Upload | < 1s/MB | 2s/MB |
| Batch Operation | < 5s | 10s |
| Real-time Updates | < 100ms | 200ms |

### 🗄️ Database Performance

| Query Type | Target | Action if Exceeded |
|-----------|--------|--------------------|
| Indexed SELECT | < 10ms | Add index |
| Complex JOIN | < 50ms | Optimize query |
| Full Table Scan | < 100ms | Add index/partition |
| Write Operation | < 20ms | Check locks |
| Transaction | < 100ms | Break down |

## Frontend Performance Optimization

### 📦 Bundle Size Budgets

```javascript
// Maximum bundle sizes
const budgets = {
  javascript: {
    initial: 200,     // KB (gzipped)
    lazy: 300,        // KB (gzipped)
  },
  css: {
    initial: 50,      // KB (gzipped)
    lazy: 100,        // KB (gzipped)
  },
  images: {
    hero: 200,        // KB
    thumbnail: 20,    // KB
    icon: 5,          // KB
  },
  total: {
    initial: 500,     // KB (all assets)
    full: 2000,       // KB (entire app)
  }
};
```

### 🎯 Optimization Checklist

#### Code Optimization

- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Tree shaking enabled
- [ ] Dead code eliminated
- [ ] Minification enabled
- [ ] Compression (gzip/brotli)
- [ ] Source maps in production

#### Asset Optimization

- [ ] Images optimized (WebP with fallback)
- [ ] Responsive images (srcset)
- [ ] Lazy loading images
- [ ] SVG optimization
- [ ] Font subsetting
- [ ] Critical CSS inlined
- [ ] Unused CSS removed

#### Caching Strategy

- [ ] Service Worker implemented
- [ ] Cache headers configured
- [ ] CDN for static assets
- [ ] Browser cache utilized
- [ ] API response caching
- [ ] Database query caching

#### Runtime Performance

- [ ] Virtual scrolling for long lists
- [ ] Debounced search inputs
- [ ] Throttled scroll handlers
- [ ] Web Workers for heavy computation
- [ ] RequestAnimationFrame for animations
- [ ] Avoid layout thrashing

### 📊 Performance Monitoring

```javascript
// Performance monitoring setup
const perfObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Log to analytics
    analytics.track('performance', {
      metric: entry.name,
      value: entry.value,
      page: window.location.pathname
    });
  }
});

// Observe all performance metrics
perfObserver.observe({ 
  entryTypes: ['navigation', 'resource', 'paint', 'measure'] 
});
```

## Backend Performance Optimization

### 🔄 API Optimization

#### Response Time Optimization

- [ ] Database connection pooling
- [ ] Query optimization (EXPLAIN ANALYZE)
- [ ] Proper indexing strategy
- [ ] N+1 query prevention
- [ ] Pagination implemented
- [ ] Response compression
- [ ] Field filtering (GraphQL/sparse fieldsets)

#### Caching Layers

```python
# Caching hierarchy
1. Browser Cache      → 0ms
2. CDN Edge Cache    → 10-50ms
3. Redis/Memcached   → 1-5ms
4. Application Cache → 0.1ms
5. Database Cache    → 5-10ms
6. Database Query    → 10-100ms
```

#### Concurrency & Scaling

- [ ] Async/await for I/O operations
- [ ] Worker threads for CPU-intensive tasks
- [ ] Queue for background jobs
- [ ] Rate limiting per endpoint
- [ ] Circuit breakers for external services
- [ ] Load balancing configured
- [ ] Auto-scaling policies

### 📈 Database Optimization

#### Query Optimization

```sql
-- Before optimization
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.country = 'US';

-- After optimization
SELECT o.id, o.total, u.name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.country = 'US'
AND o.created_at > NOW() - INTERVAL '30 days'
LIMIT 100;

-- With proper indexes
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
```

#### Index Strategy

- [ ] Primary keys on all tables
- [ ] Foreign key indexes
- [ ] Composite indexes for common queries
- [ ] Covering indexes for read-heavy queries
- [ ] Partial indexes for filtered queries
- [ ] Monitor index usage

## Performance Testing

### 🧪 Load Testing

```javascript
// Performance test scenarios
const scenarios = {
  baseline: {
    users: 100,
    duration: '5m',
    rampUp: '30s'
  },
  stress: {
    users: 1000,
    duration: '15m',
    rampUp: '2m'
  },
  spike: {
    users: 5000,
    duration: '10m',
    rampUp: '10s'
  },
  endurance: {
    users: 500,
    duration: '2h',
    rampUp: '5m'
  }
};
```

### 📏 Performance Benchmarks

| Metric | Excellent | Good | Needs Work | Unacceptable |
|--------|-----------|------|------------|---------------|
| Page Load | < 1s | < 2s | < 3s | > 3s |
| API Response | < 100ms | < 300ms | < 1s | > 1s |
| Database Query | < 10ms | < 50ms | < 200ms | > 200ms |
| CPU Usage | < 40% | < 60% | < 80% | > 80% |
| Memory Usage | < 50% | < 70% | < 85% | > 85% |
| Error Rate | < 0.1% | < 1% | < 5% | > 5% |

## Performance Monitoring Tools

### Frontend Monitoring

```javascript
// Real User Monitoring (RUM)
- Google Analytics / GA4
- New Relic Browser
- Datadog RUM
- Sentry Performance

// Synthetic Monitoring
- Lighthouse CI
- WebPageTest
- GTmetrix
- SpeedCurve
```

### Backend Monitoring

```yaml
# APM Tools
- New Relic APM
- Datadog APM
- AppDynamics
- Elastic APM

# Custom Metrics
- Prometheus + Grafana
- StatsD
- CloudWatch (AWS)
- Application Insights (Azure)
```

## Performance Budget Enforcement

### CI/CD Integration

```yaml
# Performance gates in pipeline
performance-check:
  stage: test
  script:
    - lighthouse ci --budget=./budget.json
    - bundlesize --max-size 200KB
    - npm run test:performance
  rules:
    fail_on:
      - lcp > 2500
      - fid > 100
      - cls > 0.1
      - bundle_size > budget
```

### Performance Reviews

#### Weekly Checks

- [ ] Core Web Vitals trends
- [ ] API response times
- [ ] Error rates
- [ ] Database slow query log

#### Monthly Analysis

- [ ] Performance regression analysis
- [ ] User impact assessment
- [ ] Infrastructure cost vs performance
- [ ] Optimization opportunities

## Quick Performance Wins

### Immediate Improvements

```bash
# Frontend
✅ Enable compression (gzip/brotli)
✅ Add Cache-Control headers
✅ Optimize images (WebP, lazy load)
✅ Minify CSS/JS
✅ Remove unused dependencies

# Backend
✅ Add database indexes
✅ Enable query caching
✅ Implement pagination
✅ Use connection pooling
✅ Add Redis caching

# Infrastructure
✅ Enable CDN
✅ Configure auto-scaling
✅ Optimize container size
✅ Use HTTP/2
✅ Enable keep-alive
```

## Performance Anti-Patterns

### Things to Avoid

```javascript
// ❌ DON'T DO THIS
- Synchronous API calls in loops
- Unbounded queries (SELECT * without LIMIT)
- Large DOM manipulations
- Inline styles/scripts
- Blocking resources in <head>
- Memory leaks (event listeners, timers)
- N+1 database queries
- Premature optimization

// ✅ DO THIS INSTEAD
- Batch API calls
- Paginate large datasets
- Virtual DOM / React
- External stylesheets
- Async/defer scripts
- Cleanup in useEffect/componentWillUnmount
- Eager loading with includes
- Measure first, optimize second
```

## Performance Culture

### Team Responsibilities

#### Developers

- Write performant code
- Test performance locally
- Monitor PR impact

#### DevOps

- Infrastructure optimization
- Monitoring setup
- Scaling policies

#### Product

- Define performance requirements
- Prioritize performance work
- Balance features vs speed

### Performance Reviews

- Include performance in code reviews
- Regular performance audits
- Performance retrospectives
- Celebrate performance wins

## Remember

**Every millisecond counts.**

- 100ms delay → 1% drop in sales
- 1 second delay → 7% reduction in conversions
- 3 seconds load → 53% mobile users leave

**Performance is not a one-time task—it's a continuous process.**
