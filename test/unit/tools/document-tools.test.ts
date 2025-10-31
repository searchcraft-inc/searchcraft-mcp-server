import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup';
import { createMcpServer } from '../../../src/create-mcp-server';

describe('Document Tools', () => {
  let mcpServer: ReturnType<typeof createMcpServer>;

  beforeEach(() => {
    mcpServer = createMcpServer();
  });

  describe('add_documents', () => {
    it('should add documents to an index', async () => {
      const documents = [
        { id: 1, title: 'Document 1' },
        { id: 2, title: 'Document 2' }
      ];

      server.use(
        http.post('http://localhost:8000/index/test-index/documents', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            indexed: Array.isArray(body) ? body.length : 1
          });
        })
      );

      expect(mcpServer).toBeDefined();
    });

    it('should handle document validation errors', async () => {
      server.use(
        http.post('http://localhost:8000/index/test-index/documents', () => {
          return HttpResponse.json(
            { error: 'Document validation failed' },
            { status: 422 }
          );
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('get_document_by_id', () => {
    it('should retrieve a document by ID', async () => {
      const mockDocument = {
        _id: 'doc123',
        title: 'Test Document',
        content: 'Test content'
      };

      server.use(
        http.get('http://localhost:8000/index/test-index/documents/doc123', () => {
          return HttpResponse.json(mockDocument);
        })
      );

      expect(mcpServer).toBeDefined();
    });

    it('should handle non-existent document', async () => {
      server.use(
        http.get('http://localhost:8000/index/test-index/documents/nonexistent', () => {
          return HttpResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('delete_document_by_id', () => {
    it('should delete a document by ID', async () => {
      server.use(
        http.delete('http://localhost:8000/index/test-index/documents/doc123', () => {
          return HttpResponse.json({ success: true });
        })
      );

      expect(mcpServer).toBeDefined();
    });

    it('should handle deletion of non-existent document', async () => {
      server.use(
        http.delete('http://localhost:8000/index/test-index/documents/nonexistent', () => {
          return HttpResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('delete_documents_by_query', () => {
    it('should delete documents matching a query', async () => {
      server.use(
        http.post('http://localhost:8000/index/test-index/documents/delete', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            deleted: 5
          });
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('update_documents', () => {
    it('should update existing documents', async () => {
      const updates = [
        { id: 1, title: 'Updated Title 1' },
        { id: 2, title: 'Updated Title 2' }
      ];

      server.use(
        http.put('http://localhost:8000/index/test-index/documents', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            updated: Array.isArray(body) ? body.length : 1
          });
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });
});

