"use client";

import { useState, useCallback } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<{
    config: string;
    manifestUrl: string;
    installUrl: string;
    webUrl: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConfigure = useCallback(() => {
    if (!username || !password) {
      setError("Por favor, preencha usuário e senha do RuTracker");
      return;
    }

    setError("");

    // Generate config directly on the client
    const config = btoa(JSON.stringify({ username, password }));
    const host = window.location.host;
    const proto = window.location.protocol === "https:" ? "https" : "http";

    const manifestUrl = `${proto}://${host}/api/stremio/${config}/manifest.json`;
    const installUrl = `stremio://${host}/api/stremio/${config}/manifest.json`;
    const webUrl = `https://web.stremio.com/#/addons?addon=${encodeURIComponent(manifestUrl)}`;

    setResult({ config, manifestUrl, installUrl, webUrl });
  }, [username, password]);

  const handleCopy = useCallback(async () => {
    if (result?.manifestUrl) {
      await navigator.clipboard.writeText(result.manifestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4YzAgOS45NCA4LjA2IDE4IDE4IDE4czE4LTguMDYgMTgtMTgiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#c23152] shadow-lg shadow-[#e94560]/30 mb-6">
              <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none">
                <circle cx="24" cy="22" r="12" stroke="white" strokeWidth="2.5" fill="none" />
                <polygon points="21,16 21,28 31,22" fill="white" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent mb-4">
              RuTracker Stremio Addon
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Pesquise e faça streaming de filmes e séries diretamente do RuTracker.org no Stremio.
              Configure suas credenciais para começar.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold text-white mb-1">Pesquisa Integrada</h3>
              <p className="text-sm text-gray-400">Pesquise na barra de busca do Stremio e veja resultados do RuTracker</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-2xl mb-2">🎬</div>
              <h3 className="font-semibold text-white mb-1">Filmes &amp; Séries</h3>
              <p className="text-sm text-gray-400">Busca automática por IMDB ID com suporte a temporadas e episódios</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-2xl mb-2">🧲</div>
              <h3 className="font-semibold text-white mb-1">Magnet Links</h3>
              <p className="text-sm text-gray-400">Extração automática de magnet links e info hashes para streaming</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold text-white mb-1">Seguro</h3>
              <p className="text-sm text-gray-400">Credenciais na URL, nunca armazenadas no servidor</p>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#e94560]/20 to-transparent px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                ⚙️ Configuração
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Usuário RuTracker
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome de usuário no RuTracker"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha RuTracker
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha no RuTracker"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleConfigure}
                className="w-full py-3 px-6 bg-gradient-to-r from-[#e94560] to-[#c23152] hover:from-[#ff5a7a] hover:to-[#e94560] text-white font-semibold rounded-xl shadow-lg shadow-[#e94560]/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                🚀 Gerar Addon URL
              </button>
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div className="mt-8 bg-white/5 backdrop-blur-md rounded-2xl border border-green-500/30 shadow-2xl overflow-hidden">
              <div className="bg-green-500/10 px-6 py-4 border-b border-green-500/20">
                <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                  ✅ Addon Configurado!
                </h2>
              </div>

              <div className="p-6 space-y-5">
                {/* Manifest URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL do Manifest (copie e cole no Stremio)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={result.manifestUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-green-400 font-mono text-xs sm:text-sm focus:outline-none select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={handleCopy}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all text-sm whitespace-nowrap"
                    >
                      {copied ? "✅ Copiado!" : "📋 Copiar"}
                    </button>
                  </div>
                </div>

                {/* Install Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={result.installUrl}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#7b2ff7] to-[#5f1fd4] hover:from-[#8c45ff] hover:to-[#7b2ff7] text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 text-center"
                  >
                    🎬 Instalar no Stremio Desktop
                  </a>
                  <a
                    href={result.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl transition-all duration-200 text-center"
                  >
                    🌐 Abrir no Stremio Web
                  </a>
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-3">📖 Como instalar manualmente:</h3>
                  <ol className="space-y-2 text-sm text-gray-300">
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold min-w-[20px]">1.</span>
                      Copie a URL do manifest acima
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold min-w-[20px]">2.</span>
                      No Stremio, clique no ícone de puzzle (🧩) → Addons
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold min-w-[20px]">3.</span>
                      Cole a URL no campo &quot;Addon Repository URL&quot; e pressione Enter
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold min-w-[20px]">4.</span>
                      Clique &quot;Install&quot; para confirmar
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold min-w-[20px]">5.</span>
                      <strong>Pesquise qualquer filme/série</strong> na barra de busca — resultados do RuTracker aparecerão!
                    </li>
                  </ol>
                </div>

                {/* How it works */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-3">🔄 Como funciona:</h3>
                  <div className="text-sm text-gray-300 space-y-1 font-mono">
                    <p>Pesquisa no Stremio → &quot;Matrix&quot;</p>
                    <p className="text-gray-500">  ↓ catalog handler</p>
                    <p>Cinemeta → The Matrix (tt0133093) com poster</p>
                    <p className="text-gray-500">  ↓ clique no filme</p>
                    <p>RuTracker → busca &quot;The Matrix 1999&quot;</p>
                    <p className="text-gray-500">  ↓ stream handler</p>
                    <p>Magnet links → 🎬 Streaming!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-[#e94560] mb-3">⚠️ Requisitos</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Conta ativa no <a href="https://rutracker.org/forum/register.php" target="_blank" rel="noopener noreferrer" className="text-[#e94560] hover:underline">RuTracker.org</a></li>
                <li>• Stremio instalado (<a href="https://www.stremio.com/" target="_blank" rel="noopener noreferrer" className="text-[#e94560] hover:underline">Download</a>)</li>
                <li>• Acesso ao RuTracker (pode requerer VPN em alguns países)</li>
                <li>• Este addon precisa estar acessível publicamente (deploy na Vercel, etc.)</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-[#e94560] mb-3">🛡️ Segurança</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Credenciais codificadas em Base64 na URL</li>
                <li>• Nenhum dado é armazenado no servidor</li>
                <li>• O servidor só faz proxy das buscas no RuTracker</li>
                <li>• Código open-source — pode auditar tudo</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500 text-sm">
            <p>Este addon é não-oficial e não é afiliado ao RuTracker.org ou Stremio.</p>
            <p className="mt-1">Use por sua própria conta e risco.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
