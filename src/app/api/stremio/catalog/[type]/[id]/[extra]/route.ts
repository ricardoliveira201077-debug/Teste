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
      result[decodeURIComponent(part.substring(0, eqIndex))] = decodeURIComponent(part.substring(eqIndex + 1));
    }
  }
  return result;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string; extra: string }> }
) {
  const { type, extra: extraStr } = await params;
  const headers = corsHeaders();
  const extra = parseExtra(extraStr);
  const searchQuery = extra["search"];

  if (!searchQuery) {
    return NextResponse.json({ metas: [] }, { headers });
  }

  try {
    const url = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(searchQuery)}.json`;
    const response = await fetch(url, {
      headers: { "User-Agent": "StremioTorrentFinder/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return NextResponse.json({ metas: [] }, { headers });

    const data = await response.json();
    const metas = (data?.metas || []).slice(0, 20).map((m: Record<string, unknown>) => ({
      id: m.id,
      type: m.type || type,
      name: m.name,
      poster: m.poster,
      releaseInfo: m.releaseInfo || m.year || "",
    }));

    return NextResponse.json({ metas }, { headers });
  } catch (error) {
    console.error("Catalog error:", error);
    return NextResponse.json({ metas: [] }, { headers });
  }
}
