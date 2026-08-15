import { NextRequest, NextResponse } from "next/server";
import { decodeConfig } from "@/lib/manifest";
import { login, search, getMagnet, extractInfoHash } from "@/lib/rutracker";
import { getIMDBInfo, buildSearchQueries } from "@/lib/imdb";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Content-Type": "application/json" };
export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });

// RuTracker forum IDs para cinema/séries estrangeiros
const HD_FORUM_IDS = [
  "313",   // Зарубежное кино (HD Video) — Cinema estrangeiro HD
  "1457",  // Зарубежное кино (UHD Video) — Cinema estrangeiro 4K
  "1106",  // Зарубежные сериалы (HD Video) — Séries estrangeiras HD
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ config: string; type: string; id: string }> }
) {
  const { config, type, id: rawId } = await params;
  const id = rawId.replace(/\.json$/, "");
  const cfg = decodeConfig(config);
  if (!cfg) return NextResponse.json({ streams: [] }, { headers: CORS });

  try {
    // login
    await login(cfg.username, cfg.password);

    // resolve IMDB → title
    const parts = id.split(":");
    const imdbId = parts[0];
    if (!imdbId.startsWith("tt")) return NextResponse.json({ streams: [] }, { headers: CORS });

    const season = parts.length > 1 ? parseInt(parts[1], 10) : undefined;
    const episode = parts.length > 2 ? parseInt(parts[2], 10) : undefined;

    const info = await getIMDBInfo(imdbId);
    if (!info) return NextResponse.json({ streams: [] }, { headers: CORS });

    const queries = buildSearchQueries(info, season, episode);
    const forumIds = type === "series" ? ["1106"] : ["313", "1457"];

    const streams: { name: string; title: string; infoHash?: string; url?: string }[] = [];
    const seen = new Set<string>();

    for (const q of queries) {
      const results = await search(q, {
        forumIds,
        only1080: true,
      });

      for (const t of results) {
        if (seen.has(t.id) || t.seeds <= 0) continue;
        seen.add(t.id);

        // get magnet
        let hash: string | null = null;
        let magnet: string | undefined;
        if (t.magnetLink) {
          hash = extractInfoHash(t.magnetLink);
          magnet = t.magnetLink;
        } else {
          const m = await getMagnet(t.id);
          if (m) { hash = extractInfoHash(m); magnet = m; }
        }
        if (!hash && !magnet) continue;

        streams.push({
          name: `RuTracker\n${t.size}`,
          title: `${t.title}\n\u{1F464} ${t.seeds} seeds | \u{1F4BE} ${t.size}`,
          ...(hash ? { infoHash: hash } : { url: magnet }),
        });
        if (streams.length >= 15) break;
      }
      if (streams.length >= 5) break;
    }

    return NextResponse.json({ streams }, { headers: CORS });
  } catch (e) {
    console.error("stream error", e);
    return NextResponse.json({ streams: [] }, { headers: CORS });
  }
}
