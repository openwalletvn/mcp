interface Env {
    INSPECTOR_KEY: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
    const path = (params.path as string[] | undefined)?.join('/') ?? '';
    const url = new URL(request.url);
    const target = `https://mcp.openwallet.vn/${path}${url.search}`;

    return fetch(target, {
        method: request.method,
        headers: {
            ...Object.fromEntries(request.headers),
            'x-mcp-key': env.INSPECTOR_KEY,
        },
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    });
};
