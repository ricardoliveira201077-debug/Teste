import { NextRequest, NextResponse } from "next/server";
import { getRuTrackerClient, extractInfoHash } from "@/lib/rutracker";
import { getIMDBInfo, buildSearchQueries } from "@/lib/imdb";

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

function formatSize(bytes: number): string {
  if (bytes === 0) return "N/A";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

interface StremioStream {
  name: string;
  title: string;
  infoHash?: string;
  url?: string;
  behaviorHints?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  const headers = corsHeaders();
  const { searchParams } = new URL(request.url);

  const config = searchParams.get("config") || "";
  const type = searchParams.get("type") || "";
  const id = searchParams.get("id") || "";

  if (!config || !type || !id) {
    return NextResponse.json({ streams: [] }, { headers });
  }

  let parsed: { username: string; password: string };
  try {
    parsed = JSON.parse(Buffer.from(config, "base64").toString("utf-8"));
  } catch {
    return NextResponse.json({ streams: [] }, { headers });
  }

  if (!parsed.username || !parsed.password) {
    return NextResponse.json({ streams: [] }, { headers });
  }

  try {
    const streams = await handleStreamRequest(
      parsed.username,
      parsed.password,
      type,
      id
    );
    return NextResponse.json({ streams }, { headers });
  } catch (error) {
    console.error("Stream handler error:", error);
    return NextResponse.json({ streams: [] }, { headers });
  }
}

async function handleStreamRequest(
  username: string,
  password: string,
  type: string,
  id: string
): Promise<StremioStream[]> {
  const parts = id.split(":");
  const imdbId = parts[0];
  const season = parts.length > 1 ? parseInt(parts[1], 10) : undefined;
  const episode = parts.length > 2 ? parseInt(parts[2], 10) : undefined;

  const info = await getIMDBInfo(imdbId);
  if (!info) return [];

  const client = await getRuTrackerClient(username, password);
  const queries = buildSearchQueries(info, season, episode);

  const allStreams: StremioStream[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const torrents = await client.search(query);

    for (const torrent of torrents) {
      if (seenIds.has(torrent.id)) continue;
      seenIds.add(torrent.id);
      if (torrent.seeds <= 0) continue;

      let magnetLink = torrent.magnetLink;
      let infoHash: string | null = null;

      if (magnetLink) {
        infoHash = extractInfoHash(magnetLink);
      }

      const sizeStr = torrent.sizeBytes
        ? formatSize(torrent.sizeBytes)
        : torrent.size;

      const stream: StremioStream = {
        name: `RuTracker\n${sizeStr}`,
        title: `${torrent.title}\n👤 ${torrent.seeds} seeds | 📥 ${torrent.leeches} leeches | 💾 ${sizeStr}`,
      };

      if (infoHash) {
        stream.infoHash = infoHash;
      } else if (magnetLink) {
        stream.url = magnetLink;
      } else {
        const fetchedMagnet = await client.getMagnetLink(torrent.id);
        if (fetchedMagnet) {
          const fetchedHash = extractInfoHash(fetchedMagnet);
          if (fetchedHash) {
            stream.infoHash = fetchedHash;
          } else {
            stream.url = fetchedMagnet;
          }
        } else {
          continue;
        }
      }

      allStreams.push(stream);
      if (allStreams.length >= 20) break;
    }

    if (allStreams.length >= 5) break;
  }

  return allStreams;
}
