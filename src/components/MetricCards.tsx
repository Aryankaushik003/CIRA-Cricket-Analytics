import React from 'react';
import {
  Flame,
  Shield,
  Activity,
  Zap,
  Users,
  AlertTriangle,
  Award,
  Crosshair,
} from 'lucide-react';
import { CIRAResults } from '../types/cricket';

interface MetricCardsProps {
  results: CIRAResults | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ results }) => {
  if (!results) return null;

  const { metadata } = results;
  const highPressurePct = metadata.deliveriesCount > 0
    ? ((metadata.highPressureDeliveriesCount / metadata.deliveriesCount) * 100).toFixed(1)
    : '0';

  const cards = [
    {
      label: 'Deliveries Evaluated',
      value: metadata.deliveriesCount.toLocaleString(),
      subtext: `${metadata.matchesCount} Matches (${metadata.seasonRange})`,
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      label: 'High-Pressure Deliveries',
      value: metadata.highPressureDeliveriesCount.toLocaleString(),
      subtext: `${highPressurePct}% of match deliveries (PI ≥ 1.45)`,
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Anchor Collapses Tracked',
      value: metadata.anchorCollapsesDetected.toLocaleString(),
      subtext: '1.5x Multiplier for 15 Post-Dismissal Balls',
      icon: Zap,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Lost-Cause Situations (IRIS)',
      value: metadata.lostCauseDeliveriesCount.toLocaleString(),
      subtext: 'Chases needing RRR ≥ 18.0 or improbable odds',
      icon: Crosshair,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`p-2 rounded-lg ${c.bg} ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-2xl font-black text-white font-mono tracking-tight">
                {c.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                {c.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
