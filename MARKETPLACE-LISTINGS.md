# Marketplace Listings — DeFi Llama MCP Server

## Listing 1: mcp.so

**Title:** DeFi Llama MCP Server

**Category:** Finance & Crypto → DeFi

**Description:**
MCP server for DeFi Llama — the free DeFi data API powering https://defillama.com. Query protocol TVL, chain TVL, yield pools, stablecoins, bridges, DEX volumes, and protocol fees through natural language. Works with Claude Desktop, Cursor, Windsurf, and any MCP-compatible client.

Features:
- Search DeFi protocols by name with TVL, category, and chain info
- Get detailed TVL breakdown for a specific protocol (chain distribution, history, description)
- Get total TVL for any chain (Ethereum, Arbitrum, Base, Solana, etc.)
- Filter yield pools by chain, project, min TVL, and min APY
- Get stablecoin market caps and rankings
- Get cross-chain bridge TVL and volume data
- Get DEX trading volumes across chains
- Get protocol fee and revenue data
- No API key required (DeFi Llama is fully free)
- Automatic rate limiting, clean markdown output

**Tags:** defillama, defi, tvl, yields, stablecoins, bridges, dex, fees, mcp, finance, ethereum, bitcoin, lido, aave, uniswap

**Installation:**
```bash
npx -y defillama-mcp-server
```

---

## Listing 2: Smithery (smithery.ai)

**Title:** DeFi Llama

**Description:**
Connect AI assistants to DeFi Llama's free DeFi data API. Query protocol TVL, chain TVL, yield/APY pools, stablecoin market caps, cross-chain bridges, DEX volumes, and protocol fees through the Model Context Protocol. No API key required.

**Tools:** 8 (search_protocols, get_protocol_tvl, get_tvl_by_chain, get_yields, get_stablecoins, get_bridges, get_dex_volumes, get_protocol_fees)

**Transport:** stdio

**Config:**
```json
{
  "command": "npx",
  "args": ["-y", "defillama-mcp-server"]
}
```

---

## Listing 3: Glama MCP

**Title:** DeFi Llama MCP Server

**Description:**
Access DeFi Llama's free DeFi data through MCP. Search protocols, get TVL breakdowns for protocols and chains, filter yield pools, view stablecoin rankings, explore cross-chain bridge TVL, compare DEX volumes, and track protocol fees. Works with Claude Desktop, Cursor, and other MCP clients. No API key needed.

**Category:** Finance

**Tools:** 8

**Tags:** defi, defillama, tvl, yields, stablecoins, bridges, dex, fees, ethereum

---

## Listing 4: There's An AI For That (TAAIFT)

**Title:** DeFi Llama MCP Server

**Category:** Developer Tools → AI Development → MCP Servers

**Description:**
MCP server that connects AI assistants to DeFi Llama's free DeFi data API. Ask your AI about protocol TVL, chain TVL, yield pools, stablecoins, bridges, DEX volumes, and protocol fees — no API key required. 8 tools covering the most common DeFi queries.

**Price:** Free (open source, MIT)

---

## Listing 5: Awesome MCP Servers (GitHub)

**PR Description:**
Add DeFi Llama MCP Server — free DeFi data for AI assistants. 8 tools: search protocols, get protocol/chain TVL, filter yield pools, stablecoin rankings, bridge TVL, DEX volumes, protocol fees. No API key required. TypeScript, MIT license, no dependencies beyond MCP SDK + zod.
