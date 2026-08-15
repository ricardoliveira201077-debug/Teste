import { NextRequest, NextResponse } from "next/server";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Content-Type": "application/json" };
export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });

function parseExtra(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.replace(/\.json$/, "").split(/[&/]/)) {
    const eq = part.indexOf("=");
    if (eq > 0) out[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1));
  }
  return out;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ config: string; type: string; id: string; extra: string }> }
) {
  const { type, extra: extraStr } = await params;
  const q = parseExtra(extraStr)["search"];
  if (!q) return NextResponse.json({ metas: [] }, { headers: CORS });

  try {
    const r = await fetch(
      `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(q)}.json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return NextResponse.json({ metas: [] }, { headers: CORS });
    const data = await r.json();
    const metas = (data?.metas ?? []).slice(0, 20).map((m: Record<string, unknown>) => ({
      id: m.id, type: m.type ?? type, name: m.name, poster: m.poster,
      releaseInfo: m.releaseInfo ?? m.year ?? "",
    }));
    return NextResponse.json({ metas }, { headers: CORS });
  } catch {
    return NextResponse.json({ metas: [] }, { headers: CORS });
  }
}
