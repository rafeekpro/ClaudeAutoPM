/**
 * POC: Claude API Integration Tests
 * Following TDD - These tests should fail first, then pass after implementation
 */

const ClaudeProvider = require('../../lib/ai-providers/ClaudeProvider');
const PRDService = require('../../lib/services/PRDService');

describe('POC: Claude API Integration', () => {
  let provider;
  let service;

  beforeAll(() => {
    // Check for API key - skip tests if not available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set - skipping integration tests');
      console.warn('   Set it with: export ANTHROPIC_API_KEY="sk-ant-..."');
    }
  });

  beforeEach(() => {
    if (process.env.ANTHROPIC_API_KEY) {
      provider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY);
      service = new PRDService(provider);
    }
  });

  describe('ClaudeProvider', () => {
    test('should instantiate with API key', () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        return; // Skip if no API key
      }

      expect(provider).toBeDefined();
      expect(provider.client).toBeDefined();
    });

    test('should complete simple prompt', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const result = await provider.complete('Say exactly: "Hello, POC!"');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.toLowerCase()).toContain('hello');
      expect(result.length).toBeGreaterThan(0);
    }, 30000);

    test('should stream responses', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const chunks = [];
      for await (const chunk of provider.stream('Count to 3 slowly')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every(chunk => typeof chunk === 'string')).toBe(true);

      const fullText = chunks.join('');
      expect(fullText.length).toBeGreaterThan(0);
    }, 30000);

    test('should handle custom options', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const result = await provider.complete('Say "Options work!"', {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 100
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    }, 30000);

    test('should throw error with invalid API key', async () => {
      const invalidProvider = new ClaudeProvider('invalid-key');

      await expect(
        invalidProvider.complete('Test')
      ).rejects.toThrow();
    }, 30000);
  });

  describe('PRDService', () => {
    const samplePRD = `
# Payment System PRD

Build a payment processing system with the following features:

## Core Features
- Credit card processing with Stripe integration
- Payment history and transaction logs
- Refund management system
- Receipt generation

## Technical Requirements
- Node.js backend with Express
- PostgreSQL database
- Redis for caching
- React frontend

## Timeline
- Phase 1: Core payment processing (2 weeks)
- Phase 2: History and reporting (1 week)
- Phase 3: Refund system (1 week)
`;

    test('should parse simple PRD', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const result = await service.parse(samplePRD);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.toLowerCase()).toContain('payment');
      expect(result.length).toBeGreaterThan(50);
    }, 30000);

    test('should stream PRD parsing', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const chunks = [];
      for await (const chunk of service.parseStream(samplePRD)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);

      const fullResponse = chunks.join('');
      expect(fullResponse.toLowerCase()).toContain('payment');
    }, 30000);

    test('should extract structured information from PRD', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const result = await service.parse(samplePRD);

      // Should mention key elements
      const lowerResult = result.toLowerCase();
      expect(lowerResult).toContain('payment');
      expect(
        lowerResult.includes('stripe') ||
        lowerResult.includes('credit') ||
        lowerResult.includes('processing')
      ).toBe(true);
    }, 30000);

    test('should handle empty PRD gracefully', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const result = await service.parse('');
      expect(result).toBeDefined();
    }, 30000);
  });

  describe('Integration: Full PRD Analysis Flow', () => {
    test('should complete full PRD to structured output flow', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⏭️  Skipping - no API key');
        return;
      }

      const complexPRD = `
# E-commerce Platform PRD

## Overview
Build a modern e-commerce platform for small businesses.

## Epics

### Epic 1: Product Catalog
- Product listings with images
- Categories and search
- Inventory management

### Epic 2: Shopping Cart
- Add/remove items
- Promo codes
- Save for later

### Epic 3: Checkout
- Multi-step flow
- Payment integration
- Order confirmation

## Dependencies
- Epic 2 depends on Epic 1
- Epic 3 depends on Epic 2
`;

      const chunks = [];
      for await (const chunk of service.parseStream(complexPRD)) {
        chunks.push(chunk);
        // Simulate real-time display
        process.stdout.write('.');
      }
      process.stdout.write('\n');

      const fullResponse = chunks.join('');

      expect(fullResponse).toBeDefined();
      expect(fullResponse.length).toBeGreaterThan(100);

      // Should identify key elements
      const lowerResponse = fullResponse.toLowerCase();
      expect(
        lowerResponse.includes('product') ||
        lowerResponse.includes('catalog') ||
        lowerResponse.includes('epic')
      ).toBe(true);
    }, 45000);
  });
});
