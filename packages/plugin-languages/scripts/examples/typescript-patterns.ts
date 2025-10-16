#!/usr/bin/env tsx
/**
 * TypeScript Patterns - Context7 Best Practices
 *
 * Demonstrates modern TypeScript patterns for Node.js backend:
 * - Type-safe API client with generics
 * - Discriminated unions for type safety
 * - Utility types for transformation
 * - Decorators for cross-cutting concerns
 * - Async patterns with proper typing
 *
 * Combines patterns from:
 * - /nodejs/node (Node.js async patterns)
 * - /airbnb/javascript (ES6 best practices)
 */

// Type-safe API Response with Generics
interface ApiResponse<T> {
  status: number;
  data: T;
  error?: string;
  timestamp: Date;
}

// Discriminated Unions for Type Safety
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

// Utility Type Examples
type User = {
  id: number;
  email: string;
  username: string;
  password: string;
  createdAt: Date;
};

// ✅ CORRECT: Use Omit to exclude password from public user
type PublicUser = Omit<User, 'password'>;

// ✅ CORRECT: Use Pick to select specific fields
type UserCredentials = Pick<User, 'email' | 'password'>;

// ✅ CORRECT: Use Partial for update operations
type UserUpdate = Partial<Omit<User, 'id' | 'createdAt'>>;

// ✅ CORRECT: Use Required to enforce all fields
type CompleteUser = Required<User>;

// Type-Safe API Client
class ApiClient {
  constructor(
    private baseURL: string,
    private timeout: number = 5000
  ) {}

