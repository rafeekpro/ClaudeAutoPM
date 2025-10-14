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

// Create the mock WIT API
const mockWorkItemTrackingApi = {
  getProject: jest.fn(),
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

// Set default resolved value for getProject
mockWorkItemTrackingApi.getProject.mockResolvedValue(defaultProject);

const mockWebApi = jest.fn().mockImplementation(() => ({
  getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWorkItemTrackingApi)
}));

const mockPersonalAccessTokenHandler = jest.fn().mockImplementation((token) => ({
  token,
  prepareRequest: jest.fn(),
  canHandleAuthentication: jest.fn().mockReturnValue(true)
}));

// Export a reset function to restore default mocks
const resetMocks = () => {
  mockWorkItemTrackingApi.getProject.mockResolvedValue(defaultProject);
};

module.exports = {
  WebApi: mockWebApi,
  getPersonalAccessTokenHandler: mockPersonalAccessTokenHandler,
  // Export the mock API for direct access in tests
  __mockWorkItemTrackingApi: mockWorkItemTrackingApi,
  __resetMocks: resetMocks
};
