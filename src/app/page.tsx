"use client";

import { useState, useCallback, useEffect } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [manifestUrl, setManifestUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Test state
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<
    { id: string; title: string; size: string; seeds: number; category: string }[] | null
  >(null);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; challenged: boolean; loggedIn: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/stremio/test?action=status")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus({ ok: false, challenged: false, loggedIn: false }));
  }, []);

  const generate = useCallback(() => {
    if (!username || !password) {
      setError("Preenche todos os campos");
      return;
    }
    setError("");
    const cfg = btoa(JSON.stringify({ username, password }));
    const proto = location.protocol;
    const host = location.host;
    setManifestUrl(`${proto}//${host}/api/stremio/${cfg}/manifest.json`);
  }, [username, password]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(manifestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [manifestUrl]);

  const testSearch = useCallback(async () => {
    if (!testQuery) return;
    setTesting(true);
    setTestResults(null);
    const u = `/api/stremio/test?action=search&q=${encodeURIComponent(testQuery)}&u=${encodeURIComponent(username)}&p=${encodeURIComponent(password)}&hd=true`;
    try {
      const d = await fetch(u).then((r) => r.json());
      setTestResults(d.torrents ?? []);
    } catch {
      setTestResults([]);
    }
    setTesting(false);
  }, [testQuery, username, password]);

  const installUrl = manifestUrl.replace(/^https?:/, "stremio:");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-14 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#c23152] shadow-lg shadow-[#e94560]/30 mb-5">
            <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
              <circle cx="24" cy="22" r="12" stroke="white" strokeWidth="2.5" fill="none" />
              <polygon points="21,16 21,28 31,22" fill="white" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent mb-2">
            RuTracker Stremio
          </h1>
          <p className="text-gray-400">
            Streams de torrents do RuTracker.org — Cinema HD 1080p
          </p>
        </div>

        {/* RuTracker status */}
        <div className={`rounded-xl p-4 border text-sm ${status?.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {status === null
            ? "⏳ A verificar ligação ao RuTracker..."
            : status.ok
              ? (
                <>
                  ✅ RuTracker acessível!{status.loggedIn ? " Sessão iniciada no perfil do Firefox." : " Ainda sem sessão iniciada."}
                </>
              )
              : (
                <>
                  ❌ Não foi possível aceder ao RuTracker{status.challenged ? " — desafio Cloudflare pendente" : ""}. Confirma que a janela do Firefox do addon está aberta e completa o desafio se aparecer.
                </>
              )}
        </div>

        {/* Config */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-[#e94560]/10 px-5 py-3 border-b border-white/10 font-semibold">
            ⚙️ Configuração
          </div>
          <div className="p-5 space-y-4">
            <Field label="Usuário RuTracker" value={username} onChange={setUsername} placeholder="Teu username no rutracker.net" />
            <div>
              <label className="block text-sm text-gray-300 mb-1">Senha RuTracker</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tua senha" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}

            <button onClick={generate}
              className="w-full py-2.5 bg-gradient-to-r from-[#e94560] to-[#c23152] hover:from-[#ff5a7a] hover:to-[#e94560] rounded-xl font-semibold shadow-lg shadow-[#e94560]/25 transition-all">
              🚀 Gerar URL do Addon
            </button>
            <button onClick={async () => { await fetch("/api/stremio/login"); await fetch("/api/stremio/test?action=status").then(r => r.json()).then(d => setStatus(d)).catch(() => {}); }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-all">
              🔓 Abrir janela de login no Firefox
            </button>
            <button onClick={async () => { const d = await fetch("/api/stremio/login?action=refresh").then(r => r.json()); await fetch("/api/stremio/test?action=status").then(r => r.json()).then(s => setStatus(s)).catch(() => {}); alert(d.loggedIn ? "✅ Sessão guardada!" : "❌ Sem sessão. Entra primeiro na janela do Firefox."); }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-all">
              💾 Guardar sessão do Firefox
            </button>
          </div>
        </div>

        {/* Result */}
        {manifestUrl && (
          <div className="bg-white/5 rounded-2xl border border-green-500/30 overflow-hidden">
            <div className="bg-green-500/10 px-5 py-3 border-b border-green-500/20 font-semibold text-green-400">
              ✅ Addon Pronto
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input readOnly value={manifestUrl} onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-green-400 font-mono text-xs" />
                <button onClick={copy} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-all">
                  {copied ? "✅" : "📋"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href={installUrl} className="flex-1 py-2.5 bg-gradient-to-r from-[#7b2ff7] to-[#5f1fd4] rounded-xl font-semibold text-center">
                  🎬 Instalar no Stremio
                </a>
                <a href={`https://web.stremio.com/#/addons?addon=${encodeURIComponent(manifestUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-semibold text-center">
                  🌐 Stremio Web
                </a>
              </div>

              <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300 space-y-1">
                <p className="font-semibold text-white mb-2">📖 Instruções:</p>
                <p>1. Copia a URL acima</p>
                <p>2. No Stremio → Addons → 🧩 → Cola no campo de URL</p>
                <p>3. Pesquisa qualquer filme — streams 1080p do RuTracker aparecem!</p>
              </div>
            </div>
          </div>
        )}

        {/* Test */}
        {manifestUrl && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="bg-yellow-500/10 px-5 py-3 border-b border-white/10 font-semibold text-yellow-400">
              🧪 Testar Busca no RuTracker (1080p)
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <input value={testQuery} onChange={(e) => setTestQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && testSearch()}
                  placeholder="ex: The Matrix, Interstellar, Breaking Bad..."
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                <button onClick={testSearch} disabled={testing || !testQuery}
                  className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-medium disabled:opacity-50 transition-all">
                  {testing ? "⏳" : "🔍"}
                </button>
              </div>

              {testResults !== null && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhum resultado. Verifica a sessão no Firefox e as credenciais.</p>
                  ) : (
                    testResults.map((t, i) => (
                      <div key={i} className="bg-black/20 rounded-lg p-3 text-sm border border-white/5">
                        <p className="text-white font-medium">{t.title}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          <span className="text-green-400">👤 {t.seeds} seeds</span>
                          <span>💾 {t.size}</span>
                          <span>📂 {t.category}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-sm text-gray-300 space-y-2">
          <p className="font-semibold text-white">🔧 Como funciona:</p>
          <p>1. <strong>Firefox</strong> — um browser real (janela própria) acede ao RuTracker e resolve o desafio Cloudflare</p>
          <p>2. <strong>Login</strong> — entra uma vez manualmente na janela do Firefox; a sessão fica guardada no perfil</p>
          <p>3. <strong>Busca</strong> — pesquisa na categoria &quot;Cinema Estrangeiro (HD Vídeo)&quot; filtrando só 1080p</p>
          <p>4. <strong>Magnet</strong> — extrai o magnet link de cada tópico e envia ao Stremio</p>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-sm text-gray-300">
          <p className="font-semibold text-white mb-2">📂 Categorias RuTracker usadas:</p>
          <ul className="space-y-1 text-xs">
            <li>• <code className="bg-black/30 px-1 rounded">f=313</code> — Зарубежное кино (HD Video) — Cinema Estrangeiro HD</li>
            <li>• <code className="bg-black/30 px-1 rounded">f=1457</code> — Зарубежное кино (UHD Video) — Cinema Estrangeiro 4K</li>
            <li>• <code className="bg-black/30 px-1 rounded">f=1106</code> — Зарубежные сериалы (HD Video) — Séries Estrangeiras HD</li>
            <li>• Filtro: apenas títulos com &quot;1080&quot;/&quot;4K&quot; no nome</li>
          </ul>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Addon não-oficial. Não afiliado ao RuTracker.org ou Stremio.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560]" />
    </div>
  );
}
