import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import {
  getSearchcraftConfig,
  createErrorResponse,
  debugLog,
  prepareDocumentsForSearchcraft,
  performSearchcraftRequest,
  makeSearchcraftRequest
} from '../../src/helpers';

describe('getSearchcraftConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return config when both env vars are set', () => {
    process.env.ENDPOINT_URL = 'http://localhost:8000';
    process.env.CORE_API_KEY = 'test-key-123';

    const result = getSearchcraftConfig();

    expect(result.error).toBeUndefined();
    expect(result.endpointUrl).toBe('http://localhost:8000');
    expect(result.apiKey).toBe('test-key-123');
  });

  it('should return error when ENDPOINT_URL is missing', () => {
    delete process.env.ENDPOINT_URL;
    process.env.CORE_API_KEY = 'test-key';

    const result = getSearchcraftConfig();

    expect(result.error).toBeDefined();
    expect(result.error?.content[0].text).toContain('ENDPOINT_URL');
    expect(result.endpointUrl).toBeUndefined();
    expect(result.apiKey).toBeUndefined();
  });

  it('should return error when CORE_API_KEY is missing', () => {
    process.env.ENDPOINT_URL = 'http://localhost:8000';
    delete process.env.CORE_API_KEY;

    const result = getSearchcraftConfig();

    expect(result.error).toBeDefined();
    expect(result.error?.content[0].text).toContain('CORE_API_KEY');
    expect(result.endpointUrl).toBeUndefined();
    expect(result.apiKey).toBeUndefined();
  });

  it('should return error when both env vars are missing', () => {
    delete process.env.ENDPOINT_URL;
    delete process.env.CORE_API_KEY;

    const result = getSearchcraftConfig();

    expect(result.error).toBeDefined();
    expect(result.endpointUrl).toBeUndefined();
    expect(result.apiKey).toBeUndefined();
  });
});

describe('createErrorResponse', () => {
  it('should create properly formatted error response', () => {
    const message = 'Test error message';
    const result = createErrorResponse(message);

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('❌ Error: Test error message');
  });

  it('should handle empty message', () => {
    const result = createErrorResponse('');

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('❌ Error: ');
  });
});

describe('debugLog', () => {
  const originalEnv = process.env;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env = { ...originalEnv };
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    process.env = originalEnv;
    stderrSpy.mockRestore();
  });

  it('should not log when DEBUG is false', () => {
    process.env.DEBUG = 'false';
    debugLog('test message');

    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('should log when DEBUG is true', () => {
    process.env.DEBUG = 'true';
    process.env.LOG_LEVEL = 'LOG';
    debugLog('test message');

    expect(stderrSpy).toHaveBeenCalled();
    const logOutput = stderrSpy.mock.calls[0][0] as string;
    expect(logOutput).toContain('test message');
    expect(logOutput).toContain('[LOG]');
  });

  it('should respect log level hierarchy - ERROR only', () => {
    process.env.DEBUG = 'true';
    process.env.LOG_LEVEL = 'ERROR';

    debugLog('error message', 'ERROR');
    debugLog('warn message', 'WARN');
    debugLog('info message', 'INFO');
    debugLog('log message', 'LOG');

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect((stderrSpy.mock.calls[0][0] as string)).toContain('error message');
  });

  it('should respect log level hierarchy - WARN and above', () => {
    process.env.DEBUG = 'true';
    process.env.LOG_LEVEL = 'WARN';

    debugLog('error message', 'ERROR');
    debugLog('warn message', 'WARN');
    debugLog('info message', 'INFO');

    expect(stderrSpy).toHaveBeenCalledTimes(2);
  });

  it('should default to LOG level when not specified', () => {
    process.env.DEBUG = 'true';
    delete process.env.LOG_LEVEL;

    debugLog('test message');

    expect(stderrSpy).toHaveBeenCalled();
  });
});

