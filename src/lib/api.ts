export interface AnalyticsEngineDataset {
    writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface Env {
    MCP_KEYS: string;
    OPENWALLET_API_KEY: string;
    OPENWALLET_API_URL: string;
    ANALYTICS: AnalyticsEngineDataset;
    LANGFUSE_PUBLIC_KEY: string;
    LANGFUSE_SECRET_KEY: string;
    LANGFUSE_BASE_URL: string;
    MCP_CLIENT_LABEL?: string;
    SESSION_ID?: string;
}

const LIVE_API_URL = 'https://api.openwallet.vn';

async function fetchFrom(baseUrl: string, path: string, apiKey: string, options?: RequestInit): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-OpenWallet-Key': apiKey,
            ...(options?.headers ?? {}),
        },
    });
}

export async function apiFetch(env: Env, path: string, options?: RequestInit): Promise<Response> {
    const primaryUrl = env.OPENWALLET_API_URL;
    const useFallback = primaryUrl !== LIVE_API_URL;

    let res: Response;
    try {
        res = await fetchFrom(primaryUrl, path, env.OPENWALLET_API_KEY, options);
    } catch (err) {
        if (!useFallback) throw err;
        res = await fetchFrom(LIVE_API_URL, path, env.OPENWALLET_API_KEY, options);
    }

    // On server error, retry against live API once
    if (!res.ok && useFallback && res.status >= 500) {
        res = await fetchFrom(LIVE_API_URL, path, env.OPENWALLET_API_KEY, options);
    }

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API ${res.status} ${res.statusText}${body ? ': ' + body.slice(0, 200) : ''}`);
    }
    return res;
}

const CARD_FIELDS = [
    'id', 'name', 'bank_id', 'card_network', 'card_tier', 'card_type', 'co_brand',
    'status', 'currency', 'statement_date', 'interest_free_days', 'card_link',
    'is_metal', 'for_business', 'intents', 'contactless_methods',
    'fees', 'cashback', 'description', 'score', 'data_score', '_source',
];

const BANK_FIELDS = [
    'id', 'name', 'full_name', 'link', 'stats', 'networks', '_source',
];

export function stripCard(card: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(CARD_FIELDS.filter(k => k in card).map(k => [k, card[k]]));
}

export function stripBank(bank: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(BANK_FIELDS.filter(k => k in bank).map(k => [k, bank[k]]));
}
