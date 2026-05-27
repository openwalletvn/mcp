import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeFindCard } from '../../tools/find-card.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

afterEach(() => vi.restoreAllMocks());

describe('executeFindCard', () => {
    it('returns exact match when one card found', async () => {
        const card = { id: 'techcombank-spark', name: 'Techcombank Spark', bank_id: 'techcombank' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [card], meta: { filtered: 1 } }))
        ));
        const result = await executeFindCard(mockEnv, 'techcombank spark');
        expect(result).toMatchObject({ id: 'techcombank-spark', confidence: 'exact' });
        const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/api/v1/cards');
        expect(url).toContain('techcombank');
    });

    it('returns null when no match', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [], meta: { filtered: 0 } }))
        ));
        const result = await executeFindCard(mockEnv, 'xyz-unknown-card');
        expect(result).toBeNull();
    });

    it('returns ambiguous when multiple cards match', async () => {
        const cards = [
            { id: 'vpbank-shopee', name: 'VPBank Shopee', bank_id: 'vpbank' },
            { id: 'vpbank-shopee-plus', name: 'VPBank Shopee Plus', bank_id: 'vpbank' },
        ];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: cards, meta: { filtered: 2 } }))
        ));
        const result = await executeFindCard(mockEnv, 'vpbank shopee') as { confidence: string; matches: unknown[] };
        expect(result.confidence).toBe('ambiguous');
        expect(result.matches).toHaveLength(2);
    });

    it('caps ambiguous matches at 5', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => ({ id: `card-${i}`, name: `Card ${i}`, bank_id: 'test' }));
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: cards, meta: { filtered: 10 } }))
        ));
        const result = await executeFindCard(mockEnv, 'card') as { confidence: string; matches: unknown[] };
        expect(result.confidence).toBe('ambiguous');
        expect(result.matches).toHaveLength(5);
    });
});
