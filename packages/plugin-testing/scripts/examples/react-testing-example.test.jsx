/**
 * React Testing Library Example
 *
 * Context7-verified patterns from:
 * - /testing-library/react-testing-library
 * - /testing-library/testing-library-docs
 *
 * Demonstrates best practices for testing React components
 * with Vitest and React Testing Library
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// ===================================
// EXAMPLE COMPONENTS TO TEST
// ===================================

function Button({ children, onClick, disabled, loading }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}>
      {loading ? <span role="status">Loading...</span> : children}
    </button>
  );
}

function LoginForm({ onSubmit }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <div role="alert">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
}

function UserList({ users, onUserClick }) {
  if (!users || users.length === 0) {
    return <p>No users found</p>;
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <button onClick={() => onUserClick(user)}>
            {user.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

// ===================================
// MSW SERVER SETUP (API MOCKING)
// ===================================

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ])
    );
  }),

  rest.post('/api/login', (req, res, ctx) => {
    const { email, password } = req.body;

    if (email === 'test@example.com' && password === 'password') {
      return res(ctx.json({ token: 'fake-jwt-token' }));
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid credentials' })
    );
  })
);

// Setup/teardown
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// ===================================
// TEST SUITE 1: BASIC BUTTON
// ===================================

describe('Button Component', () => {
  // ✅ CORRECT: Query by role (accessible)
  it('should render with text', () => {
    render(<Button>Click me</Button>);

    // Use getByRole for accessibility
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  // ✅ CORRECT: Test user interactions
  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // ✅ CORRECT: Test disabled state
  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  // ✅ CORRECT: Test loading state
  it('should show loading state', () => {
    render(<Button loading>Submit</Button>);

    // Check for loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Button should be disabled while loading
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

// ===================================
// TEST SUITE 2: LOGIN FORM (AAA PATTERN)
// ===================================

describe('LoginForm Component', () => {
  // ✅ CORRECT: AAA Pattern (Arrange-Act-Assert)
  it('should submit form with valid credentials', async () => {
    // ARRANGE: Setup test data and spies
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();

    render(<LoginForm onSubmit={handleSubmit} />);

    // ACT: Perform user actions
    // ✅ Use getByLabelText for form fields
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // ASSERT: Verify expected outcome
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  // ✅ CORRECT: Test validation
  it('should show error when fields are empty', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    // Submit without filling fields
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // Check for error message
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email and password are required'
    );

    // Form should not submit
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  // ✅ CORRECT: Test async error handling
  it('should display error message on failed submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockRejectedValue(
      new Error('Invalid credentials')
    );

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // ✅ Use waitFor for async state changes
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  // ✅ CORRECT: Test loading state during submission
  it('should show loading state while submitting', async () => {
    const user = userEvent.setup();
    let resolveSubmit;
    const handleSubmit = vi.fn(
      () => new Promise((resolve) => {
        resolveSubmit = resolve;
      })
    );

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');

    // Click submit button
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // Check loading state
    expect(screen.getByRole('button')).toHaveTextContent('Logging in...');
    expect(screen.getByRole('button')).toBeDisabled();

    // Resolve the submission
    resolveSubmit();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Log in');
    });
  });
});

// ===================================
// TEST SUITE 3: USER LIST (CONTEXT QUERIES)
// ===================================

describe('UserList Component', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' }
  ];

  // ✅ CORRECT: Test rendering list
  it('should render all users', () => {
    render(<UserList users={mockUsers} />);

    // Check each user is rendered
    expect(screen.getByRole('button', { name: 'John Doe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jane Smith' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bob Johnson' })).toBeInTheDocument();
  });

  // ✅ CORRECT: Test empty state
  it('should show "No users" message when list is empty', () => {
    render(<UserList users={[]} />);

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  // ✅ CORRECT: Test user interaction with specific item
  it('should call onUserClick with correct user', async () => {
    const user = userEvent.setup();
    const handleUserClick = vi.fn();

    render(<UserList users={mockUsers} onUserClick={handleUserClick} />);

    // Click on Jane Smith
    await user.click(screen.getByRole('button', { name: 'Jane Smith' }));

    expect(handleUserClick).toHaveBeenCalledWith({
      id: 2,
      name: 'Jane Smith'
    });
  });

  // ✅ CORRECT: Using within() for scoped queries
  it('should render users in list items', () => {
    render(<UserList users={mockUsers} />);

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(3);

    // Query within specific list item
    const firstItem = items[0];
    expect(within(firstItem).getByRole('button')).toHaveTextContent('John Doe');
  });
});

// ===================================
// TEST SUITE 4: ASYNC DATA FETCHING
// ===================================

function AsyncUserList() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div role="alert">Error: {error}</div>;

  return <UserList users={users} />;
}

describe('AsyncUserList Component', () => {
  // ✅ CORRECT: Test loading state
  it('should show loading state initially', () => {
    render(<AsyncUserList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // ✅ CORRECT: Test successful data fetch (findBy for async)
  it('should display users after successful fetch', async () => {
    render(<AsyncUserList />);

    // ✅ findBy* automatically waits for element
    expect(await screen.findByRole('button', { name: 'John Doe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jane Smith' })).toBeInTheDocument();

    // Loading should be gone
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  // ✅ CORRECT: Test error handling
  it('should display error message on fetch failure', async () => {
    // Override MSW handler for this test
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    render(<AsyncUserList />);

    // Wait for error message
    expect(await screen.findByRole('alert')).toHaveTextContent('Error:');
  });
});

// ===================================
// BEST PRACTICES DEMONSTRATED
// ===================================

/**
 * ✅ QUERY PRIORITY (Context7-verified):
 *    1. getByRole (accessible)
 *    2. getByLabelText (forms)
 *    3. getByText (visible text)
 *    4. getByTestId (last resort)
 *
 * ✅ ASYNC UTILITIES:
 *    - findBy* (waits and retries)
 *    - waitFor() (complex conditions)
 *    - Never use setTimeout()
 *
 * ✅ USER-CENTRIC:
 *    - Test behavior, not implementation
 *    - Use userEvent over fireEvent
 *    - Avoid accessing component state
 *
 * ✅ AAA PATTERN:
 *    - Arrange (setup)
 *    - Act (user interaction)
 *    - Assert (verify outcome)
 *
 * ✅ TEST INDEPENDENCE:
 *    - beforeEach for clean state
 *    - cleanup after each test
 *    - No shared mutable state
 *
 * ✅ ACCESSIBILITY:
 *    - Use semantic queries
 *    - Check ARIA roles
 *    - Test keyboard navigation
 */

/**
 * ❌ ANTI-PATTERNS TO AVOID:
 *
 * ❌ Don't use CSS selectors:
 *    container.querySelector('.button')
 *
 * ❌ Don't use manual delays:
 *    await new Promise(r => setTimeout(r, 1000))
 *
 * ❌ Don't test implementation:
 *    wrapper.state().count
 *
 * ❌ Don't depend on test order:
 *    let sharedData = null;
 *    test('1', () => { sharedData = 'x'; });
 *    test('2', () => { expect(sharedData).toBe('x'); });
 *
 * ❌ Don't use wrapper methods:
 *    wrapper.find('button').simulate('click')
 */
