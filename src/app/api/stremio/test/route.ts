import { NextRequest, NextResponse } from "next/server";
import { searchTorrents, formatSize } from "@/lib/torrent-search";
import { getIMDBInfo, buildSearchQueries } from "@/lib/imdb";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get("imdb") || "tt0133093"; // Default: The Matrix
  const query = searchParams.get("q");

  const results: Record<string, unknown> = { imdbId, timestamp: new Date().toISOString() };

  try {
    if (query) {
      // Direct torrent search
      const torrents = await searchTorrents(query);
      results.searchQuery = query;
      results.totalResults = torrents.length;
      results.torrents = torrents.map((t) => ({
        title: t.title,
        infoHash: t.infoHash,
        seeders: t.seeders,
        leechers: t.leechers,
        size: formatSize(t.sizeBytes),
        source: t.source,
      }));
    } else {
      // IMDB ID -> search flow
      const info = await getIMDBInfo(imdbId);
      results.imdbInfo = info;

      if (info) {
        const queries = buildSearchQueries(info);
        results.searchQueries = queries;

        // Search with the first query
        const torrents = await searchTorrents(queries[0]);
        results.totalResults = torrents.length;
        results.torrents = torrents.slice(0, 10).map((t) => ({
          title: t.title,
          infoHash: t.infoHash,
          seeders: t.seeders,
          leechers: t.leechers,
          size: formatSize(t.sizeBytes),
          source: t.source,
        }));
      }
    }
  } catch (error) {
    results.error = String(error);
  }

  return NextResponse.json(results, { headers: corsHeaders() });
}
