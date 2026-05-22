# OpenWallet MCP Server

[![MCP v0.1.0](https://img.shields.io/endpoint?url=https%3A%2F%2Fmcp.openwallet.vn%2Fbadge&cacheSeconds=60)](https://mcp.openwallet.vn/health)
[![API v1.0.0](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.openwallet.vn%2Fbadge&cacheSeconds=60)](https://api.openwallet.vn/health)

MCP server providing Vietnamese bank card data tools. Hosted at `mcp.openwallet.vn`.

## Authentication

All requests require `X-MCP-Key` header (or `Authorization: Bearer <key>`).

```
X-MCP-Key: your-api-key
```

Contact OpenWallet to get an API key.

## Inspector

To explore and test tools interactively, use the hosted MCP Inspector:

**https://inspector.openwallet.vn**

1. Open the URL
2. Click **Connect**

Transport and server URL are pre-configured. See [`inspector/`](./inspector/README.md) for deployment details.

Read more about [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)

## Tools

### `listBanks`
List all banks issuing cards in Vietnam.

### `resolveBank(query)`
Find a bank by name or alias. Supports: "vcb", "a chau", "ngân hàng ngoại thương", etc.
Returns first match or `null`.

### `listIntents`
List all valid intent slugs for use in `searchCards` and `rankCardsForSpend`.

### `searchCards(q?, bank_id?, type?, network?, intent?, limit?)`
Search cards by filter. Use for browsing cards by bank/type/network/intent.
For "best card for spending X", use `rankCardsForSpend` instead.

### `getCardDetail(card_id)`
Get full details for a single card by ID.

### `resolveCard(query)`
Find a card ID from a name or description. E.g. "thẻ đen techcombank", "shopee vpbank".
Returns `{ id, name, bank_id }` or `null`.

### `rankCardsForSpend(spend, limit?, type?)`
**Primary tool** for card recommendations. Ranks all cards by actual spend profile.
```json
{ "spend": { "ecommerce": 5000000, "dining": 2000000 }, "limit": 3, "type": "credit" }
```
Returns ranked list with estimated monthly cashback.

### `compareCards(card_ids)`
Compare 2–4 cards side-by-side by ID.

## Badge

Embed live MCP status in any site:

**Markdown:**
```md
[![MCP v0.1.0](https://img.shields.io/endpoint?url=https%3A%2F%2Fmcp.openwallet.vn%2Fbadge&cacheSeconds=60)](https://mcp.openwallet.vn/health)
```

**HTML:**
```html
<a href="https://mcp.openwallet.vn/health">
  <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fmcp.openwallet.vn%2Fbadge&cacheSeconds=60" alt="MCP Status">
</a>
```

## Local Development

```bash
# 1. Install
pnpm install

# 2. Set secrets in .dev.vars
cp .dev.vars.example .dev.vars
# Fill in MCP_API_KEY, OPENWALLET_API_KEY
# Set OPENWALLET_API_URL=http://localhost:8787 for local API

# 3. Start API repo (port 8787) in another terminal — `pnpm dev` in api repo

# 4. Run MCP locally
pnpm dev   # → http://localhost:8787
```

## Deployment

```bash
wrangler secret put MCP_API_KEY
wrangler secret put OPENWALLET_API_KEY
pnpm deploy
```

Then add custom domain `mcp.openwallet.vn` in Cloudflare dashboard.
