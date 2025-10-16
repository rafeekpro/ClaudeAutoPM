/**
 * Vue Test Utils + Vitest Example
 *
 * Context7-verified patterns from:
 * - /vitest-dev/vitest
 * - Vue Test Utils documentation
 *
 * Demonstrates best practices for testing Vue 3 components
 * with Vitest and Vue Test Utils
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';

// ===================================
// EXAMPLE COMPONENTS TO TEST
// ===================================

const Button = {
  name: 'Button',
  props: {
    disabled: Boolean,
    loading: Boolean
  },
  emits: ['click'],
  template: `
    <button
      :disabled="disabled || loading"
      @click="$emit('click', $event)"
    >
      <span v-if="loading">Loading...</span>
      <slot v-else />
    </button>
  `
};

const LoginForm = {
  name: 'LoginForm',
  data() {
    return {
      email: '',
      password: '',
      error: '',
      loading: false
    };
  },
  emits: ['submit'],
  methods: {
    async handleSubmit() {
      this.error = '';

      if (!this.email || !this.password) {
        this.error = 'Email and password are required';
        return;
      }

      this.loading = true;
      try {
        await this.$emit('submit', { email: this.email, password: this.password });
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
        />
      </div>

      <div>
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
        />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Log in' }}
      </button>
    </form>
  `
};

const UserList = {
  name: 'UserList',
  props: {
    users: {
      type: Array,
      required: true
    }
  },
  emits: ['user-click'],
  template: `
    <div>
      <p v-if="users.length === 0">No users found</p>
      <ul v-else>
        <li v-for="user in users" :key="user.id">
          <button @click="$emit('user-click', user)">
            {{ user.name }}
          </button>
        </li>
      </ul>
    </div>
  `
};

const Counter = {
  name: 'Counter',
  data() {
    return {
      count: 0
    };
  },
  computed: {
    doubleCount() {
      return this.count * 2;
    }
  },
  methods: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
    reset() {
      this.count = 0;
    }
  },
  template: `
    <div>
      <p class="count">Count: {{ count }}</p>
      <p class="double">Double: {{ doubleCount }}</p>
      <button @click="increment" class="increment">+</button>
      <button @click="decrement" class="decrement">-</button>
      <button @click="reset" class="reset">Reset</button>
    </div>
  `
};

// ===================================
// TEST SUITE 1: BASIC BUTTON
// ===================================

describe('Button Component', () => {
  // ✅ CORRECT: Test component rendering
  it('should render with slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    });

    expect(wrapper.text()).toContain('Click me');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  // ✅ CORRECT: Test event emission
  it('should emit click event when clicked', async () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' }
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted()).toHaveProperty('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  // ✅ CORRECT: Test prop-based disabled state
  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Submit' }
    });

    expect(wrapper.find('button').element.disabled).toBe(true);
  });

  // ✅ CORRECT: Test loading state
  it('should show loading state and be disabled', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: 'Submit' }
    });

    expect(wrapper.text()).toContain('Loading...');
    expect(wrapper.find('button').element.disabled).toBe(true);
  });
});

// ===================================
// TEST SUITE 2: LOGIN FORM
// ===================================

describe('LoginForm Component', () => {
  // ✅ CORRECT: Test v-model binding
  it('should bind input values to data', async () => {
    const wrapper = mount(LoginForm);

    const emailInput = wrapper.find('#email');
    const passwordInput = wrapper.find('#password');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('password123');

    expect(wrapper.vm.email).toBe('test@example.com');
    expect(wrapper.vm.password).toBe('password123');
  });

  // ✅ CORRECT: Test form submission
  it('should emit submit event with credentials', async () => {
    const wrapper = mount(LoginForm);

    await wrapper.find('#email').setValue('test@example.com');
    await wrapper.find('#password').setValue('password123');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  // ✅ CORRECT: Test validation
  it('should show error when fields are empty', async () => {
    const wrapper = mount(LoginForm);

    await wrapper.find('form').trigger('submit');

    // Wait for next tick for data updates
    await nextTick();

    expect(wrapper.find('.error').text()).toBe('Email and password are required');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  // ✅ CORRECT: Test loading state during submission
  it('should show loading state while submitting', async () => {
    const wrapper = mount(LoginForm);

    await wrapper.find('#email').setValue('test@example.com');
    await wrapper.find('#password').setValue('password');

    // Manually set loading to simulate async operation
    await wrapper.setData({ loading: true });

    expect(wrapper.find('button').text()).toBe('Logging in...');
    expect(wrapper.find('button').element.disabled).toBe(true);
  });
});

// ===================================
// TEST SUITE 3: USER LIST
// ===================================

describe('UserList Component', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' }
  ];

  // ✅ CORRECT: Test rendering with props
  it('should render all users from props', () => {
    const wrapper = mount(UserList, {
      props: {
        users: mockUsers
      }
    });

    const items = wrapper.findAll('li');
    expect(items).toHaveLength(3);

    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('Jane Smith');
    expect(wrapper.text()).toContain('Bob Johnson');
  });

  // ✅ CORRECT: Test empty state
  it('should show "No users" message when list is empty', () => {
    const wrapper = mount(UserList, {
      props: {
        users: []
      }
    });

    expect(wrapper.text()).toContain('No users found');
    expect(wrapper.findAll('li')).toHaveLength(0);
  });

  // ✅ CORRECT: Test event emission with data
  it('should emit user-click event with user data', async () => {
    const wrapper = mount(UserList, {
      props: {
        users: mockUsers
      }
    });

    // Click on second user button
    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('user-click')).toBeTruthy();
    expect(wrapper.emitted('user-click')[0][0]).toEqual({
      id: 2,
      name: 'Jane Smith'
    });
  });

  // ✅ CORRECT: Test conditional rendering
  it('should not render list when users array is empty', () => {
    const wrapper = mount(UserList, {
      props: { users: [] }
    });

    expect(wrapper.find('ul').exists()).toBe(false);
    expect(wrapper.find('p').exists()).toBe(true);
  });
});

// ===================================
// TEST SUITE 4: COUNTER (STATE & COMPUTED)
// ===================================

describe('Counter Component', () => {
  // ✅ CORRECT: Test initial state
  it('should have initial count of 0', () => {
    const wrapper = mount(Counter);

    expect(wrapper.vm.count).toBe(0);
    expect(wrapper.find('.count').text()).toBe('Count: 0');
  });

  // ✅ CORRECT: Test computed properties
  it('should calculate double count correctly', () => {
    const wrapper = mount(Counter);

    expect(wrapper.vm.doubleCount).toBe(0);
    expect(wrapper.find('.double').text()).toBe('Double: 0');
  });

  // ✅ CORRECT: Test increment method
  it('should increment count when + button clicked', async () => {
    const wrapper = mount(Counter);

    await wrapper.find('.increment').trigger('click');

    expect(wrapper.vm.count).toBe(1);
    expect(wrapper.find('.count').text()).toBe('Count: 1');
    expect(wrapper.find('.double').text()).toBe('Double: 2');
  });

  // ✅ CORRECT: Test decrement method
  it('should decrement count when - button clicked', async () => {
    const wrapper = mount(Counter);

    // Set initial count
    await wrapper.setData({ count: 5 });

    await wrapper.find('.decrement').trigger('click');

    expect(wrapper.vm.count).toBe(4);
  });

  // ✅ CORRECT: Test reset method
  it('should reset count to 0', async () => {
    const wrapper = mount(Counter);

    await wrapper.setData({ count: 10 });
    await wrapper.find('.reset').trigger('click');

    expect(wrapper.vm.count).toBe(0);
  });
});

// ===================================
// TEST SUITE 5: ASYNC OPERATIONS
// ===================================

const AsyncUserList = {
  name: 'AsyncUserList',
  data() {
    return {
      users: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const response = await fetch('/api/users');
      this.users = await response.json();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  },
  template: `
    <div>
      <div v-if="loading">Loading...</div>
      <div v-else-if="error" class="error">Error: {{ error }}</div>
      <UserList v-else :users="users" />
    </div>
  `,
  components: { UserList }
};

describe('AsyncUserList Component', () => {
  // Mock fetch
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ✅ CORRECT: Test loading state
  it('should show loading state initially', () => {
    const wrapper = mount(AsyncUserList);

    expect(wrapper.text()).toContain('Loading...');
  });

  // ✅ CORRECT: Test successful data fetch
  it('should display users after successful fetch', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ];

    global.fetch.mockResolvedValue({
      json: () => Promise.resolve(mockUsers)
    });

    const wrapper = mount(AsyncUserList);

    // Wait for all promises to resolve
    await flushPromises();

    expect(wrapper.text()).not.toContain('Loading...');
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('Jane Smith');
  });

  // ✅ CORRECT: Test error handling
  it('should display error message on fetch failure', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    const wrapper = mount(AsyncUserList);

    await flushPromises();

    expect(wrapper.find('.error').text()).toContain('Error: Network error');
  });
});

// ===================================
// TEST SUITE 6: PINIA STORE INTEGRATION
// ===================================

const ComponentWithStore = {
  name: 'ComponentWithStore',
  setup() {
    const store = useUserStore();
    return { store };
  },
  template: `
    <div>
      <p>User: {{ store.currentUser?.name }}</p>
      <button @click="store.setUser({ id: 1, name: 'Test User' })">
        Set User
      </button>
    </div>
  `
};

describe('Component with Pinia Store', () => {
  // ✅ CORRECT: Test with Pinia testing utilities
  it('should interact with Pinia store', async () => {
    const wrapper = mount(ComponentWithStore, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              user: {
                currentUser: null
              }
            }
          })
        ]
      }
    });

    // Initially no user
    expect(wrapper.text()).toContain('User:');

    // Click button to set user
    await wrapper.find('button').trigger('click');

    // Check if store action was called
    const store = useUserStore();
    expect(store.setUser).toHaveBeenCalledWith({
      id: 1,
      name: 'Test User'
    });
  });
});

// ===================================
// BEST PRACTICES DEMONSTRATED
// ===================================

/**
 * ✅ MOUNTING OPTIONS (Context7-verified):
 *    - props: Pass props to component
 *    - slots: Provide slot content
 *    - data: Override component data
 *    - global: Global plugins, directives, mixins
 *
 * ✅ ASYNC UTILITIES:
 *    - flushPromises() (wait for all promises)
 *    - nextTick() (wait for DOM updates)
 *    - await wrapper.vm.$nextTick()
 *
 * ✅ WRAPPER METHODS:
 *    - find(selector) - Find first element
 *    - findAll(selector) - Find all elements
 *    - trigger(event) - Trigger event
 *    - setValue(value) - Set input value
 *    - setData(data) - Update component data
 *
 * ✅ ASSERTIONS:
 *    - wrapper.text() - Get text content
 *    - wrapper.html() - Get HTML
 *    - wrapper.vm - Access Vue instance
 *    - wrapper.emitted() - Check emitted events
 *    - wrapper.exists() - Check if exists
 *
 * ✅ TEST INDEPENDENCE:
 *    - beforeEach for setup
 *    - afterEach for cleanup
 *    - No shared mutable state
 */

/**
 * ❌ ANTI-PATTERNS TO AVOID:
 *
 * ❌ Don't use shallow rendering unnecessarily:
 *    shallow(Component) // Prefer mount()
 *
 * ❌ Don't test Vue internals:
 *    wrapper.vm.$options
 *    wrapper.vm._data
 *
 * ❌ Don't forget to await:
 *    wrapper.find('button').trigger('click')
 *    expect(...)  // Should await trigger()
 *
 * ❌ Don't forget flushPromises:
 *    await fetch('/api')
 *    expect(wrapper.text())  // Need flushPromises()
 *
 * ❌ Don't depend on test order:
 *    let wrapper = null;
 *    test('1', () => { wrapper = mount(...); });
 *    test('2', () => { wrapper.find(...); });
 */
