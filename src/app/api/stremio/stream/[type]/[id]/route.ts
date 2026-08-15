import { NextRequest, NextResponse } from "next/server";
import { searchTorrents, formatSize } from "@/lib/torrent-search";
import { getIMDBInfo, buildSearchQueries } from "@/lib/imdb";

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

interface StremioStream {
  name: string;
  title: string;
  infoHash?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id: rawId } = await params;
  const headers = corsHeaders();
  const id = rawId.replace(/\.json$/, "");

  try {
    const streams = await handleStreamRequest(type, id);
    return NextResponse.json({ streams }, { headers });
  } catch (error) {
    console.error("Stream handler error:", error);
    return NextResponse.json({ streams: [] }, { headers });
  }
}

async function handleStreamRequest(type: string, id: string): Promise<StremioStream[]> {
  const parts = id.split(":");
  const imdbId = parts[0];
  const season = parts.length > 1 ? parseInt(parts[1], 10) : undefined;
  const episode = parts.length > 2 ? parseInt(parts[2], 10) : undefined;

  if (!imdbId.startsWith("tt")) return [];

  const info = await getIMDBInfo(imdbId);
  if (!info) return [];

  void type;
  const queries = buildSearchQueries(info, season, episode);
  const allStreams: StremioStream[] = [];
  const seenHashes = new Set<string>();

  for (const query of queries) {
    const torrents = await searchTorrents(query);
    for (const torrent of torrents) {
      const hash = torrent.infoHash.toLowerCase();
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      const sizeStr = formatSize(torrent.sizeBytes);
      allStreams.push({
        name: `Torrent Finder\n${sizeStr}`,
        title: `${torrent.title}\n\u{1F464} ${torrent.seeders} seeds | \u{1F4BE} ${sizeStr} | ${torrent.source}`,
        infoHash: hash,
      });
      if (allStreams.length >= 20) break;
    }
    if (allStreams.length >= 5) break;
  }

  return allStreams;
}
