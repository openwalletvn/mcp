import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeCompare } from '../../tools/compare-cards.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

afterEach(() => vi.restoreAllMocks());

describe('executeCompare', () => {
    it('POSTs to /cards/compare with card_ids', async () => {
        const mockData = [
            { id: 'techcombank-spark', name: 'Spark' },
            { id: 'vpbank-flex', name: 'Flex' },
        ];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: mockData }))
        ));

        const result = await executeCompare(mockEnv, { card_ids: ['techcombank-spark', 'vpbank-flex'] });
        const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/api/v1/cards/compare');
        expect(init.method).toBe('POST');
        const body = JSON.parse(init.body as string);
        expect(body.card_ids).toEqual(['techcombank-spark', 'vpbank-flex']);
        expect(result).toEqual(mockData);
        expect((fetch as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    });

    it('throws on API failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false, error: 'Cards not found: bad-id' }))
        ));
        await expect(
            executeCompare(mockEnv, { card_ids: ['bad-id', 'also-bad'] })
        ).rejects.toThrow('Cards not found');
    });
});
