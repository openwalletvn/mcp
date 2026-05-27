import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeIntents } from '../../tools/list-intents.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

afterEach(() => vi.restoreAllMocks());

describe('executeIntents', () => {
    it('returns intents data from API', async () => {
        const intents = [{ slug: 'shopee', label: 'Shopee' }, { slug: 'grab', label: 'Grab' }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: intents }))
        ));
        const result = await executeIntents(mockEnv);
        expect(result).toEqual(intents);
        const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/api/v1/intents');
    });

    it('throws on API failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false }))
        ));
        await expect(executeIntents(mockEnv)).rejects.toThrow('Failed to fetch intents');
    });
});
