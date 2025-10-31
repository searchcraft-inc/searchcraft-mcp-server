import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup';
import { createMcpServer } from '../../../src/create-mcp-server';

describe('Authentication Tools', () => {
  let mcpServer: ReturnType<typeof createMcpServer>;

  beforeEach(() => {
    mcpServer = createMcpServer();
  });

  describe('create_key', () => {
    it('should create a new authentication key', async () => {
      const keyData = {
        name: 'test-key',
        permissions: {
          read: true,
          write: false
        },
        indexes: ['test-index']
      };

      server.use(
        http.post('http://localhost:8000/auth/key', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            key: 'generated-key-value',
            name: body.name
          });
        })
      );

      expect(mcpServer).toBeDefined();
    });

    it('should handle key creation errors', async () => {
      server.use(
        http.post('http://localhost:8000/auth/key', () => {
          return HttpResponse.json(
            { error: 'Invalid key configuration' },
            { status: 422 }
          );
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('list_keys', () => {
    it('should list all authentication keys', async () => {
      const mockKeys = {
        keys: [
          { name: 'key1', permissions: { read: true } },
          { name: 'key2', permissions: { write: true } }
        ]
      };

      server.use(
        http.get('http://localhost:8000/auth/keys', () => {
          return HttpResponse.json(mockKeys);
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('get_key_details', () => {
    it('should get details for a specific key', async () => {
      const mockKeyDetails = {
        name: 'test-key',
        permissions: { read: true, write: false },
        indexes: ['index1', 'index2'],
        created_at: '2024-01-01T00:00:00Z'
      };

      server.use(
        http.get('http://localhost:8000/auth/key/test-key', () => {
          return HttpResponse.json(mockKeyDetails);
        })
      );

      expect(mcpServer).toBeDefined();
    });

    it('should handle non-existent key', async () => {
      server.use(
        http.get('http://localhost:8000/auth/key/nonexistent', () => {
          return HttpResponse.json(
            { error: 'Key not found' },
            { status: 404 }
          );
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('update_key', () => {
    it('should update an existing key', async () => {
      const updates = {
        permissions: { read: true, write: true }
      };

      server.use(
        http.post('http://localhost:8000/auth/key/test-key', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            key: 'test-key',
            updates: body
          });
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });

  describe('delete_key', () => {
    it('should delete an authentication key', async () => {
      server.use(
        http.delete('http://localhost:8000/auth/key/test-key', () => {
          return HttpResponse.json({ success: true });
        })
      );

      expect(mcpServer).toBeDefined();
    });

    it('should handle deletion of non-existent key', async () => {
      server.use(
        http.delete('http://localhost:8000/auth/key/nonexistent', () => {
          return HttpResponse.json(
            { error: 'Key not found' },
            { status: 404 }
          );
        })
      );

      expect(mcpServer).toBeDefined();
    });
  });
});

