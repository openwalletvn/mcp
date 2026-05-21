# MCP Inspector

Hosted MCP Inspector UI for testing OpenWallet MCP tools.

**Live:** https://inspector.openwallet.vn

Built from `@modelcontextprotocol/inspector` static client, deployed to Cloudflare Pages. Pre-configured to connect to `mcp.openwallet.vn` via Streamable HTTP transport.

## Connect

1. Open https://inspector.openwallet.vn
2. Go to **Configuration** tab
3. Add header — `x-mcp-key`: `<your-api-key>`
4. Click **Connect**

Transport and server URL are pre-configured. No manual setup needed.

## Deploy

CF Pages auto-deploys on push to `main` when files in `inspector/**` change.

Manual deploy:

```bash
cd inspector
npm install && npm run build
wrangler pages deploy public --project-name=openwallet-inspector
```

## How it works

`build.mjs` copies the pre-built inspector client from `node_modules` into `public/`, then injects a `<script>` into `index.html` that pre-sets localStorage defaults (server URL, transport type, connection mode) on first visit.
