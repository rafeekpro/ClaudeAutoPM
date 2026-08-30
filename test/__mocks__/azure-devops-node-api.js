/**
 * Manual mock for azure-devops-node-api
 *
 * This mock allows us to test AzureDevOpsProvider without making real API calls
 * to Azure DevOps Services
 */

// Default mock data
const defaultProject = {
  id: 'test-project-id',
  name: 'test-project',
  description: 'Test Project'
};

// Create the mock WIT API.
// NOTE: only methods that genuinely exist on WorkItemTrackingApi belong here.
// getProject lives on CoreApi — mocking it here previously made a broken
// authenticate() look correct in every test. See test/unit/azure-api-surface.test.js.
const mockWorkItemTrackingApi = {
  getWorkItem: jest.fn(),
  getWorkItems: jest.fn(),
  createWorkItem: jest.fn(),
  updateWorkItem: jest.fn(),
  deleteWorkItem: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
  queryByWiql: jest.fn()
};

// Create the mock Core API (project lookup lives here).
const mockCoreApi = {
  getProject: jest.fn(),
  getProjects: jest.fn()
};

mockCoreApi.getProject.mockResolvedValue(defaultProject);

const mockWebApi = jest.fn().mockImplementation(() => ({
  getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWorkItemTrackingApi),
  getCoreApi: jest.fn().mockResolvedValue(mockCoreApi)
}));

const mockPersonalAccessTokenHandler = jest.fn().mockImplementation((token) => ({
  token,
  prepareRequest: jest.fn(),
  canHandleAuthentication: jest.fn().mockReturnValue(true)
}));

// Export a reset function to restore default mocks
const resetMocks = () => {
  mockCoreApi.getProject.mockResolvedValue(defaultProject);
};

module.exports = {
  WebApi: mockWebApi,
  getPersonalAccessTokenHandler: mockPersonalAccessTokenHandler,
  // Export the mock API for direct access in tests
  __mockWorkItemTrackingApi: mockWorkItemTrackingApi,
  __mockCoreApi: mockCoreApi,
  __resetMocks: resetMocks
};
