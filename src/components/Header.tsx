import React from 'react';
import {
  Flame,
  Shield,
  Activity,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Zap,
  Filter,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'batters' | 'bowlers' | 'simulator' | 'files';
  setActiveTab: (tab: 'batters' | 'bowlers' | 'simulator' | 'files') => void;
  minYear: number;
  setMinYear: (year: number) => void;
  compFilter: 'all' | 'ipl' | 't20i';
  setCompFilter: (comp: 'all' | 'ipl' | 't20i') => void;
  onReset: () => void;
  onOpenExport: () => void;
  onLoadRealData: () => void;
  isProcessing: boolean;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  minYear,
  setMinYear,
  compFilter,
  setCompFilter,
  onReset,
  onOpenExport,
  onLoadRealData,
  isProcessing,
  hasData,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  CIRA <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Analytics Engine</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">IPL Auction Eligible (No Pak Players)</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Clutch-Index &amp; Improbable Resilience Analytics • SupeRR Selector Season 2
              </p>
            </div>
          </div>

          {/* Quick Controls & Nav */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Real Data Pack Load Button */}
            <button
              onClick={onLoadRealData}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              title="Process official 200,999 delivery dataset"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing Data Pack...' : '⚡ Load Real Data Pack'}</span>
            </button>

            {/* Competition Filter */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" />
              </span>
              {(['all', 'ipl', 't20i'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCompFilter(filter)}
                  className={`px-2.5 py-1 rounded font-semibold uppercase text-[11px] transition-all ${
                    compFilter === filter
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Year Filter */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 font-medium">Season:</span>
              {[2022, 2023, 2024].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setMinYear(yr)}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    minYear === yr
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {yr}+
                </button>
              ))}
            </div>

            {/* Export Button */}
            {hasData && (
              <button
                onClick={onOpenExport}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="Export Unstop-ready JSON & CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export for Unstop</span>
              </button>
            )}

            {/* Reset */}
            {hasData && (
              <button
                onClick={onReset}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs"
                title="Reset or upload new files"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex items-center space-x-1 border-t border-slate-800/80 pt-2.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('batters')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'batters'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>Top 10 Batters Under Pressure</span>
          </button>

          <button
            onClick={() => setActiveTab('bowlers')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'bowlers'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Top 10 Bowlers Under Pressure</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>CIRA Algorithm Inspector &amp; Weights</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'files'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Data Management &amp; Files</span>
          </button>
        </div>
      </div>
    </header>
  );
};
