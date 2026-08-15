import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { checkRuTracker, login, search, getMagnet, extractInfoHash, isLoggedIn } from "@/lib/rutracker";
import { getIMDBInfo, buildSearchQueries } from "@/lib/imdb";
import { open, RUTRACKER_BASE } from "@/lib/browser";

const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const action = sp.get("action") ?? "status";
  const out: Record<string, unknown> = { action, ts: new Date().toISOString() };

  try {
    if (action === "status") {
      const st = await checkRuTracker();
      out.ok = st.ok;
      out.challenged = st.challenged;
      out.loggedIn = st.loggedIn || isLoggedIn();
      out.hint = st.ok
        ? "✅ RuTracker acessível! (janela do Firefox deve estar aberta)"
        : "❌ Não foi possível aceder ao RuTracker. Verifica se a janela do Firefox do addon está aberta e completa o desafio Cloudflare se aparecer.";
    }

    if (action === "search") {
      const q = sp.get("q") ?? "";
      const user = sp.get("u") ?? "";
      const pass = sp.get("p") ?? "";
      const hd = sp.get("hd") !== "false";

      if (!q) { out.error = "Falta parâmetro ?q="; return NextResponse.json(out, { headers: CORS }); }
      if (user && pass) await login(user, pass);

      const f = sp.get("f");
      const results = await search(q, {
        forumIds: f ? [f] : ["313"],
        only1080: hd,
      });
      out.query = q;
      out.hd = hd;
      out.loggedIn = isLoggedIn();
      out.total = results.length;
      out.torrents = results.slice(0, 15).map((t) => ({
        id: t.id,
        title: t.title,
        size: t.size,
        seeds: t.seeds,
        leeches: t.leeches,
        category: t.category,
      }));

      // debug: detalhes do último fetch (para depurar desafio/parser)
      const { lastFetch } = await import("@/lib/rutracker");
      const dbg = lastFetch?.();
      if (dbg) out.debug = dbg;
    }

    if (action === "imdb") {
      const imdb = sp.get("id") ?? "tt0133093";
      const info = await getIMDBInfo(imdb);
      out.imdb = info;
      if (info) out.queries = buildSearchQueries(info);
    }

    if (action === "forums") {
      const html = await open(`${RUTRACKER_BASE}/index.php`);
      const $ = cheerio.load(html ?? "");
      const forums: { id: string; name: string }[] = [];
      $("a[href*='viewforum.php?f=']").each((_i: number, el: any) => {
        const href = $(el).attr("href") ?? "";
        const id = href.match(/f=(\d+)/)?.[1] ?? "";
        if (id && !forums.some((x) => x.id === id))
          forums.push({ id, name: $(el).text().trim().slice(0, 60) });
      });
      out.forums = forums.slice(0, 80);
    }

    if (action === "magnet") {
      const tid = sp.get("id") ?? "";
      if (!tid) { out.error = "Falta ?id=TORRENT_ID"; return NextResponse.json(out, { headers: CORS }); }
      const user = sp.get("u") ?? "";
      const pass = sp.get("p") ?? "";
      if (user && pass) await login(user, pass);
      const m = await getMagnet(tid);
      out.magnet = m;
      out.infoHash = m ? extractInfoHash(m) : null;
    }
  } catch (e) {
    out.error = String(e);
  }

  return NextResponse.json(out, { headers: CORS });
}