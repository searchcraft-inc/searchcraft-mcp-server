import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';

// Mock the __PACKAGE_VERSION__ global that's normally defined by esbuild
vi.stubGlobal('__PACKAGE_VERSION__', '0.2.0-test');

// Setup MSW server for API mocking
export const server = setupServer();

beforeAll(() => {
  // Start MSW server before all tests
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  // Reset handlers after each test
  server.resetHandlers();
});

afterAll(() => {
  // Clean up after all tests
  server.close();
});

// Mock environment variables for tests
process.env.ENDPOINT_URL = 'http://localhost:8000';
process.env.CORE_API_KEY = 'test-api-key';
process.env.DEBUG = 'false';
process.env.LOG_LEVEL = 'ERROR';

