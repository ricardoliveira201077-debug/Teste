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
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<Array<{
    id?: string;
    title?: string;
    name?: string;
    size?: string;
    seeds?: number;
    leeches?: number;
  }> | null>(null);
  const [testing, setTesting] = useState(false);

  const handleConfigure = useCallback(async () => {
    if (!username || !password) {
      setError("Por favor, preencha usuário e senha do RuTracker");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stremio/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao configurar");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [username, password]);

  const handleCopy = useCallback(async () => {
    if (result?.manifestUrl) {
      await navigator.clipboard.writeText(result.manifestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleTest = useCallback(async () => {
    if (!testQuery || !result?.config) return;

    setTesting(true);
    setTestResults(null);

    try {
      const res = await fetch(
        `/api/stremio/stream?config=${result.config}&type=movie&id=${encodeURIComponent(testQuery)}`
      );
      const data = await res.json();
      setTestResults(data.streams || []);
    } catch {
      setTestResults([]);
    } finally {
      setTesting(false);
    }
  }, [testQuery, result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      {/* Hero Section */}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-2xl mb-2">🎬</div>
              <h3 className="font-semibold text-white mb-1">Filmes & Séries</h3>
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
              <p className="text-sm text-gray-400">Suas credenciais são codificadas na URL e nunca armazenadas em servidor</p>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#e94560]/20 to-transparent px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-[#e94560]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuração
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Username */}
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

              {/* Password */}
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
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleConfigure}
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-[#e94560] to-[#c23152] hover:from-[#ff5a7a] hover:to-[#e94560] text-white font-semibold rounded-xl shadow-lg shadow-[#e94560]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Gerando...
                  </>
                ) : (
                  <>
                    🚀 Gerar Addon URL
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div className="mt-8 bg-white/5 backdrop-blur-md rounded-2xl border border-green-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-green-500/10 px-6 py-4 border-b border-green-500/20">
                <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                  ✅ Addon Configurado com Sucesso!
                </h2>
              </div>

              <div className="p-6 space-y-5">
                {/* Manifest URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL do Manifest (copie para o Stremio)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={result.manifestUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-green-400 font-mono text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all text-sm whitespace-nowrap"
                    >
                      {copied ? "✅ Copiado!" : "📋 Copiar"}
                    </button>
                  </div>
                </div>

                {/* Install Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={result.installUrl}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#7b2ff7] to-[#5f1fd4] hover:from-[#8c45ff] hover:to-[#7b2ff7] text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 text-center"
                  >
                    🎬 Instalar no Stremio
                  </a>
                  <a
                    href={`https://web.stremio.com/#/addons?addon=${encodeURIComponent(result.manifestUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl transition-all duration-200 text-center"
                  >
                    🌐 Abrir no Stremio Web
                  </a>
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-3">📖 Como usar:</h3>
                  <ol className="space-y-2 text-sm text-gray-300">
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold">1.</span>
                      Clique em &quot;Instalar no Stremio&quot; ou copie a URL do manifest
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold">2.</span>
                      No Stremio, vá em Addons → clique no ícone de puzzle (🧩)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold">3.</span>
                      Cole a URL no campo &quot;Addon Repository URL&quot;
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e94560] font-bold">4.</span>
                      Instale o addon e pronto! Ao buscar filmes/séries, verá streams do RuTracker
                    </li>
                  </ol>
                </div>

                {/* Test Section */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-3">🔍 Testar Busca (opcional)</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Insira um IMDB ID (ex: tt0111161) para testar a busca
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="tt0111161"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560]"
                    />
                    <button
                      onClick={handleTest}
                      disabled={testing || !testQuery}
                      className="px-4 py-3 bg-[#e94560] hover:bg-[#ff5a7a] rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      {testing ? "..." : "Testar"}
                    </button>
                  </div>

                  {testResults !== null && (
                    <div className="mt-4 space-y-2">
                      {testResults.length === 0 ? (
                        <p className="text-gray-400 text-sm">Nenhum resultado encontrado</p>
                      ) : (
                        testResults.map((r, i) => (
                          <div key={i} className="bg-black/20 rounded-lg p-3 text-sm">
                            <p className="text-white font-medium">{r.title || r.name}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
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
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-[#e94560] mb-3">🔧 Como Funciona</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Quando você abre um filme/série no Stremio, o addon é chamado</li>
                <li>• O IMDB ID é convertido para o título usando Cinemeta</li>
                <li>• O RuTracker é pesquisado com o título</li>
                <li>• Magnet links são extraídos e retornados ao Stremio</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500 text-sm">
            <p>Este addon é não-oficial e não é afiliado ao RuTracker.org ou Stremio.</p>
            <p className="mt-1">Use por sua própria conta e risco. Respeite as leis de copyright do seu país.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
