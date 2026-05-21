export interface Env {
    MCP_API_KEY: string;
    OPENWALLET_API_KEY: string;
    OPENWALLET_API_URL: string;
}

export async function apiFetch(env: Env, path: string, options?: RequestInit): Promise<Response> {
    const url = `${env.OPENWALLET_API_URL}${path}`;
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-OpenWallet-Key': env.OPENWALLET_API_KEY,
            ...(options?.headers ?? {}),
        },
    });
}

export function stripCard(card: Record<string, unknown>): Record<string, unknown> {
    const { image: _i, sources: _s, card_network_data: _nd, contactless_methods_data: _cmd, co_brand_data: _cbd, bank_data: _bd, ...rest } = card;
    return rest;
}
