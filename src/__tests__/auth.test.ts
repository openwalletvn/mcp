import { describe, it, expect } from 'vitest';

const MCP_API_KEY = 'test-key';

function checkAuth(request: Request): boolean {
    const host = new URL(request.url).hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    if (isLocalhost) return true;
    const key = request.headers.get('x-mcp-key') ?? request.headers.get('authorization')?.replace('Bearer ', '');
    return key === MCP_API_KEY;
}

describe('auth logic', () => {
    it('localhost bypasses auth', () => {
        const req = new Request('http://localhost/');
        expect(checkAuth(req)).toBe(true);
    });

    it('non-localhost with no key → rejected', () => {
        const req = new Request('http://mcp.openwallet.vn/');
        expect(checkAuth(req)).toBe(false);
    });

    it('non-localhost with wrong key → rejected', () => {
        const req = new Request('http://mcp.openwallet.vn/', {
            headers: { 'x-mcp-key': 'wrong' },
        });
        expect(checkAuth(req)).toBe(false);
    });

    it('non-localhost with correct x-mcp-key → accepted', () => {
        const req = new Request('http://mcp.openwallet.vn/', {
            headers: { 'x-mcp-key': MCP_API_KEY },
        });
        expect(checkAuth(req)).toBe(true);
    });

    it('non-localhost with Bearer token → accepted', () => {
        const req = new Request('http://mcp.openwallet.vn/', {
            headers: { Authorization: `Bearer ${MCP_API_KEY}` },
        });
        expect(checkAuth(req)).toBe(true);
    });
});
