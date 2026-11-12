import React from 'react';
import {
  Sliders,
  Sparkles,
  Zap,
  Flame,
  Shield,
  Activity,
  Target,
  RefreshCw,
} from 'lucide-react';
import { AlgorithmConfig } from '../types/cricket';

interface ScenarioSimulatorProps {
  config: AlgorithmConfig;
  onChangeConfig: (newConfig: AlgorithmConfig) => void;
  onApplyConfig: () => void;
  isProcessing: boolean;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  config,
  onChangeConfig,
  onApplyConfig,
  isProcessing,
}) => {
  const handleChange = (key: keyof AlgorithmConfig, value: number) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="space-y-8">
      {/* Mathematical Formulation Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Factor A */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>A. Situational Pressure Index (PI)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dynamic delivery-level pressure tracking. Calculates continuous Required Run Rate (RRR) in chases:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800/80">
            PI = 1.0 + DeathBonus (0.50) + max(0, (RRR - 8.0) * 0.15) + WicketsLostBonus
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
            <li>Death overs trigger: Over ≥ 15</li>
            <li>Chase trigger: RRR &gt; 8.0</li>
            <li>Top-order collapse: Wickets lost ≥ 6</li>
          </ul>
        </div>

        {/* Factor B */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>B. Anchor Collapse Factor</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Identifies the top season run aggregate per franchise (e.g. Kohli, Gill, Buttler, Head).
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-amber-300 border border-slate-800/80">
            PI_effective = PI * 1.50 (for next 15 deliveries)
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
            <li>Automatic season aggregation</li>
            <li>1.5x multiplier applied for 15 balls</li>
            <li>Measures resilience of incoming hitters</li>
          </ul>
        </div>

        {/* Factor C */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>C. Improbable Resilience Index (IRIS)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Quantifies performance when match is statistically lost (RRR ≥ 18.0) or defending low totals.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-indigo-300 border border-slate-800/80">
            IRIS_bat = (0.45 * BndRate) + (0.35 * IntentSR) + (0.20 * DotAversion)
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
            <li>Batting IRIS: Lost-cause boundary conversions</li>
            <li>Bowling IRIS: Dot-ball pressure &amp; extras control</li>
            <li>Composite 0 - 100 rating scale</li>
          </ul>
        </div>
      </div>

      {/* Interactive Controls & Weight Tuning */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                CIRA Engine Parameter Controls
              </h3>
              <p className="text-xs text-slate-400">
                Adjust situational triggers and evaluate rank sensitivity dynamically
              </p>
            </div>
          </div>

          <button
            onClick={onApplyConfig}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Recalculate CIRA Rankings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {/* RRR High Pressure Threshold */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">High-Pressure RRR Trigger</span>
              <span className="font-mono font-bold text-cyan-400">{config.rrrHighPressureThreshold.toFixed(1)} RRR</span>
            </div>
            <input
              type="range"
              min="6.0"
              max="12.0"
              step="0.5"
              value={config.rrrHighPressureThreshold}
              onChange={(e) => handleChange('rrrHighPressureThreshold', parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Deliveries with chase RRR above this enter high pressure</p>
          </div>

          {/* Anchor Collapse Multiplier */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Anchor Collapse Multiplier</span>
              <span className="font-mono font-bold text-amber-400">{config.anchorCollapseMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.1"
              value={config.anchorCollapseMultiplier}
              onChange={(e) => handleChange('anchorCollapseMultiplier', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Multiplier applied to PI upon top season run leader dismissal</p>
          </div>

          {/* Anchor Window Balls */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Collapse Window Balls</span>
              <span className="font-mono font-bold text-amber-400">{config.anchorWindowBalls} deliveries</span>
            </div>
            <input
              type="range"
              min="6"
              max="24"
              step="1"
              value={config.anchorWindowBalls}
              onChange={(e) => handleChange('anchorWindowBalls', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Number of consecutive deliveries under elevated collapse pressure</p>
          </div>

          {/* Lost Cause Threshold */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Lost-Cause IRIS RRR</span>
              <span className="font-mono font-bold text-indigo-400">{config.lostCauseRrrThreshold.toFixed(1)} RRR</span>
            </div>
            <input
              type="range"
              min="14.0"
              max="24.0"
              step="1.0"
              value={config.lostCauseRrrThreshold}
              onChange={(e) => handleChange('lostCauseRrrThreshold', parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Statistically improbable chase trigger to measure intent</p>
          </div>

          {/* Min Balls Batter */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Batter Min Pressure Balls</span>
              <span className="font-mono font-bold text-cyan-400">{config.minPressureBallsBatter} balls</span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              step="5"
              value={config.minPressureBallsBatter}
              onChange={(e) => handleChange('minPressureBallsBatter', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Filter out single-match outliers from Top 10 rankings</p>
          </div>

          {/* Min Balls Bowler */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Bowler Min Pressure Balls</span>
              <span className="font-mono font-bold text-cyan-400">{config.minPressureBallsBowler} balls</span>
            </div>
            <input
              type="range"
              min="12"
              max="80"
              step="4"
              value={config.minPressureBallsBowler}
              onChange={(e) => handleChange('minPressureBallsBowler', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Minimum high-leverage deliveries bowled for ranking</p>
          </div>
        </div>
      </div>
    </div>
  );
};
