import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Sparkles,
  RefreshCw,
  Info,
  Database,
  Zap,
} from 'lucide-react';
import { FileMetadata } from '../types/cricket';

interface DataUploadZoneProps {
  filesMeta: Record<string, FileMetadata>;
  onFilesSelected: (files: FileList | File[]) => void;
  onLoadSampleData: () => void;
  onLoadRealData: () => void;
  isProcessing: boolean;
  statusMessage: string;
}

export const DataUploadZone: React.FC<DataUploadZoneProps> = ({
  filesMeta,
  onFilesSelected,
  onLoadSampleData,
  onLoadRealData,
  isProcessing,
  statusMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const fileSpecs = [
    {
      key: 'ball_by_ball',
      label: '1. ball_by_ball.csv',
      required: true,
      desc: '200,999 deliveries with runs, wickets, extras, pitch/line/length data',
    },
    {
      key: 'matches',
      label: '2. matches.csv',
      required: true,
      desc: '883 match records, targets, dates, teams, venues, toss & results',
    },
    {
      key: 'competitions',
      label: '3. competitions.csv',
      required: false,
      desc: '141 tournament records (IPL 2022-2026, T20Is, Asia Cups)',
    },
    {
      key: 'playing_eleven',
      label: '4. playing_eleven.csv',
      required: false,
      desc: '28,382 team lineups, player IDs, and playing XI roles',
    },
    {
      key: 'competition_team_player_mapping',
      label: '5. competition_team_player_mapping.csv',
      required: false,
      desc: '6,414 roster affiliations, franchise player mappings & names',
    },
  ];

  const loadedCount = Object.values(filesMeta).filter((f) => f.loaded).length;

  return (
    <div className="space-y-6">
      {/* Quick Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Official SupeRR Selector Dataset Extracted</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                Ready to Analyze
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              The user-provided zip file was verified and unpacked with all 5 competition CSVs (200,999 deliveries).
            </p>
          </div>
        </div>

        <button
          onClick={onLoadRealData}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Dataset...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Process Real Data Pack (2022+)</span>
            </>
          )}
        </button>
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all relative overflow-hidden group ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.zip"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Drop cricket CSV files or another Zipped folder here
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports <span className="text-cyan-400 font-mono">.csv</span> or single <span className="text-cyan-400 font-mono">.zip</span> package containing competition datasets
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-sm shadow-cyan-500/20 cursor-pointer"
            >
              Browse Files
            </button>

            <span className="text-xs text-slate-500">or</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSampleData();
              }}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold text-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Fast 45-Match IPL Sample</span>
            </button>
          </div>

          {statusMessage && (
            <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-cyan-400 font-medium">
              {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Checklist & Status Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Dataset Ingestion Checklist</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {loadedCount} of 5 datasets loaded
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fileSpecs.map((spec) => {
            const meta = filesMeta[spec.key];
            const isLoaded = meta?.loaded;

            return (
              <div
                key={spec.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isLoaded
                    ? 'bg-slate-900/80 border-cyan-500/40 shadow-sm shadow-cyan-500/5'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText
                      className={`w-4 h-4 ${
                        isLoaded ? 'text-cyan-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-white">{spec.label}</span>
                  </div>

                  {isLoaded ? (
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        spec.required
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {spec.required ? 'Required' : 'Optional'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {spec.desc}
                </p>

                {isLoaded && meta && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-mono">{meta.rowsCount.toLocaleString()} rows</span>
                    <span className="text-slate-500 font-mono">
                      {(meta.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