  // Generic method with proper typing
  async get<T>(endpoint: string): Promise<Result<T, string>> {
    try {
      // Simulate API call with AbortSignal (Node.js pattern)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // In real implementation, use fetch with signal
        await this.delay(100);
        clearTimeout(timeoutId);

        const data = { example: 'data' } as unknown as T;

        return {
          success: true,
          value: data,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async post<T, D>(
    endpoint: string,
    data: D
  ): Promise<Result<T, string>> {
    try {
      await this.delay(100);
      const result = data as unknown as T;

      return {
        success: true,
        value: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Type-Safe Repository Pattern
interface Repository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

class UserRepository implements Repository<User> {
  private users: Map<number, User> = new Map();
  private nextId = 1;

  async findById(id: number): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...data,
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }

    const updated = { ...existing, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.users.delete(id);
  }
}

// Service Layer with Type Safety
class UserService {
  constructor(
    private repository: UserRepository,
    private apiClient: ApiClient
  ) {}

  async createUser(
    credentials: UserCredentials
  ): Promise<Result<PublicUser, string>> {
    try {
      // Validate email format
      if (!this.isValidEmail(credentials.email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // Hash password (simplified)
      const hashedPassword = await this.hashPassword(credentials.password);

      // Create user
      const user = await this.repository.create({
        ...credentials,
        password: hashedPassword,
        username: credentials.email.split('@')[0],
        createdAt: new Date(),
      });

      // Return public user (without password)
      const publicUser = this.toPublicUser(user);

      return {
        success: true,
        value: publicUser,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getUser(id: number): Promise<Result<PublicUser, string>> {
    const user = await this.repository.findById(id);

    if (!user) {
      return {
        success: false,
        error: `User ${id} not found`,
      };
    }

    return {
      success: true,
      value: this.toPublicUser(user),
    };
  }

  async updateUser(
    id: number,
    update: UserUpdate
  ): Promise<Result<PublicUser, string>> {
    try {
      const updated = await this.repository.update(id, update);

      return {
        success: true,
        value: this.toPublicUser(updated),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Type guard
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async hashPassword(password: string): Promise<string> {
    // Simplified hashing
    return `hashed_${password}`;
  }

  // Type transformation helper
  private toPublicUser(user: User): PublicUser {
    // ✅ CORRECT: Use destructuring with rest to omit password
    const { password, ...publicUser } = user;
    return publicUser;
  }
}

// Async Iterator with TypeScript (Node.js pattern)
class AsyncDataProcessor<T> {
  constructor(private items: T[]) {}

  // ✅ CORRECT: Properly typed async generator
  async *process(): AsyncIterableIterator<T> {
    for (const item of this.items) {
      // Simulate async processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield item;
    }
  }

  async collect(): Promise<T[]> {
    const results: T[] = [];

    // ✅ CORRECT: for await...of with proper typing
    for await (const item of this.process()) {
      results.push(item);
    }

    return results;
  }
}

// Type-Safe Event Emitter
type EventMap = {
  userCreated: (user: PublicUser) => void;
  userUpdated: (id: number, updates: UserUpdate) => void;
  userDeleted: (id: number) => void;
};

class TypedEventEmitter {
  private handlers: Map<keyof EventMap, Set<Function>> = new Map();

  on<K extends keyof EventMap>(event: K, handler: EventMap[K]): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: Parameters<EventMap[K]>
  ): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }

  off<K extends keyof EventMap>(event: K, handler: EventMap[K]): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

// Demo Application
async function main() {
  console.log('TypeScript Patterns - Context7 Best Practices');
  console.log('='.repeat(60));

  // Initialize services
  const repository = new UserRepository();
  const apiClient = new ApiClient('https://api.example.com');
  const userService = new UserService(repository, apiClient);
  const eventEmitter = new TypedEventEmitter();

  // Setup event handlers
  eventEmitter.on('userCreated', (user) => {
    console.log(`\n[Event] User created: ${user.username} (${user.email})`);
  });

  eventEmitter.on('userUpdated', (id, updates) => {
    console.log(`\n[Event] User ${id} updated:`, updates);
  });

  // Pattern 1: Creating User with Type Safety
  console.log('\nPattern 1: Create User with Type Safety');
  const createResult = await userService.createUser({
    email: 'alice@example.com',
    password: 'securepass123',
  });

  if (createResult.success) {
    console.log('Created user:', createResult.value);
    eventEmitter.emit('userCreated', createResult.value);
  } else {
    console.error('Failed to create user:', createResult.error);
  }

  // Pattern 2: Type-Safe Updates with Partial
  console.log('\nPattern 2: Type-Safe Updates');
  if (createResult.success) {
    const updateResult = await userService.updateUser(createResult.value.id, {
      username: 'alice_smith',
      email: 'alice.smith@example.com',
    });

    if (updateResult.success) {
      console.log('Updated user:', updateResult.value);
      eventEmitter.emit('userUpdated', updateResult.value.id, {
        username: 'alice_smith',
      });
    }
  }

  // Pattern 3: Async Iterator with TypeScript
  console.log('\nPattern 3: Async Iterator Processing');
  const processor = new AsyncDataProcessor([1, 2, 3, 4, 5]);

  console.log('Processing items...');
  for await (const item of processor.process()) {
    console.log(`  Processed: ${item}`);
  }

  // Pattern 4: Generic API Client
  console.log('\nPattern 4: Generic API Client');
  type TodoItem = { id: number; title: string; completed: boolean };

  const todoResult = await apiClient.get<TodoItem[]>('/todos');

  if (todoResult.success) {
    console.log('Fetched todos:', todoResult.value);
  } else {
    console.error('Failed to fetch todos:', todoResult.error);
  }

  // Pattern 5: Result Type Pattern
  console.log('\nPattern 5: Result Type Pattern');
  const users = await repository.findAll();
  console.log(`Total users in repository: ${users.length}`);

  users.forEach((user) => {
    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
    console.log(`  - ${publicUser.username} (${publicUser.email})`);
  });

  console.log(`
Context7 Verified TypeScript Patterns:
======================================
1. ✅ Generic types for reusable components
2. ✅ Discriminated unions for type-safe error handling
3. ✅ Utility types (Omit, Pick, Partial, Required)
4. ✅ Type guards and type narrowing
5. ✅ Async iterators with proper typing
6. ✅ Type-safe event emitters
7. ✅ Repository pattern with generics
8. ✅ Service layer with error handling
9. ✅ Result type pattern for operations
10. ✅ Proper async/await typing

Sources:
- /nodejs/node (async patterns with typing)
- /airbnb/javascript (ES6 patterns with TypeScript)

Type Safety Benefits:
- Compile-time error detection
- IDE autocomplete and IntelliSense
- Refactoring confidence
- Self-documenting code
- Reduced runtime errors
`);
}

// Run the demo
main().catch(console.error);
