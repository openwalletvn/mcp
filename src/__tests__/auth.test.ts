import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../index.ts';

const mockEnv = {
    MCP_API_KEY: 'test-key',
    OPENWALLET_API_KEY: 'api-key',
    OPENWALLET_API_URL: 'http://api.test',
};

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
});

describe('auth middleware', () => {
    it('rejects request with no key → 401', async () => {
        const req = new Request('http://localhost/', { method: 'GET' });
        const res = await handler.fetch(req, mockEnv);
        expect(res.status).toBe(401);
        const body = await res.json() as { error: string };
        expect(body.error).toBe('Unauthorized');
    });

    it('rejects request with wrong key → 401', async () => {
        const req = new Request('http://localhost/', {
            method: 'GET',
            headers: { 'X-MCP-Key': 'wrong-key' },
        });
        const res = await handler.fetch(req, mockEnv);
        expect(res.status).toBe(401);
    });

    it('accepts Bearer token in Authorization header', async () => {
        const req = new Request('http://localhost/', {
            method: 'GET',
            headers: { Authorization: 'Bearer test-key' },
        });
        const res = await handler.fetch(req, mockEnv);
        expect(res.status).not.toBe(401);
    });

    it('health check returns tool count with correct key', async () => {
        const req = new Request('http://localhost/', {
            method: 'GET',
            headers: { 'X-MCP-Key': 'test-key' },
        });
        const res = await handler.fetch(req, mockEnv);
        expect(res.status).toBe(200);
        const body = await res.json() as { tools: number };
        expect(body.tools).toBe(8);
    });
});
