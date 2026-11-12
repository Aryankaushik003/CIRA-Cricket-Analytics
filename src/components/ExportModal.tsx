import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileJson,
  FileSpreadsheet,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CIRAResults } from '../types/cricket';

interface ExportModalProps {
  results: CIRAResults | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ results, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<'text' | 'json' | 'csv'>('text');

  if (!results) return null;

  const { topBatters, topBowlers, metadata } = results;

  // Generate Unstop Formatted Submission Text
  const unstopFormattedText = `==========================================================
CIRA: CLUTCH-INDEX & IMPROBABLE RESILIENCE ANALYTICS
UNSTOP SUBMISSION REPORT (2022+ DATASET)
Generated: ${new Date(metadata.generatedAt).toLocaleString()}
==========================================================

--- SECTION 1: TOP 10 BATTERS UNDER PRESSURE ---
${topBatters
  .map(
    (b) =>
      `${b.rank}. ${b.name} (${b.team}) | Pressure SR: ${b.pressureStrikeRate.toFixed(1)} | Baseline SR: ${b.baselineStrikeRate.toFixed(1)} | IRIS: ${b.battingIRIS.toFixed(1)} | Clutch Rating: ${b.clutchRating.toFixed(1)}`
  )
  .join('\n')}

--- SECTION 2: TOP 10 BOWLERS UNDER PRESSURE ---
${topBowlers
  .map(
    (b) =>
      `${b.rank}. ${b.name} (${b.team}) | Pressure Econ: ${b.pressureEconomy.toFixed(2)} | Extra Control: ${b.extraControlRate.toFixed(1)}% | Dot%: ${b.pressureDotPercent.toFixed(1)}% | IRIS: ${b.bowlingIRIS.toFixed(1)} | Clutch Rating: ${b.clutchRating.toFixed(1)}`
  )
  .join('\n')}

--- SECTION 3: CIRA METHODOLOGY & SITUATIONAL FACTORS ---
- Situational Pressure Index (PI): Dynamic RRR > 8.0, overs >= 15, low wickets in hand.
- Icon Anchor Collapse: 1.5x multiplier applied for 15 deliveries post top-scorer dismissal.
- Improbable Resilience Index (IRIS): Evaluates lost-cause boundary rates (RRR >= 18.0) and death-overs dot defense.
==========================================================`;

  // Generate Formatted JSON
  const jsonExportData = {
    competition: 'CIRA Cricket Analytics 2022-Present',
    generated_at: metadata.generatedAt,
    metadata: {
      matches_evaluated: metadata.matchesCount,
      deliveries_evaluated: metadata.deliveriesCount,
      high_pressure_deliveries: metadata.highPressureDeliveriesCount,
      anchor_collapses_tracked: metadata.anchorCollapsesDetected,
      lost_cause_deliveries: metadata.lostCauseDeliveriesCount,
      season_range: metadata.seasonRange,
      team_anchors: metadata.anchorPlayers,
    },
    top_10_batters: topBatters.map((b) => ({
      rank: b.rank,
      player_name: b.name,
      team: b.team,
      pressure_strike_rate: b.pressureStrikeRate,
      baseline_strike_rate: b.baselineStrikeRate,
      strike_rate_delta: b.strikeRateDifferential,
      anchor_collapse_strike_rate: b.collapseStrikeRate,
      pressure_boundary_percent: b.pressureBoundaryPercent,
      batting_iris_score: b.battingIRIS,
      clutch_rating: b.clutchRating,
      pressure_runs: b.pressureRuns,
      pressure_balls: b.pressureBalls,
      scouting_summary: b.scoutingReport,
    })),
    top_10_bowlers: topBowlers.map((b) => ({
      rank: b.rank,
      player_name: b.name,
      team: b.team,
      pressure_economy: b.pressureEconomy,
      baseline_economy: b.baselineEconomy,
      economy_delta: b.economyDifferential,
      dot_ball_percent: b.pressureDotPercent,
      extra_control_rate: b.extraControlRate,
      death_overs_economy: b.deathOversEconomy,
      bowling_iris_score: b.bowlingIRIS,
      clutch_rating: b.clutchRating,
      pressure_wickets: b.pressureWickets,
      pressure_overs: b.pressureOvers,
      scouting_summary: b.scoutingReport,
    })),
  };

  const jsonString = JSON.stringify(jsonExportData, null, 2);

  // Generate CSV Format
  const battersCsv = [
    'Rank,Player,Team,Pressure_SR,Baseline_SR,SR_Delta,Collapse_SR,Boundary_Pct,Batting_IRIS,Clutch_Rating',
    ...topBatters.map(
      (b) =>
        `${b.rank},"${b.name}","${b.team}",${b.pressureStrikeRate},${b.baselineStrikeRate},${b.strikeRateDifferential},${b.collapseStrikeRate},${b.pressureBoundaryPercent},${b.battingIRIS},${b.clutchRating}`
    ),
  ].join('\n');

  const bowlersCsv = [
    'Rank,Player,Team,Pressure_Econ,Baseline_Econ,Econ_Delta,Dot_Pct,Extra_Control_Rate,Bowling_IRIS,Clutch_Rating',
    ...topBowlers.map(
      (b) =>
        `${b.rank},"${b.name}","${b.team}",${b.pressureEconomy},${b.baselineEconomy},${b.economyDifferential},${b.pressureDotPercent},${b.extraControlRate},${b.bowlingIRIS},${b.clutchRating}`
    ),
  ].join('\n');

  const combinedCsv = `### TOP 10 BATTERS UNDER PRESSURE (2022+)\n${battersCsv}\n\n### TOP 10 BOWLERS UNDER PRESSURE (2022+)\n${bowlersCsv}`;

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#f59e0b', '#3b82f6'],
    });
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    triggerConfetti();
    setTimeout(() => setCopiedType(null), 3000);
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerConfetti();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Export Submission Artifacts
              </h2>
              <p className="text-xs text-slate-400">
                Formatted outputs ready for Unstop competition text boxes &amp; dropdowns
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

        {/* Quick Action Buttons */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Copy Unstop Text */}
            <button
              onClick={() => handleCopy(unstopFormattedText, 'text')}
              className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              {copiedType === 'text' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied for Unstop!</span>
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4" />
                  <span>Copy Unstop Text Form</span>
                </>
              )}
            </button>

            {/* Download JSON */}
            <button
              onClick={() =>
                downloadFile(jsonString, 'CIRA_Top10_Rankings_2022_2024.json', 'application/json')
              }
              className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Download Formatted JSON</span>
            </button>

            {/* Download CSV */}
            <button
              onClick={() =>
                downloadFile(combinedCsv, 'CIRA_Top10_Rankings_2022_2024.csv', 'text/csv')
              }
              className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Download Combined CSV</span>
            </button>
          </div>
        </div>

        {/* Live Preview Tabs */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActivePreview('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreview === 'text'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unstop Text Preview
              </button>
              <button
                onClick={() => setActivePreview('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreview === 'json'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON Schema Preview
              </button>
              <button
                onClick={() => setActivePreview('csv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreview === 'csv'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CSV Table Preview
              </button>
            </div>

            <button
              onClick={() => {
                const textToCopy =
                  activePreview === 'text'
                    ? unstopFormattedText
                    : activePreview === 'json'
                    ? jsonString
                    : combinedCsv;
                handleCopy(textToCopy, activePreview);
              }}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedType === activePreview ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy This Tab</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 h-80 overflow-y-auto">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {activePreview === 'text' && unstopFormattedText}
              {activePreview === 'json' && jsonString}
              {activePreview === 'csv' && combinedCsv}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