describe('prepareDocumentsForSearchcraft', () => {
  it('should convert integer values to float format for f64 fields', () => {
    const schema = {
      price: { type: 'f64' },
      name: { type: 'text' }
    };
    const documents = [
      { price: 100, name: 'Product 1' },
      { price: 200, name: 'Product 2' }
    ];

    const result = prepareDocumentsForSearchcraft(documents, schema);

    expect(result[0].price).toBeDefined();
    expect(JSON.stringify(result[0].price)).toBe('"100.0"');
    expect(result[0].name).toBe('Product 1');
  });

  it('should handle float values without modification', () => {
    const schema = {
      price: { type: 'f64' }
    };
    const documents = [{ price: 99.99 }];

    const result = prepareDocumentsForSearchcraft(documents, schema);

    expect(result[0].price).toBe(99.99);
  });

  it('should handle arrays of integers in f64 fields', () => {
    const schema = {
      ratings: { type: 'f64' }
    };
    const documents = [{ ratings: [1, 2, 3] }];

    const result = prepareDocumentsForSearchcraft(documents, schema);

    expect(Array.isArray(result[0].ratings)).toBe(true);
    const ratings = result[0].ratings as Array<any>;
    expect(JSON.stringify(ratings[0])).toBe('"1.0"');
    expect(JSON.stringify(ratings[1])).toBe('"2.0"');
  });

  it('should return documents unchanged when no f64 fields', () => {
    const schema = {
      name: { type: 'text' },
      id: { type: 'u64' }
    };
    const documents = [{ name: 'Test', id: 1 }];

    const result = prepareDocumentsForSearchcraft(documents, schema);

    expect(result).toEqual(documents);
  });

  it('should handle empty documents array', () => {
    const schema = { price: { type: 'f64' } };
    const documents: Record<string, unknown>[] = [];

    const result = prepareDocumentsForSearchcraft(documents, schema);

    expect(result).toEqual([]);
  });

  it('should handle documents without f64 field values', () => {
    const schema = { price: { type: 'f64' } };
    const documents = [{ name: 'Product' }];

    const result = prepareDocumentsForSearchcraft(documents, schema);

    expect(result[0]).toEqual({ name: 'Product' });
  });
});

describe('performSearchcraftRequest', () => {
  it('should successfully perform search request', async () => {
    const mockResponse = {
      hits: [{ id: '1', score: 1.0 }],
      total: 1
    };

    server.use(
      http.post('http://localhost:8000/search', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const result = await performSearchcraftRequest(
      'http://localhost:8000/search',
      { query: 'test' },
      'test-key'
    );

    expect(result).toEqual(mockResponse);
  });

  it('should throw error on failed request', async () => {
    server.use(
      http.post('http://localhost:8000/search', () => {
        return HttpResponse.json(
          { error: 'Bad request' },
          { status: 400 }
        );
      })
    );

    await expect(
      performSearchcraftRequest(
        'http://localhost:8000/search',
        { query: 'test' },
        'test-key'
      )
    ).rejects.toThrow('Searchcraft API error: 400');
  });
});

describe('makeSearchcraftRequest', () => {
  it('should successfully make GET request', async () => {
    const mockData = { name: 'test-index' };

    server.use(
      http.get('http://localhost:8000/index/test', () => {
        return HttpResponse.json(mockData);
      })
    );

    const result = await makeSearchcraftRequest(
      'http://localhost:8000/index/test',
      'GET',
      'test-key'
    );

    expect(result).toEqual(mockData);
  });

  it('should successfully make POST request with body', async () => {
    server.use(
      http.post('http://localhost:8000/index', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ success: true, data: body });
      })
    );

    const result = await makeSearchcraftRequest(
      'http://localhost:8000/index',
      'POST',
      'test-key',
      { name: 'new-index' }
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'new-index' });
  });

  it('should handle empty response body', async () => {
    server.use(
      http.delete('http://localhost:8000/index/test', () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const result = await makeSearchcraftRequest(
      'http://localhost:8000/index/test',
      'DELETE',
      'test-key'
    );

    expect(result).toBeNull();
  });

  it('should throw error with status code and message', async () => {
    server.use(
      http.post('http://localhost:8000/index', () => {
        return HttpResponse.json(
          { error: 'Validation failed' },
          { status: 422 }
        );
      })
    );

    await expect(
      makeSearchcraftRequest(
        'http://localhost:8000/index',
        'POST',
        'test-key',
        { invalid: 'data' }
      )
    ).rejects.toThrow('HTTP 422');
  });
});

