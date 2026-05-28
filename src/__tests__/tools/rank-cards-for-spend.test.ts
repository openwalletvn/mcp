import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeRank } from '../../tools/rank-cards-for-spend.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

afterEach(() => vi.restoreAllMocks());

describe('executeRank', () => {
    it('POSTs to /api/v1/cards/rank with intents body', async () => {
        const mockData = [{ rank: 1, card: { id: 'hsbc-cashback' }, cashback_result: { cashback: 250000 } }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: mockData, meta: { total: 1 } }))
        ));

        const result = await executeRank(mockEnv, { intents: ['ecommerce'], monthly_spend: 5_000_000, limit: 3 });

        const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/api/v1/cards/rank');
        expect(init.method).toBe('POST');
        const body = JSON.parse(init.body as string);
        expect(body.intents).toEqual(['ecommerce']);
        expect(body.monthly_spend).toBe(5_000_000);
        expect(result.data).toEqual(mockData);
    });

    it('supports persona shortcut', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [], meta: {} }))
        ));
        await executeRank(mockEnv, { persona: 'shopee', limit: 5 });
        const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
        expect(body.persona).toBe('shopee');
    });

    it('throws on API failure with error message', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false, error: 'intents required' }))
        ));
        await expect(
            executeRank(mockEnv, { limit: 3 })
        ).rejects.toThrow('intents required');
    });
});
