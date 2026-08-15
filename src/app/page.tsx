"use client";

import { useState, useCallback, useEffect } from "react";

interface TestResult {
  title: string;
  seeders: number;
  size: string;
  infoHash: string;
  source: string;
}

export default function Home() {
  const [manifestUrl, setManifestUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [testImdb, setTestImdb] = useState("");
  const [imdbResults, setImdbResults] = useState<TestResult[] | null>(null);
  const [imdbTesting, setImdbTesting] = useState(false);
  const [imdbInfo, setImdbInfo] = useState<string>("");

  useEffect(() => {
    const host = window.location.host;
    const proto = window.location.protocol === "https:" ? "https" : "http";
    setManifestUrl(`${proto}://${host}/api/stremio/manifest.json`);
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(manifestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [manifestUrl]);

  const handleTestDirect = useCallback(async () => {
    if (!testQuery) return;
    setTesting(true);
    setTestResults(null);
    try {
      const res = await fetch(`/api/stremio/test?q=${encodeURIComponent(testQuery)}`);
      const data = await res.json();
      setTestResults(data.torrents || []);
    } catch {
      setTestResults([]);
    } finally {
      setTesting(false);
    }
  }, [testQuery]);

  const handleTestImdb = useCallback(async () => {
    if (!testImdb) return;
    setImdbTesting(true);
    setImdbResults(null);
    setImdbInfo("");
    try {
      const res = await fetch(`/api/stremio/test?imdb=${encodeURIComponent(testImdb)}`);
      const data = await res.json();
      setImdbResults(data.torrents || []);
      if (data.imdbInfo) {
        setImdbInfo(`${data.imdbInfo.title} (${data.imdbInfo.year}) - Queries: ${(data.searchQueries || []).join(", ")}`);
      }
    } catch {
      setImdbResults([]);
    } finally {
      setImdbTesting(false);
    }
  }, [testImdb]);

  const installUrl = manifestUrl.replace(/^https?:/, "stremio:");
  const webUrl = `https://web.stremio.com/#/addons?addon=${encodeURIComponent(manifestUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div className="relative max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#c23152] shadow-lg shadow-[#e94560]/30 mb-6">
            <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none">
              <circle cx="24" cy="22" r="12" stroke="white" strokeWidth="2.5" fill="none" />
              <polygon points="21,16 21,28 31,22" fill="white" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent mb-4">
            Torrent Finder
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Addon Stremio para pesquisar torrents de múltiplas fontes.
            Sem necessidade de conta — instale e use!
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold mb-1">Pesquisa Integrada</h3>
            <p className="text-sm text-gray-400">Pesquise na barra de busca do Stremio</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="text-2xl mb-2">🧲</div>
            <h3 className="font-semibold mb-1">Múltiplas Fontes</h3>
            <p className="text-sm text-gray-400">1337x, TPB, RuTracker e mais via agregadores</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Sem Login</h3>
            <p className="text-sm text-gray-400">Instale direto, sem necessidade de conta</p>
          </div>
        </div>

        {/* Install Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#e94560]/20 to-transparent px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold">🚀 Instalar no Stremio</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">URL do Manifest:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manifestUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-green-400 font-mono text-xs sm:text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button onClick={handleCopy} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm">
                  {copied ? "✅" : "📋"}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href={installUrl} className="flex-1 py-3 px-6 bg-gradient-to-r from-[#7b2ff7] to-[#5f1fd4] hover:from-[#8c45ff] hover:to-[#7b2ff7] text-white font-semibold rounded-xl shadow-lg text-center">
                🎬 Instalar no Stremio
              </a>
              <a href={webUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/10 font-semibold rounded-xl text-center">
                🌐 Stremio Web
              </a>
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500/20 to-transparent px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-green-400">🧪 Testar Busca de Torrents</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Direct torrent search */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Busca direta por nome:</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTestDirect()}
                  placeholder="ex: The Matrix 1999 1080p"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleTestDirect}
                  disabled={testing || !testQuery}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {testing ? "⏳" : "🔍 Buscar"}
                </button>
              </div>
              {testResults !== null && <ResultsList results={testResults} />}
            </div>

            <hr className="border-white/10" />

            {/* IMDB search */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Busca por IMDB ID (simula o Stremio):</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testImdb}
                  onChange={(e) => setTestImdb(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTestImdb()}
                  placeholder="ex: tt0133093"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleTestImdb}
                  disabled={imdbTesting || !testImdb}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {imdbTesting ? "⏳" : "🎬 Buscar"}
                </button>
              </div>
              {imdbInfo && <p className="mt-2 text-sm text-yellow-400">📎 {imdbInfo}</p>}
              {imdbResults !== null && <ResultsList results={imdbResults} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Addon não-oficial. Use por sua conta e risco.</p>
        </div>
      </div>
    </div>
  );
}

function ResultsList({ results }: { results: TestResult[] }) {
  if (results.length === 0) {
    return <p className="mt-3 text-gray-400 text-sm">Nenhum resultado encontrado.</p>;
  }
  return (
    <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
      {results.map((r, i) => (
        <div key={i} className="bg-black/20 rounded-lg p-3 text-sm border border-white/5">
          <p className="text-white font-medium">{r.title}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
            <span className="text-green-400">👤 {r.seeders} seeds</span>
            <span>💾 {r.size}</span>
            <span>📡 {r.source}</span>
            <span className="text-gray-600 font-mono">{r.infoHash?.substring(0, 16)}...</span>
          </div>
        </div>
      ))}
    </div>
  );
}
