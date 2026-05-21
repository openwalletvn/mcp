import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeListBanks } from '../../tools/list-banks.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' };

const MOCK_BANKS = [
    { id: 'vietcombank', name: 'Vietcombank', full_name: 'Ngân hàng Ngoại thương', link: 'https://vcb.vn', networks: ['visa'] },
    { id: 'acb', name: 'ACB', full_name: 'Ngân hàng Á Châu', link: 'https://acb.com.vn', networks: ['visa', 'mastercard'] },
];

afterEach(() => vi.restoreAllMocks());

describe('executeListBanks', () => {
    it('calls /api/v1/banks and returns id/name/full_name/link/networks only', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: MOCK_BANKS }))
        ));
        const result = await executeListBanks(mockEnv);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ id: 'vietcombank', name: 'Vietcombank' });
        expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('/api/v1/banks');
    });

    it('throws on API failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false }))
        ));
        await expect(executeListBanks(mockEnv)).rejects.toThrow();
    });
});
