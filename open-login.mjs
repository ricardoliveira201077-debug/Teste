// Abre o Firefox do perfil persistente do addon para login manual no RuTracker.
// Uso: node open-login.mjs
import { firefox } from "playwright-core";
import * as os from "os";
import * as path from "path";
import "dotenv/config";

const RUTRACKER_BASE = process.env.RUTRACKER_BASE || "https://rutracker.org/forum";
const PROFILE_DIR =
  process.env.RUTRACKER_PROFILE_DIR ||
  path.join(os.homedir(), ".rutracker-addon", "ff-profile");

const ctx = await firefox.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1280, height: 800 },
  locale: "ru-RU",
});

const page = await ctx.newPage();
console.log("A abrir:", `${RUTRACKER_BASE}/login.php`);
console.log("Entra na tua conta na janela do Firefox. Mantém a janela aberta —");
console.log("o addon reutiliza esta sessão. Fecha quando terminares.");

await page.goto(`${RUTRACKER_BASE}/login.php`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1000);

const close = async () => {
  try {
    await ctx.close();
  } catch {}
  process.exit(0);
};
process.on("SIGINT", close);
process.on("SIGTERM", close);