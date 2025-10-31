import { http, HttpResponse } from 'msw';
import { mockSearchResponse, mockIndexConfig, mockDocuments } from './fixtures';

const BASE_URL = 'http://localhost:8000';

// Mock handlers for Searchcraft API endpoints
export const handlers = [
  // Health/Status endpoint
  http.get(`${BASE_URL}/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Index operations
  http.post(`${BASE_URL}/index`, () => {
    return HttpResponse.json({ success: true, index: mockIndexConfig });
  }),

  http.get(`${BASE_URL}/index/:indexName`, () => {
    return HttpResponse.json(mockIndexConfig);
  }),

  http.delete(`${BASE_URL}/index/:indexName`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${BASE_URL}/indexes`, () => {
    return HttpResponse.json({ indexes: [mockIndexConfig] });
  }),

  // Document operations
  http.post(`${BASE_URL}/index/:indexName/documents`, () => {
    return HttpResponse.json({ success: true, indexed: 2 });
  }),

  http.delete(`${BASE_URL}/index/:indexName/documents/:docId`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Search operations
  http.post(`${BASE_URL}/index/:indexName/search`, () => {
    return HttpResponse.json(mockSearchResponse);
  }),

  // Key operations
  http.post(`${BASE_URL}/auth/key`, () => {
    return HttpResponse.json({ 
      success: true, 
      key: 'test-key-value',
      name: 'test-key'
    });
  }),

  http.get(`${BASE_URL}/auth/keys`, () => {
    return HttpResponse.json({ 
      keys: [{ name: 'test-key', permissions: { read: true } }] 
    });
  }),

  http.delete(`${BASE_URL}/auth/key/:keyName`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Federation operations
  http.post(`${BASE_URL}/federation`, () => {
    return HttpResponse.json({ success: true, federation: 'test-federation' });
  }),

  http.get(`${BASE_URL}/federations`, () => {
    return HttpResponse.json({ federations: ['test-federation'] });
  }),

  // Analytics/Measures
  http.get(`${BASE_URL}/measures`, () => {
    return HttpResponse.json({ 
      measures: {
        total_documents: 100,
        total_indexes: 5
      }
    });
  })
];

// Error response handlers for testing error cases
export const errorHandlers = {
  unauthorized: http.post(`${BASE_URL}/*`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  notFound: http.get(`${BASE_URL}/index/:indexName`, () => {
    return HttpResponse.json(
      { error: 'Index not found' },
      { status: 404 }
    );
  }),

  serverError: http.post(`${BASE_URL}/*`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  })
};

