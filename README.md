# DeFi Llama MCP Server

> An MCP server for [DeFi Llama](https://defillama.com) — connect any MCP-compatible client to free DeFi protocol data.

[![npm version](https://img.shields.io/npm/v/@supernova123/defillama-mcp-server)](https://www.npmjs.com/package/@supernova123/defillama-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@supernova123/defillama-mcp-server)](https://www.npmjs.com/package/@supernova123/defillama-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Claude Desktop](https://img.shields.io/badge/Claude%20Desktop-ready-orange)](https://claude.ai/download)
[![Cursor](https://img.shields.io/badge/Cursor-compatible-blue)](https://cursor.sh)

## What is this?

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that gives AI assistants and agents access to DeFi Llama's free DeFi data API — protocol TVL, chain TVL, yield pools, stablecoins, cross-chain bridges, DEX volumes, and protocol fees — through natural language.

Use it with **Claude Desktop**, **Cursor**, **Windsurf**, **Cline**, **Continue**, or any MCP-compatible client to ask questions about DeFi protocols, track TVL movements, compare yields, and explore the on-chain economy.

## Why use this?

- **No API key required** — DeFi Llama is a free public API
- **8 built-in tools** — covers the most common DeFi data queries
- **Clean markdown output** — results read naturally in chat
- **Rate-limited automatically** — polite 500ms throttle across all endpoints

## Tools

| Tool | Description |
|------|-------------|
| `search_protocols` | Search DeFi protocols by name — returns top results with TVL, chains, category |
| `get_protocol_tvl` | Get detailed TVL breakdown for a specific protocol (chain distribution, history, description) |
| `get_tvl_by_chain` | Get total TVL for a specific chain (Ethereum, Arbitrum, Base, Solana, etc.) |
| `get_yields` | Get yield/APY data for lending pools and staking, filter by chain / project / min TVL |
| `get_stablecoins` | Get stablecoin market cap data and rankings |
| `get_bridges` | Get cross-chain bridge TVL and volume data |
| `get_dex_volumes` | Get DEX trading volumes across chains |
| `get_protocol_fees` | Get protocol fee and revenue data |

## Quick Start

### 1. Add to your MCP client

Add this to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "defillama": {
      "command": "npx",
      "args": ["-y", "defillama-mcp-server"]
    }
  }
}
```

That's it. npx downloads and runs it automatically. No API key, no install step.

### 2. Use it

Ask your AI assistant things like:

- "What are the top DeFi protocols by TVL on Ethereum?"
- "Search for Aave and show me the chain breakdown"
- "What's the total TVL on Arbitrum?"
- "Show me the highest yield stablecoin pools on Base with at least $10M TVL"
- "List the top 5 stablecoins by market cap"
- "Which bridges have the most TVL?"
- "Show me DEX trading volumes for the last 24h"
- "What are the protocols with the most fees?"

## Example Output

### `search_protocols`

```
Top 5 protocols matching "aave" (by TVL):

- **Aave** (AAVE) — TVL: $12.45B | Category: Lending | Chains: Ethereum, Arbitrum, Polygon, Base, Optimism, +6 | Slug: `aave`
- **Aave v2** (AAVE) — TVL: $4.20B | Category: Lending | Chains: Ethereum, Polygon, Avalanche | Slug: `aave-v2`
- **Aave v3** (AAVE) — TVL: $8.10B | Category: Lending | Chains: Ethereum, Arbitrum, Polygon, Base, Optimism | Slug: `aave-v3`
```

### `get_yields`

```
Top 5 yield pools (chain: Ethereum | min TVL: $10.00M | min APY: 0%):

- **Lido** — stETH on Ethereum 🟢 | APY: 3.42% (3.42% base) | TVL: $23.45B
- **Aave v3** — USDC on Ethereum 🟢 | APY: 4.85% (1.50% base + 3.35% reward) | TVL: $1.85B
- **Compound v3** — USDC on Ethereum 🟢 | APY: 5.12% (3.20% base + 1.92% reward) | TVL: $890.45M
```

### `get_tvl_by_chain`

```
Ethereum — Chain TVL

- **Total TVL:** $115.32B
- **Native Token:** ETH
- **CoinGecko ID:** ethereum

### Top Tokens by TVL
- **ETH** (Ether): $67.23B
- **USDC** (USD Coin): $4.12B
- **USDT** (Tether): $3.45B
- **WBTC** (Wrapped BTC): $2.89B
- **WSTETH** (Wrapped stETH): $2.34B
```

## Use Cases

### DeFi Research
"Search for Aave and show me the chain breakdown" — find protocols, compare TVL across chains, and understand where value is concentrated. Works with any protocol in DeFi Llama's database of 3,000+ projects.

### Yield Optimization
"Show me the highest yield stablecoin pools on Base with at least $10M TVL" — filter yield opportunities by chain, project, minimum TVL, and asset type. Find safe yields without hunting through dashboards.

### Chain Analysis
"What's the total TVL on Arbitrum?" — get chain-level stats including top tokens by TVL. Useful for understanding where liquidity is flowing and which chains are growing.

### Stablecoin Intelligence
"List the top 5 stablecoins by market cap" — track stablecoin market caps, circulating supply, and price deviations. Essential for understanding DeFi's dollar-denominated liquidity.

### Cross-Chain Monitoring
"Which bridges have the most TVL?" — monitor cross-chain bridge activity and volume. Track which bridges are gaining or losing share.

### Protocol Revenue Tracking
"What are the protocols with the most fees?" — analyze protocol fee generation and revenue. Useful for fundamental analysis and comparing protocol economics.

## Security

- **No API key required** — uses DeFi Llama's free public API. No authentication needed.
- **Read-only** — only fetches public DeFi data from DeFi Llama's API. No writes, no mutations.
- **No local file access** — does not read or write any files on your machine.
- **No shell access** — does not execute commands or spawn processes.
- **Rate-limited** — automatically caps requests to be a polite API citizen.
- **Open source** — MIT licensed. Inspect the code at [GitHub](https://github.com/friendlygeorge/defillama-mcp-server).

## Troubleshooting

### "Protocol not found" errors
Use `search_protocols` first to find the correct DeFi Llama slug. Protocol slugs are lowercase with hyphens (e.g. `aave-v3`, `lido`), not ticker symbols.

### Slow responses
DeFi Llama's `/protocols` and `/pools` endpoints return multi-MB responses. The server throttles to ~2 calls/second. For large queries, results may take 1-2 seconds.

### Server won't start
Make sure Node.js 18+ is installed: `node --version`. If using npx, ensure npm is up to date: `npm install -g npm@latest`.

### MCP client can't connect
Verify the config path is correct. Claude Desktop uses `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS and `%APPDATA%\Claude\claude_desktop_config.json` on Windows. Restart the client after config changes.

## Requirements

- Node.js 18+
- No API key needed (DeFi Llama is a free public API)

## Rate Limits

DeFi Llama doesn't publish hard rate limits, but the server automatically throttles requests to ~2 calls/second (500ms minimum interval) to be a polite citizen. The `/protocols` and `/pools` endpoints are large (multi-MB), so the throttle also helps avoid unnecessary load.

## Data Sources

- **Protocols & TVL:** `https://api.llama.fi`
- **Yields:** `https://yields.llama.fi`
- **Stablecoins:** `https://stablecoins.llama.fi`

All endpoints are free and require no authentication. Full API documentation: https://defillama.com/docs/api

## Development

```bash
git clone https://github.com/nova/defillama-mcp-server.git
cd defillama-mcp-server
npm install
npm run build
npm start
```

## License

MIT
