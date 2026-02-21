import { ChangeEvent, useRef, useState } from 'react';
import { generateGameConfig, GameConfig } from './services/gemini';
import { buildGamePackage, downloadGamePackage, parseGamePackageText } from './services/gamePackage';
import PhaserContainer from './game/PhaserContainer';
import { Send, Loader2, Download, Upload } from 'lucide-react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const newConfig = await generateGameConfig(prompt);
      setConfig(newConfig);
    } catch (error: any) {
      console.error("Generation failed:", error);
      alert(`Failed to generate game. ${error.message || "Check console for details."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!config) return;
    const pkg = buildGamePackage(config, prompt);
    const fileBase = `${config.theme}-${config.gameMode || "lane-battle"}`;
    downloadGamePackage(pkg, fileBase);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const pkg = parseGamePackageText(text);
      setConfig(pkg.config);
      if (pkg.sourcePrompt) setPrompt(pkg.sourcePrompt);
    } catch (error: any) {
      alert(`Failed to import game package. ${error?.message || ""}`.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center py-10 font-sans text-slate-800 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <h1 className="text-6xl text-[#ffce44] mb-8 tracking-wider uppercase supercell-font" style={{ textShadow: '4px 4px 0px #000, 8px 8px 0px rgba(0,0,0,0.2)' }}>
        Gemini Arcade
      </h1>

      <div className="w-full max-w-2xl p-6 mb-8 brawl-card transform -rotate-1">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-6 py-4 bg-slate-100 rounded-xl border-4 border-slate-300 focus:border-blue-500 outline-none text-xl font-bold transition-all text-slate-700"
            placeholder="What kind of battle? e.g. Cyber Ninjas vs Aliens"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-[#3388ff] hover:bg-[#2277ee] disabled:opacity-50 brawl-btn px-8"
          >
            {loading ? <Loader2 className="animate-spin w-8 h-8" /> : <Send className="w-8 h-8" />}
          </button>
        </div>
        <div className="mt-3 flex gap-2 justify-end">
          <button
            onClick={handleImportClick}
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg border-2 border-black text-sm font-bold"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={!config}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg border-2 border-black text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>

      {config && (
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
<div className="game-container-border overflow-hidden">
             <PhaserContainer config={config} />
          </div>
          
          <div className="mt-6 flex gap-4">
             {/* Unit Spawn Buttons - Visualizing what's inside Phaser for now */}
             {config.playerUnits.map((unit, idx) => (
                <div key={idx} className="bg-[#222] border-4 border-black rounded-xl p-2 w-28 h-40 flex flex-col items-center justify-between shadow-lg transform hover:-translate-y-1 transition-transform cursor-pointer">
                    <div className="w-16 h-16 rounded-full border-2 border-black overflow-hidden bg-white">
                        {unit.imageUrl && <img src={unit.imageUrl} alt={unit.name} className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-white font-bold text-xs text-center leading-tight">{unit.name}</span>
                    <div className="flex flex-col items-center gap-1">
                        <span className="bg-[#ffce44] text-black text-[10px] font-black px-2 rounded-full border-2 border-black">{unit.cost}</span>
                    </div>
                </div>
             ))}
          </div>

          <div className="mt-8 text-center">
            <p className="font-black text-white text-2xl supercell-font tracking-wide" style={{ textShadow: '2px 2px 0 #000' }}>
              Current Theme: <span className="text-[#ffce44]">{config.theme}</span>
            </p>
            <p className="font-mono text-xs text-sky-300 mt-1 uppercase tracking-wider">
              Mode: {config.gameMode || "lane-battle"}
              {" · "}Spawn: {config.spawnPattern || "steady"}
              {" · "}Win: {config.winCondition || "destroy_base"}
              {config.winCondition === "survival" && config.timerSeconds ? ` (${config.timerSeconds}s)` : ""}
              {config.winCondition === "score_race" && config.targetScore ? ` (first to ${config.targetScore})` : ""}
            </p>
          </div>
        </div>
      )}

      {!config && !loading && (
        <div className="text-slate-400 text-center mt-20 opacity-50">
          <p className="text-xl font-bold">Describe your game idea above to start!</p>
        </div>
      )}
    </div>
  );
}

export default App;
