#!/usr/bin/env node
/**
 * JavaScript ES6 Patterns - Context7 Best Practices
 *
 * Demonstrates modern ES6 patterns from Airbnb JavaScript Style Guide:
 * - Default parameters
 * - Object property shorthand
 * - Object method shorthand
 * - Spread syntax for copying
 * - Destructuring
 * - Arrow functions
 *
 * Source: /airbnb/javascript (221 snippets, trust 8.1)
 */

// Context7 Pattern 1: Default Parameters
function handleThings(opts = {}) {
  // ✅ CORRECT: Use default parameters instead of opts = opts || {}
  const {
    retries = 3,
    timeout = 5000,
    debug = false,
  } = opts;

  if (debug) {
    console.log(`Retries: ${retries}, Timeout: ${timeout}`);
  }

  return { retries, timeout, debug };
}

// Example usage
console.log('Pattern 1: Default Parameters');
console.log(handleThings());
console.log(handleThings({ retries: 5, debug: true }));

// Context7 Pattern 2: Object Property Shorthand
const lukeSkywalker = 'Luke Skywalker';
const age = 25;
const planet = 'Tatooine';

// ✅ CORRECT: Object property shorthand
const obj = {
  lukeSkywalker,  // instead of lukeSkywalker: lukeSkywalker
  age,
  planet,
};

console.log('\nPattern 2: Object Property Shorthand');
console.log(obj);

// Context7 Pattern 3: Object Method Shorthand
const atom = {
  value: 1,

  // ✅ CORRECT: Object method shorthand
  addValue(value) {
    return atom.value + value;
  },

  // Works with async too
  async fetchValue() {
    return Promise.resolve(this.value);
  },
};

console.log('\nPattern 3: Object Method Shorthand');
console.log(atom.addValue(5));

// Context7 Pattern 4: Spread Syntax for Copying
const original = { a: 1, b: 2 };

// ✅ CORRECT: Use spread for shallow copy
const copy = { ...original, c: 3 };

// Also works for arrays
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];

console.log('\nPattern 4: Spread Syntax');
console.log('Object copy:', copy);
console.log('Array copy:', arr2);

// Context7 Pattern 5: Destructuring
const user = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  address: {
    city: 'New York',
    country: 'USA',
  },
};

// ✅ CORRECT: Use destructuring
const { firstName, lastName, address: { city } } = user;

// Array destructuring
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;

console.log('\nPattern 5: Destructuring');
console.log(`Name: ${firstName} ${lastName}, City: ${city}`);
console.log(`First: ${first}, Second: ${second}, Rest: ${rest}`);

// Context7 Pattern 6: Arrow Functions
const items = [1, 2, 3, 4, 5];

// ✅ CORRECT: Use arrow functions for simple callbacks
const doubled = items.map(x => x * 2);
const evens = items.filter(x => x % 2 === 0);
const sum = items.reduce((acc, x) => acc + x, 0);

console.log('\nPattern 6: Arrow Functions');
console.log('Doubled:', doubled);
console.log('Evens:', evens);
console.log('Sum:', sum);

// Advanced ES6 Patterns

// Pattern 7: Template Literals
const buildGreeting = (name, time) => {
  // ✅ CORRECT: Use template literals instead of string concatenation
  return `Good ${time}, ${name}!`;
};

console.log('\nPattern 7: Template Literals');
console.log(buildGreeting('Alice', 'morning'));

// Pattern 8: Enhanced Object Literals
const getUser = (firstName, lastName, age) => ({
  // Property shorthand
  firstName,
  lastName,
  age,

  // Method shorthand
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  // Computed property names
  [`is${age >= 18 ? 'Adult' : 'Minor'}`]: true,
});

console.log('\nPattern 8: Enhanced Object Literals');
const alice = getUser('Alice', 'Smith', 25);
console.log(alice);
console.log(alice.getFullName());

// Pattern 9: Async/Await (Modern Promise Handling)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchData = async (url) => {
  try {
    // Simulate API call
    await delay(100);
    return { url, data: 'sample data' };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

const processMultipleRequests = async (urls) => {
  // ✅ CORRECT: Use Promise.all for parallel requests
  const results = await Promise.all(urls.map(url => fetchData(url)));
  return results;
};

// Pattern 10: Optional Chaining & Nullish Coalescing
const getUserEmail = (user) => {
  // ✅ CORRECT: Use optional chaining
  return user?.profile?.email ?? 'no-email@example.com';
};

console.log('\nPattern 10: Optional Chaining & Nullish Coalescing');
console.log(getUserEmail({ profile: { email: 'user@example.com' } }));
console.log(getUserEmail({}));
console.log(getUserEmail(null));

// Real-World Example: API Client
class ApiClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    // Destructuring with defaults
    const {
      timeout = 5000,
      retries = 3,
      headers = {},
    } = options;

    // Object shorthand
    this.config = {
      timeout,
      retries,
      headers: {
        'Content-Type': 'application/json',
        ...headers,  // Spread existing headers
      },
    };
  }

  async get(endpoint, params = {}) {
    // Template literal for URL
    const url = `${this.baseURL}/${endpoint}`;

    // Destructuring from config
    const { timeout, retries } = this.config;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await delay(100); // Simulate request
        return {
          status: 200,
          data: { endpoint, params },
        };
      } catch (error) {
        if (attempt === retries - 1) throw error;
      }
    }
  }

  async post(endpoint, data) {
    // Object method shorthand
    return this.makeRequest('POST', endpoint, data);
  }

  async makeRequest(method, endpoint, data) {
    // Arrow function in method
    const processResponse = (response) => ({
      ...response,
      timestamp: Date.now(),
    });

    await delay(100);
    const response = {
      status: 200,
      data,
      method,
      endpoint,
    };

    return processResponse(response);
  }

  // Static method with arrow function
  static create = (baseURL, options) => new ApiClient(baseURL, options);
}

// Usage
(async () => {
  console.log('\nReal-World Example: API Client');

  // Create client with defaults
  const client = ApiClient.create('https://api.example.com', {
    timeout: 3000,
    headers: { 'X-API-Key': 'secret' },
  });

  // Use async/await
  const response = await client.get('users', { page: 1 });
  console.log('GET response:', response);

  const postResponse = await client.post('users', {
    name: 'Alice',
    email: 'alice@example.com',
  });
  console.log('POST response:', postResponse);
})();

// Context7 Best Practices Summary
console.log(`
Context7 Verified Best Practices Applied:
==========================================
1. ✅ Default parameters instead of || operator
2. ✅ Object property shorthand ({ name } not { name: name })
3. ✅ Object method shorthand (method() {} not method: function() {})
4. ✅ Spread syntax for copying ({ ...obj } and [...arr])
5. ✅ Destructuring for cleaner code
6. ✅ Arrow functions for callbacks
7. ✅ Template literals for strings
8. ✅ Enhanced object literals
9. ✅ Async/await for promises
10. ✅ Optional chaining & nullish coalescing

Source:
- /airbnb/javascript (221 snippets, trust 8.1)

All patterns follow Airbnb JavaScript Style Guide
`);
