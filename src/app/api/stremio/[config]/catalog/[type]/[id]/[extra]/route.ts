import { NextRequest, NextResponse } from "next/server";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function parseExtra(extraStr: string): Record<string, string> {
  const cleaned = extraStr.replace(/\.json$/, "");
  const result: Record<string, string> = {};
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
}

async function searchCinemeta(query: string, type: string): Promise<CinemetaMeta[]> {
  try {
    const url = `${CINEMETA_URL}/catalog/${type}/top/search=${encodeURIComponent(query)}.json`;
    const response = await fetch(url, {
      headers: { "User-Agent": "StremioRuTracker/1.0" },
      signal: AbortSignal.timeout(5000),
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
  const { type, extra: extraStr } = await params;
  const headers = corsHeaders();

  const extra = parseExtra(extraStr);
  const searchQuery = extra["search"];

  if (!searchQuery) {
    return NextResponse.json({ metas: [] }, { headers });
  }

  try {
    const cinemetaResults = await searchCinemeta(searchQuery, type);

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

    return NextResponse.json({ metas: [] }, { headers });
  } catch (error) {
    console.error("Catalog handler error:", error);
    return NextResponse.json({ metas: [] }, { headers });
  }
}
