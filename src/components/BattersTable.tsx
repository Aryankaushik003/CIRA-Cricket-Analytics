import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { BatterClutchStats } from '../types/cricket';

interface BattersTableProps {
  batters: BatterClutchStats[];
  onSelectPlayer: (player: BatterClutchStats) => void;
}

export const BattersTable: React.FC<BattersTableProps> = ({
  batters,
  onSelectPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = batters.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/20">
          <Trophy className="w-4 h-4" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300/20 text-slate-200 font-bold border border-slate-300/40">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 text-amber-500 font-bold border border-amber-700/40">
          3
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs font-semibold">
        {rank}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>Top 10 Batters Under Pressure (2022+)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by CIRA Clutch Rating (RRR &gt; 8.0, Death Overs 15-20, Anchor Collapse 1.5x, &amp; Lost-Cause IRIS)
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search batter or franchise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-14">Rank</th>
                <th className="py-3.5 px-4">Player &amp; Franchise</th>
                <th className="py-3.5 px-4 text-right">Pressure SR</th>
                <th className="py-3.5 px-4 text-right">Baseline SR</th>
                <th className="py-3.5 px-4 text-right">SR Delta (Δ)</th>
                <th className="py-3.5 px-4 text-right">Collapse SR (1.5x)</th>
                <th className="py-3.5 px-4 text-right">Boundary %</th>
                <th className="py-3.5 px-4 text-right">IRIS Score</th>
                <th className="py-3.5 px-4 text-right">Clutch Rating</th>
                <th className="py-3.5 px-4 text-center">Scouting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.slice(0, 10).map((b) => {
                const isPositiveDelta = b.strikeRateDifferential >= 0;
                return (
                  <tr
                    key={b.name}
                    onClick={() => onSelectPlayer(b)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 font-mono font-bold">
                      {getRankBadge(b.rank)}
                    </td>

                    {/* Name & Team */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-white border border-slate-700 group-hover:border-cyan-400/50 transition-colors">
                          {b.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-cyan-400 transition-colors text-sm">
                            {b.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {b.team} •{' '}
                            <span className="text-slate-300 font-mono">
                              {b.pressureRuns}r ({b.pressureBalls}b)
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Pressure Strike Rate */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {b.pressureStrikeRate.toFixed(1)}
                      </span>
                    </td>

                    {/* Baseline Strike Rate */}
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {b.baselineStrikeRate.toFixed(1)}
                    </td>

                    {/* SR Delta */}
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          isPositiveDelta ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositiveDelta ? '+' : ''}
                        {b.strikeRateDifferential.toFixed(1)}
                      </span>
                    </td>

                    {/* Collapse Window SR */}
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {b.collapseStrikeRate.toFixed(1)}
                      </span>
                    </td>

                    {/* Boundary % */}
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {b.pressureBoundaryPercent.toFixed(1)}%
                    </td>

                    {/* IRIS Score */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {b.battingIRIS.toFixed(1)}
                      </span>
                    </td>

                    {/* Clutch Rating */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="text-right">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            {b.clutchRating.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (b.clutchRating / 100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Deep Dive Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer(b);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                        title="View Radar Chart Deep Dive"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
