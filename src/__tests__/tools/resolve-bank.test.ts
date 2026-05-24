import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeResolveBank } from '../../tools/resolve-bank.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

afterEach(() => vi.restoreAllMocks());

describe('executeResolveBank', () => {
    it('returns first match from API', async () => {
        const bank = { id: 'vietcombank', name: 'Vietcombank', full_name: 'Ngân hàng Ngoại thương' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [bank] }))
        ));
        const result = await executeResolveBank(mockEnv, 'vcb');
        expect(result).toMatchObject({ id: 'vietcombank' });
        const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/api/v1/banks');
        expect(url).toContain('vcb');
    });

    it('returns null when no match', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [] }))
        ));
        const result = await executeResolveBank(mockEnv, 'xyz-unknown');
        expect(result).toBeNull();
    });
});
