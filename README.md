# DeFi Llama MCP Server

> An MCP server for [DeFi Llama](https://defillama.com) — connect any MCP-compatible client to free DeFi protocol data.

[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

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

### 1. Install

```bash
npm install -g defillama-mcp-server
```

Or run directly with npx:

```bash
npx -y defillama-mcp-server
```

### 2. Configure your MCP client

Add to your MCP client config (e.g. `claude_desktop_config.json`):

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

Or with global install:

```json
{
  "mcpServers": {
    "defillama": {
      "command": "defillama-mcp-server"
    }
  }
}
```

### 3. Use it

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
