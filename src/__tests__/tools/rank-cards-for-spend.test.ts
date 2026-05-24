import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeRankCardsForSpend } from '../../tools/rank-cards-for-spend.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

afterEach(() => vi.restoreAllMocks());

describe('executeRankCardsForSpend', () => {
    it('POSTs to /api/v1/cards/rank with spend body', async () => {
        const mockData = [{ rank: 1, card: { id: 'hsbc-cashback' }, estimated_monthly_cashback: 250000 }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: mockData }))
        ));

        const result = await executeRankCardsForSpend(mockEnv, { spend: { ecommerce: 5_000_000 }, limit: 3 });

        const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/api/v1/cards/rank');
        expect(init.method).toBe('POST');
        const body = JSON.parse(init.body as string);
        expect(body.spend).toEqual({ ecommerce: 5_000_000 });
        expect(result).toEqual(mockData);
    });

    it('throws on API failure with error message', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false, error: 'spend required' }))
        ));
        await expect(
            executeRankCardsForSpend(mockEnv, { spend: {}, limit: 3 })
        ).rejects.toThrow('spend required');
    });
});
