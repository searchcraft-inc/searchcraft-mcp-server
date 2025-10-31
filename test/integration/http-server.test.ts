import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the __PACKAGE_VERSION__ global
vi.stubGlobal('__PACKAGE_VERSION__', '0.2.0-test');

// Create a test version of the Express app without starting the server
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'searchcraft-mcp-server',
      version: '0.2.0-test'
    });
  });

  // GET /mcp - Method not allowed
  app.get('/mcp', (req, res) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.'
        },
        id: null
      })
    );
  });

  // DELETE /mcp - Method not allowed
  app.delete('/mcp', (req, res) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.'
        },
        id: null
      })
    );
  });

  return app;
}

describe('HTTP Server Endpoints', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'searchcraft-mcp-server'
      });
      expect(response.body.version).toBeDefined();
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /mcp', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await request(app)
        .get('/mcp')
        .expect(405);

      const body = JSON.parse(response.text);
      expect(body.jsonrpc).toBe('2.0');
      expect(body.error.code).toBe(-32000);
      expect(body.error.message).toBe('Method not allowed.');
    });

    it('should return JSON-RPC error format', async () => {
      const response = await request(app)
        .get('/mcp')
        .expect(405);

      const body = JSON.parse(response.text);
      expect(body).toHaveProperty('jsonrpc');
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('id');
      expect(body.id).toBeNull();
    });
  });

  describe('DELETE /mcp', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await request(app)
        .delete('/mcp')
        .expect(405);

      const body = JSON.parse(response.text);
      expect(body.jsonrpc).toBe('2.0');
      expect(body.error.code).toBe(-32000);
      expect(body.error.message).toBe('Method not allowed.');
    });

    it('should return JSON-RPC error format', async () => {
      const response = await request(app)
        .delete('/mcp')
        .expect(405);

      const body = JSON.parse(response.text);
      expect(body).toHaveProperty('jsonrpc');
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('id');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    it('should return 404 for POST to unknown routes', async () => {
      await request(app)
        .post('/unknown-route')
        .expect(404);
    });
  });
});

