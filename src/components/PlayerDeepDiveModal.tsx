import React, { useEffect } from 'react';
import {
  X,
  Trophy,
  Flame,
  Shield,
  Activity,
  Zap,
  Target,
  Sparkles,
  Info,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { BatterClutchStats, BowlerClutchStats } from '../types/cricket';

interface PlayerDeepDiveModalProps {
  player: BatterClutchStats | BowlerClutchStats | null;
  onClose: () => void;
}

export const PlayerDeepDiveModal: React.FC<PlayerDeepDiveModalProps> = ({
  player,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  const isBatter = 'pressureStrikeRate' in player;
  const batter = isBatter ? (player as BatterClutchStats) : null;
  const bowler = !isBatter ? (player as BowlerClutchStats) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-400 to-indigo-500" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/50">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xl shadow-lg">
              {player.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {player.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {player.team}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Rank #{player.rank}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{isBatter ? 'Elite Clutch Finisher' : 'Specialist Death & Pressure Bowler'}</span>
                <span>•</span>
                <span className="text-cyan-400 font-mono">
                  Clutch Rating: {player.clutchRating} / 100
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Main Visuals Grid: Radar Chart + Key Split Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Radar Chart (Baseline vs Pressure) */}
            <div className="lg:col-span-7 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Performance Radar (Baseline vs High-Pressure)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">0-100 Normalized</span>
              </div>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={player.radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="metric"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                    />
                    <Radar
                      name="Baseline (Normal Overs)"
                      dataKey="baseline"
                      stroke="#64748b"
                      fill="#64748b"
                      fillOpacity={0.25}
                    />
                    <Radar
                      name="High Pressure (CIRA)"
                      dataKey="pressure"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '10px',
                        fontSize: '11px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split Metrics Breakdown */}
            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Pressure Differential Diagnostics
              </h4>

              {isBatter && batter && (
                <>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Pressure Strike Rate</div>
                      <div className="text-xl font-bold font-mono text-cyan-400">
                        {batter.pressureStrikeRate.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Baseline: {batter.baselineStrikeRate.toFixed(1)}</div>
                      <div className="text-xs font-mono font-semibold text-emerald-400">
                        Δ {batter.strikeRateDifferential >= 0 ? '+' : ''}{batter.strikeRateDifferential.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Anchor Collapse SR (1.5x)</div>
                      <div className="text-xl font-bold font-mono text-amber-400">
                        {batter.collapseStrikeRate.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">15 Balls Post Anchor Dismissal</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {batter.collapseRuns}r / {batter.collapseBalls}b
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Batting IRIS (Lost Cause)</div>
                      <div className="text-xl font-bold font-mono text-indigo-400">
                        {batter.battingIRIS.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">RRR ≥ 18.0 Resilience</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {batter.pressureBoundaryPercent.toFixed(1)}% Bnd Rate
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!isBatter && bowler && (
                <>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Pressure Economy</div>
                      <div className="text-xl font-bold font-mono text-cyan-400">
                        {bowler.pressureEconomy.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Baseline: {bowler.baselineEconomy.toFixed(2)}</div>
                      <div className="text-xs font-mono font-semibold text-emerald-400">
                        Δ {bowler.economyDifferential >= 0 ? '-' : '+'}{Math.abs(bowler.economyDifferential).toFixed(2)} RPO
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Extra Control Rate</div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {bowler.extraControlRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Discipline at Death</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {bowler.pressureExtras} Extras Conceded
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Bowling IRIS Score</div>
                      <div className="text-xl font-bold font-mono text-indigo-400">
                        {bowler.bowlingIRIS.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Low Total / Death Mastery</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {bowler.pressureDotPercent.toFixed(1)}% Dot Balls
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI / Cricket Data Scientist Scouting Narrative */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>CIRA Analytics Scouting Intelligence Report</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {player.scoutingReport}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Close Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
};
