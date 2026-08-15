export interface IMDBInfo {
  title: string;
  year: string;
  type: string; // "movie" | "series"
  originalTitle?: string;
}

// Fetch movie/series info from IMDB ID using Stremio's Cinemeta
export async function getIMDBInfo(imdbId: string): Promise<IMDBInfo | null> {
  try {
    // Try movie first
    let response = await fetch(
      `https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`,
      { headers: { "User-Agent": "StremioRuTracker/1.0" } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data?.meta) {
        return {
          title: data.meta.name,
          year: data.meta.year || data.meta.releaseInfo || "",
          type: "movie",
          originalTitle: data.meta.name,
        };
      }
    }

    // Try series
    response = await fetch(
      `https://v3-cinemeta.strem.io/meta/series/${imdbId}.json`,
      { headers: { "User-Agent": "StremioRuTracker/1.0" } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data?.meta) {
        return {
          title: data.meta.name,
          year: data.meta.year || data.meta.releaseInfo || "",
          type: "series",
          originalTitle: data.meta.name,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Cinemeta fetch error:", error);
    return null;
  }
}

// Build search queries for RuTracker
export function buildSearchQueries(
  info: IMDBInfo,
  season?: number,
  episode?: number
): string[] {
  const queries: string[] = [];
  const title = info.title;
  const year = info.year?.split("–")[0]?.split("-")[0]?.trim() || "";

  if (info.type === "movie") {
    // For movies, search with title + year
    if (year) {
      queries.push(`${title} ${year}`);
    }
    queries.push(title);
  } else {
    // For series, include season info
    if (season !== undefined) {
      const seasonPadded = String(season).padStart(2, "0");
      queries.push(`${title} S${seasonPadded}`);
      if (episode !== undefined) {
        const episodePadded = String(episode).padStart(2, "0");
        queries.push(`${title} S${seasonPadded}E${episodePadded}`);
      }
      queries.push(`${title} season ${season}`);
      queries.push(`${title} сезон ${season}`);
    }
    queries.push(title);
  }

  return queries;
}
