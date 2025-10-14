/**
 * Manual mock for @octokit/rest
 *
 * This mock allows us to test GitHubProvider without making real API calls
 */

const mockOctokit = jest.fn().mockImplementation((options) => ({
  auth: options.auth,
  baseUrl: options.baseUrl,
  timeout: options.timeout,
  rest: {
    issues: {
      get: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addLabels: jest.fn(),
      createComment: jest.fn(),
      listComments: jest.fn()
    },
    search: {
      issuesAndPullRequests: jest.fn()
    },
    rateLimit: {
      get: jest.fn().mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      })
    }
  },
  users: {
    getAuthenticated: jest.fn().mockResolvedValue({
      data: { login: 'testuser' }
    })
  }
}));

module.exports = {
  Octokit: mockOctokit
};
