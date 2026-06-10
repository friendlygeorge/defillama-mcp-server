#!/usr/bin/env node
/**
 * DeFi Llama MCP Server
 *
 * Connect AI assistants to DeFi Llama's free DeFi data API.
 * Query protocol TVL, chain TVL, yields, stablecoins, bridges,
 * DEX volumes, and protocol fees through the Model Context Protocol.
 *
 * Works with Claude Desktop, Cursor, Windsurf, Cline, and any MCP client.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const LLAMA_BASE = "https://api.llama.fi";
const YIELDS_BASE = "https://yields.llama.fi";
const STABLECOINS_BASE = "https://stablecoins.llama.fi";

// Rate limiter: DeFi Llama doesn't publish hard limits, but be polite.
// ~500ms between calls is safe and well below any reasonable limit.
let lastCall = 0;
const MIN_INTERVAL = 500;

async function rateLimitedFetch(url: string): Promise<any> {
  const now = Date.now();
  const wait = MIN_INTERVAL - (now - lastCall);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastCall = Date.now();

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`DeFi Llama API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function formatTVL(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

// Create server
const server = new McpServer({
  name: "defillama",
  version: "1.0.0",
});

// ── Tool: search_protocols ──
server.tool(
  "search_protocols",
  "Search DeFi protocols by name or symbol. Returns matching protocols ranked by TVL, each with name, symbol, TVL, category, chains, and slug. Use the slug in get_protocol_tvl for detailed data.",
  {
    query: z.string().describe("Search term (e.g. 'aave', 'uniswap', 'lido')"),
    limit: z.number().optional().default(10).describe("Max results to return (default 10)"),
  },
  async ({ query, limit }) => {
    try {
      const data = await rateLimitedFetch(`${LLAMA_BASE}/protocols`);
      if (!Array.isArray(data)) {
        return { content: [{ type: "text" as const, text: "Unexpected API response from DeFi Llama." }] };
      }
      const q = query.toLowerCase().trim();
      const matches = data
        .filter((p: any) => {
          const name = (p.name || "").toLowerCase();
          const symbol = (p.symbol || "").toLowerCase();
          const slug = (p.slug || "").toLowerCase();
          return name.includes(q) || symbol.includes(q) || slug.includes(q);
        })
        .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, limit);

      if (matches.length === 0) {
        return { content: [{ type: "text" as const, text: `No protocols found for "${query}".` }] };
      }

      const lines = matches.map((p: any) => {
        const chains = (p.chains || []).slice(0, 4).join(", ");
        const more = (p.chains || []).length > 4 ? ` +${p.chains.length - 4}` : "";
        const category = p.category || "Unknown";
        return `- **${p.name}** (${(p.symbol || "").toUpperCase()}) — TVL: ${formatTVL(p.tvl)} | Category: ${category} | Chains: ${chains}${more} | Slug: \`${p.slug}\``;
      });

      return {
        content: [{
          type: "text" as const,
          text: `**Top ${matches.length} protocols matching "${query}" (by TVL):**\n\n${lines.join("\n")}`,
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// ── Tool: get_protocol_tvl ──
server.tool(
  "get_protocol_tvl",
  "Get detailed TVL breakdown for a specific DeFi protocol by slug. Returns current TVL, chain-by-chain TVL distribution, 24h/7d TVL change percentages, category, description, website, and sampled TVL history. Use search_protocols to find the slug first.",
  {
    slug: z.string().describe("Protocol slug (e.g. 'aave', 'uniswap', 'lido'). Use search_protocols to find slugs."),
  },
  async ({ slug }) => {
    try {
      const data = await rateLimitedFetch(`${LLAMA_BASE}/protocol/${encodeURIComponent(slug)}`);
      const lines: string[] = [
        `**${data.name}** (${(data.symbol || "").toUpperCase()})`,
        "",
        `- **Category:** ${data.category || "Unknown"}`,
        `- **Chain:** ${data.chain || "Multi-chain"}`,
        `- **Current TVL:** ${formatTVL(data.tvl)}`,
        `- **mcap / TVL:** ${data.mcap || "N/A"}`,
        `- **Website:** ${data.url || "N/A"}`,
      ];

      // Chain breakdown
      if (Array.isArray(data.currentChainTvls) && data.currentChainTvls.length > 0) {
        const chainLines = data.currentChainTvls
          .map((c: any) => `  - ${c.name}: ${formatTVL(c.tvl)}`)
          .join("\n");
        lines.push("", "### TVL by Chain", chainLines);
      }

      // Recent TVL change
      if (data.change_1d != null || data.change_7d != null) {
        lines.push(
          "",
          "### TVL Change",
          `- **24h:** ${formatPct(data.change_1d)}`,
          `- **7d:** ${formatPct(data.change_7d)}`,
        );
      }

      // Description
      if (data.description) {
        const desc = String(data.description).replace(/<[^>]*>/g, "").slice(0, 400);
        lines.push("", "### Description", desc + (String(data.description).length > 400 ? "..." : ""));
      }

      // Recent TVL history (sample)
      if (data.tvl && Array.isArray(data.tvl) && data.tvl.length > 0) {
        const hist = data.tvl;
        const step = Math.max(1, Math.floor(hist.length / 10));
        const samples = hist.filter((_: any, i: number) => i % step === 0);
        const histLines = samples
          .map(([ts, v]: [number, number]) => `${new Date(ts * 1000).toISOString().split("T")[0]}: ${formatTVL(v)}`)
          .join("\n");
        lines.push("", "### TVL History (sampled)", histLines);
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// ── Tool: get_tvl_by_chain ──
server.tool(
  "get_tvl_by_chain",
  "Get total TVL for a specific blockchain (Ethereum, Arbitrum, Base, Solana, BSC, Polygon, etc.). Returns chain-level TVL, native token symbol, CoinGecko/CMC IDs, and top 10 tokens on that chain ranked by TVL. Useful for comparing chain activity and identifying where capital is concentrated.",
  {
    chain: z.string().describe("Chain name (e.g. 'Ethereum', 'Arbitrum', 'Base', 'Solana', 'BSC', 'Polygon')"),
  },
  async ({ chain }) => {
    try {
      const data = await rateLimitedFetch(`${LLAMA_BASE}/v2/chains`);
      if (!Array.isArray(data)) {
        return { content: [{ type: "text" as const, text: "Unexpected API response from DeFi Llama." }] };
      }
      const c = chain.toLowerCase().trim();
      const match = data.find((x: any) => (x.name || "").toLowerCase() === c)
        || data.find((x: any) => (x.name || "").toLowerCase().includes(c));

      if (!match) {
        return { content: [{ type: "text" as const, text: `Chain "${chain}" not found. Try one of: ${data.slice(0, 15).map((x: any) => x.name).join(", ")}...` }] };
      }

      const lines: string[] = [
        `**${match.name} — Chain TVL**`,
        "",
        `- **Total TVL:** ${formatTVL(match.tvl)}`,
      ];

      if (match.tokenSymbol) lines.push(`- **Native Token:** ${match.tokenSymbol}`);
      if (match.gecko_id) lines.push(`- **CoinGecko ID:** ${match.gecko_id}`);
      if (match.cmcdId) lines.push(`- **CMC ID:** ${match.cmcdId}`);

      // Top tokens on this chain by TVL
      if (Array.isArray(match.tokens) && match.tokens.length > 0) {
        const topTokens = match.tokens
          .filter((t: any) => t.tvl != null && t.tvl > 0)
          .sort((a: any, b: any) => b.tvl - a.tvl)
          .slice(0, 10);
        if (topTokens.length > 0) {
          const tokenLines = topTokens
            .map((t: any) => `- **${t.symbol || t.name || "?"}** (${t.name || ""}): ${formatTVL(t.tvl)}`)
            .join("\n");
          lines.push("", "### Top Tokens by TVL", tokenLines);
        }
      }

      // gecko_id link hint
      if (match.gecko_id) {
        lines.push("", `_View chart: https://defillama.com/chain/${match.name}_${match.gecko_id}_Coingecko__${match.name}_Coingecko_?_${match.geckoId || ""}_`);
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// ── Tool: get_yields ──
server.tool(
  "get_yields",
  "Search yield/APY opportunities across DeFi lending pools and staking. Returns pool name, chain, project, APY (with base + reward breakdown), TVL, and stablecoin indicator. Filter by chain, project, minimum TVL, or minimum APY. Impermanent-loss pools excluded by default.",
  {
    chain: z.string().optional().describe("Filter by chain (e.g. 'Ethereum', 'Arbitrum', 'Base', 'Solana')"),
    project: z.string().optional().describe("Filter by project (e.g. 'Aave', 'Lido', 'Compound')"),
    min_tvl: z.number().optional().default(1_000_000).describe("Minimum TVL in USD (default $1M)"),
    min_apy: z.number().optional().default(0).describe("Minimum APY % (default 0)"),
    limit: z.number().optional().default(20).describe("Max results (default 20)"),
  },
  async ({ chain, project, min_tvl, min_apy, limit }) => {
    try {
      const data = await rateLimitedFetch(`${YIELDS_BASE}/pools`);
      if (!data || !Array.isArray(data.data)) {
        return { content: [{ type: "text" as const, text: "Unexpected API response from DeFi Llama yields." }] };
      }

      const chainFilter = chain ? chain.toLowerCase().trim() : null;
      const projectFilter = project ? project.toLowerCase().trim() : null;

      const matches = data.data
        .filter((p: any) => {
          if (p.tvlUsd == null || p.tvlUsd < min_tvl) return false;
          if (p.apy == null || p.apy < min_apy) return false;
          if (p.ilRisk === "yes") return false; // Skip impermanent-loss pools by default
          if (chainFilter && !(p.chain || "").toLowerCase().includes(chainFilter)) return false;
          if (projectFilter && !(p.project || "").toLowerCase().includes(projectFilter)) return false;
          return true;
        })
        .sort((a: any, b: any) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
        .slice(0, limit);

      if (matches.length === 0) {
        return { content: [{ type: "text" as const, text: `No yield pools matched (chain: ${chain || "any"}, project: ${project || "any"}, min TVL $${min_tvl.toLocaleString()}, min APY ${min_apy}%).` }] };
      }

      const lines = matches.map((p: any) => {
        const apy = p.apy != null ? `${p.apy.toFixed(2)}%` : "N/A";
        const apyBase = p.apyBase != null ? `${p.apyBase.toFixed(2)}% base` : "";
        const apyReward = p.apyReward != null ? `+ ${p.apyReward.toFixed(2)}% reward` : "";
        const apyDetails = [apyBase, apyReward].filter(Boolean).join(" ");
        const tvl = formatTVL(p.tvlUsd);
        const symbol = p.symbol || "?";
        const projectName = p.project || "?";
        const chainName = p.chain || "?";
        const stable = p.stablecoin ? " 🟢" : "";
        return `- **${projectName}** — ${symbol} on ${chainName}${stable} | APY: ${apy}${apyDetails ? ` (${apyDetails})` : ""} | TVL: ${tvl}`;
      });

      const headerParts: string[] = [];
      if (chain) headerParts.push(`chain: ${chain}`);
      if (project) headerParts.push(`project: ${project}`);
      headerParts.push(`min TVL: ${formatTVL(min_tvl)}`);
      headerParts.push(`min APY: ${min_apy}%`);
      const header = headerParts.join(" | ");

      return {
        content: [{
          type: "text" as const,
          text: `**Top ${matches.length} yield pools (${header}):**\n\n${lines.join("\n")}`,
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// ── Tool: get_stablecoins ──
server.tool(
  "get_stablecoins",
  "Get stablecoin market data ranked by circulating supply. Returns symbol, peg type, circulating market cap, price, and number of chains each stablecoin is deployed on. Useful for comparing stablecoin adoption and identifying multi-chain stablecoins.",
  {
    limit: z.number().optional().default(25).describe("Max results (default 25)"),
  },
  async ({ limit }) => {
    try {
      const data = await rateLimitedFetch(`${STABLECOINS_BASE}/stablecoins`);
      if (!Array.isArray(data)) {
        return { content: [{ type: "text" as const, text: "Unexpected API response from DeFi Llama stablecoins." }] };
      }
      const sorted = [...data]
        .filter((s: any) => s.circulating != null)
        .sort((a: any, b: any) => (b.circulating?.usd || 0) - (a.circulating?.usd || 0))
        .slice(0, limit);

      if (sorted.length === 0) {
        return { content: [{ type: "text" as const, text: "No stablecoins returned by API." }] };
      }

      const lines = sorted.map((s: any, i: number) => {
        const mcap = formatTVL(s.circulating?.usd);
        const price = s.price != null ? `$${Number(s.price).toFixed(4)}` : "N/A";
        const symbol = s.symbol || s.name || "?";
        const pegType = s.pegType || "USD";
        const chains = Array.isArray(s.chains) ? s.chains.length : 0;
        return `${i + 1}. **${symbol}** (${pegType}) — MCap: ${mcap} | Price: ${price} | Chains: ${chains}`;
      });

      const totalMcap = sorted.reduce((acc: number, s: any) => acc + (s.circulating?.usd || 0), 0);
      return {
        content: [{
          type: "text" as const,
          text: `**Top ${sorted.length} Stablecoins by Market Cap (combined: ${formatTVL(totalMcap)}):**\n\n${lines.join("\n")}`,
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// ── Tool: get_bridges ──
server.tool(
  "get_bridges",
  "Get cross-chain bridge data ranked by total value locked. Returns bridge name, TVL, 24h volume, and 7d volume. Useful for comparing bridge liquidity and identifying which bridges handle the most cross-chain capital flow.",
  {
    limit: z.number().optional().default(20).describe("Max results (default 20)"),
  },
  async ({ limit }) => {
    try {
      const data = await rateLimitedFetch(`${LLAMA_BASE}/v2/bridges`);
      const bridges = Array.isArray(data) ? data : (data.bridges || []);
      if (!Array.isArray(bridges)) {
        return { content: [{ type: "text" as const, text: "Unexpected API response from DeFi Llama bridges." }] };
      }
      const sorted = [...bridges]
        .filter((b: any) => b.tvl != null && b.tvl > 0)
        .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, limit);

      if (sorted.length === 0) {
        return { content: [{ type: "text" as const, text: "No bridge data returned." }] };
      }

      const lines = sorted.map((b: any, i: number) => {
        const tvl = formatTVL(b.tvl);
        const dayVol = b.lastDayVolume != null ? `${formatTVL(b.lastDayVolume)} 24h` : "";
        const weekVol = b.weeklyVolume != null ? `${formatTVL(b.weeklyVolume)} 7d` : "";
        const volDetails = [dayVol, weekVol].filter(Boolean).join(" / ");
        return `${i + 1}. **${b.name || b.displayName || "Unknown"}** — TVL: ${tvl}${volDetails ? ` | Vol: ${volDetails}` : ""}`;
      });

      const totalTvl = sorted.reduce((acc: number, b: any) => acc + (b.tvl || 0), 0);
      return {
        content: [{
          type: "text" as const,
          text: `**Top ${sorted.length} Bridges by TVL (combined: ${formatTVL(totalTvl)}):**\n\n${lines.join("\n")}`,
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// ── Tool: get_dex_volumes ──
server.tool(
  "get_dex_volumes",
  "Get decentralized exchange trading volumes ranked by 24h volume. Returns DEX name, 24h/7d/30d volume, and 24h change percentage. Useful for comparing DEX activity, identifying volume trends, and finding which exchanges dominate on-chain trading.",
  {
    limit: z.number().optional().default(25).describe("Max results (default 25)"),
  },
  async ({ limit }) => {
    try {
      const data = await rateLimitedFetch(`${LLAMA_BASE}/overview/dexs`);
      const dexs = (data && (data.protocols || data)) || [];
      if (!Array.isArray(dexs)) {
        return { content: [{ type: "text" as const, text: "Unexpected API response from DeFi Llama dexs." }] };
      }
      const sorted = [...dexs]
        .filter((d: any) => d.total24h != null)
        .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0))
        .slice(0, limit);

      if (sorted.length === 0) {
        return { content: [{ type: "text" as const, text: "No DEX data returned." }] };
      }

      const lines = sorted.map((d: any, i: number) => {
        const v24 = formatTVL(d.total24h);
        const v7d = d.total7d != null ? formatTVL(d.total7d) : "N/A";
        const v30d = d.total30d != null ? formatTVL(d.total30d) : "N/A";
        const change = d.change_1d != null ? formatPct(d.change_1d) : "N/A";
        return `${i + 1}. **${d.name || d.displayName || "Unknown"}** — 24h: ${v24} | 7d: ${v7d} | 30d: ${v30d} | Δ24h: ${change}`;
      });

      const total24h = sorted.reduce((acc: number, d: any) => acc + (d.total24h || 0), 0);
      return {
        content: [{
          type: "text" as const,
          text: `**Top ${sorted.length} DEXes by 24h Volume (combined: ${formatTVL(total24h)}):**\n\n${lines.join("\n")}`,
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// ── Tool: get_protocol_fees ──
server.tool(
  "get_protocol_fees",
  "Get protocol fee and revenue data ranked by 24h fees. Returns protocol name, 24h/7d/30d fees, and 24h revenue where available. Useful for comparing protocol economics, identifying which DeFi protocols generate the most fees, and analyzing revenue trends.",
  {
    limit: z.number().optional().default(25).describe("Max results (default 25)"),
  },
  async ({ limit }) => {
    try {
      const data = await rateLimitedFetch(`${LLAMA_BASE}/overview/fees`);
      const protos = (data && (data.protocols || data)) || [];
      if (!Array.isArray(protos)) {
        return { content: [{ type: "text" as const, text: "Unexpected API response from DeFi Llama fees." }] };
      }
      const sorted = [...protos]
        .filter((p: any) => p.total24h != null)
        .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0))
        .slice(0, limit);

      if (sorted.length === 0) {
        return { content: [{ type: "text" as const, text: "No fee data returned." }] };
      }

      const lines = sorted.map((p: any, i: number) => {
        const f24 = formatTVL(p.total24h);
        const f7d = p.total7d != null ? formatTVL(p.total7d) : "N/A";
        const f30d = p.total30d != null ? formatTVL(p.total30d) : "N/A";
        const rev = p.revenue24h != null ? `${formatTVL(p.revenue24h)} rev` : "";
        return `${i + 1}. **${p.name || p.displayName || "Unknown"}** — Fees 24h: ${f24} | 7d: ${f7d} | 30d: ${f30d}${rev ? ` | ${rev}` : ""}`;
      });

      const total24h = sorted.reduce((acc: number, p: any) => acc + (p.total24h || 0), 0);
      return {
        content: [{
          type: "text" as const,
          text: `**Top ${sorted.length} Protocols by 24h Fees (combined: ${formatTVL(total24h)}):**\n\n${lines.join("\n")}`,
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
