# Test Suite for Searchcraft MCP Server

This directory contains the test suite for the Searchcraft MCP Server, built with Vitest.

## Test Structure

```
test/
├── setup.ts                          # Global test setup and MSW configuration
├── mocks/
│   ├── fixtures.ts                   # Test data fixtures
│   └── searchcraft-api.ts            # MSW handlers for mocking Searchcraft API
├── unit/
│   ├── helpers.test.ts               # Tests for helper functions
│   ├── create-mcp-server.test.ts     # Tests for MCP server creation
│   ├── json-analyzer.test.ts         # Tests for JSON analysis logic
│   └── tools/                        # Tests for tool handlers
│       ├── index-tools.test.ts
│       ├── document-tools.test.ts
│       └── authentication-tools.test.ts
└── integration/
    └── http-server.test.ts           # Tests for Express HTTP endpoints
```

## Running Tests

### Run all tests
```bash
npm test
# or
npm run test:run
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with UI
```bash
npm run test:ui
```

## Test Coverage

Current coverage focuses on:

### High Coverage (>80%)
- ✅ **helpers.ts** (84.61%) - Core utility functions
- ✅ **json-analyzer.ts** (93.82%) - JSON structure analysis
- ✅ **create-mcp-server.ts** (100%) - Server creation

### Integration Tests
- ✅ **HTTP Server** - Express endpoints (/health, /mcp)
- ✅ **API Mocking** - MSW for Searchcraft API calls

### Unit Tests
- ✅ **Configuration** - Environment variable validation
- ✅ **Logging** - Debug logging with levels
- ✅ **Document Preparation** - f64 field conversion
- ✅ **JSON Analysis** - Schema generation from JSON
- ✅ **Array Extraction** - Finding content arrays in nested objects
- ✅ **Document Flattening** - Preparing documents for Searchcraft

## Testing Strategy

### 1. Unit Tests
Test individual functions in isolation:
- Helper functions (config, logging, document preparation)
- JSON analysis and schema generation
- Type detection and field configuration

### 2. Integration Tests
Test components working together:
- HTTP endpoints with mocked Searchcraft API
- Server creation and initialization
- Error handling and edge cases

### 3. Mocking Strategy
- **MSW (Mock Service Worker)** - Mock Searchcraft API calls
- **Environment Variables** - Mock config for tests
- **Global Variables** - Mock `__PACKAGE_VERSION__` for tests

## Writing New Tests

### Example Unit Test
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../src/my-module';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Example with API Mocking
```typescript
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';

describe('API Test', () => {
  it('should handle API response', async () => {
    server.use(
      http.get('http://localhost:8000/endpoint', () => {
        return HttpResponse.json({ data: 'test' });
      })
    );

    // Your test code here
  });
});
```

## Coverage Goals

- **Core Utilities**: 80%+ (helpers, analyzers)
- **Tool Handlers**: 60%+ (business logic)
- **Integration**: 70%+ (HTTP endpoints)

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
- Fast execution (~400ms for 89 tests)
- No external dependencies required
- All API calls mocked with MSW
- Environment variables mocked in setup

## Troubleshooting

### Tests failing with "ReferenceError: __PACKAGE_VERSION__ is not defined"
This global is mocked in `test/setup.ts`. Make sure the setup file is being loaded.

### MSW handlers not working
Check that the MSW server is properly initialized in `test/setup.ts` and handlers are defined in `test/mocks/searchcraft-api.ts`.

### Environment variables not set
Environment variables are mocked in `test/setup.ts`. Add any new required variables there.

## Future Improvements

- [ ] Add E2E tests with real MCP client
- [ ] Add performance benchmarks
- [ ] Add snapshot testing for schema generation
- [ ] Increase tool handler coverage with better MCP SDK mocking
- [ ] Add mutation testing

