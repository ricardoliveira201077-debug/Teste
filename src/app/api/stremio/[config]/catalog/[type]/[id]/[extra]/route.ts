import { NextRequest, NextResponse } from "next/server";
import { getRuTrackerClient } from "@/lib/rutracker";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function parseConfig(configStr: string): { username: string; password: string } {
  try {
    const decoded = Buffer.from(configStr, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return { username: "", password: "" };
  }
}

function parseExtra(extraStr: string): Record<string, string> {
  // Extra format: "search=matrix" or "search=matrix&skip=10" or "search=matrix/skip=10"
  // Remove .json suffix
  const cleaned = extraStr.replace(/\.json$/, "");
  const result: Record<string, string> = {};

  // Stremio sends extra as key=value separated by & or /
  const parts = cleaned.split(/[&/]/);
  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex > 0) {
      const key = decodeURIComponent(part.substring(0, eqIndex));
      const value = decodeURIComponent(part.substring(eqIndex + 1));
      result[key] = value;
    }
  }

  return result;
}

const CINEMETA_URL = "https://v3-cinemeta.strem.io";

interface CinemetaMeta {
  id: string;
  type: string;
  name: string;
  poster?: string;
  releaseInfo?: string;
  year?: string;
  imdb_id?: string;
}

async function searchCinemeta(query: string, type: string): Promise<CinemetaMeta[]> {
  try {
    const url = `${CINEMETA_URL}/catalog/${type}/top/search=${encodeURIComponent(query)}.json`;
    const response = await fetch(url, {
      headers: { "User-Agent": "StremioRuTracker/1.0" },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data?.metas || [];
  } catch {
    return [];
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ config: string; type: string; id: string; extra: string }> }
) {
  const { config, type, id, extra: extraStr } = await params;
  const headers = corsHeaders();

  void id; // catalog id, not used for filtering

  const parsed = parseConfig(config);
  if (!parsed.username || !parsed.password) {
    return NextResponse.json({ metas: [] }, { headers });
  }

  const extra = parseExtra(extraStr);
  const searchQuery = extra["search"];

  if (!searchQuery) {
    return NextResponse.json({ metas: [] }, { headers });
  }

  try {
    // Strategy: Search Cinemeta first to find proper IMDB-backed results,
    // and also search RuTracker to verify content exists there
    const [cinemetaResults, ruTrackerResults] = await Promise.all([
      searchCinemeta(searchQuery, type),
      (async () => {
        const client = await getRuTrackerClient(parsed.username, parsed.password);
        return client.search(searchQuery);
      })(),
    ]);

    // If we have cinemeta results, return those (Stremio handles the metadata)
    // The stream handler will then find RuTracker torrents when user clicks
    if (cinemetaResults.length > 0) {
      const metas = cinemetaResults.slice(0, 20).map((m) => ({
        id: m.id,
        type: m.type || type,
        name: m.name,
        poster: m.poster,
        releaseInfo: m.releaseInfo || m.year || "",
      }));
      return NextResponse.json({ metas }, { headers });
    }

    // If no cinemeta results, create meta items from RuTracker results directly
    // These won't have IMDB IDs but will show up in search
    if (ruTrackerResults.length > 0) {
      const metas = ruTrackerResults.slice(0, 20).map((t) => ({
        id: `rutracker:${t.id}`,
        type,
        name: t.title,
        releaseInfo: `${t.seeds} seeds | ${t.size}`,
      }));
      return NextResponse.json({ metas }, { headers });
    }

    return NextResponse.json({ metas: [] }, { headers });
  } catch (error) {
    console.error("Catalog handler error:", error);
    return NextResponse.json({ metas: [] }, { headers });
  }
}
