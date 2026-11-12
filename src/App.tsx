import React, { useState, useEffect } from 'react';
import {
  Flame,
  Shield,
  UploadCloud,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Download,
  AlertCircle,
  Database,
  CheckCircle2,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import {
  RawBall,
  RawMatch,
  RawCompetition,
  RawPlayingEleven,
  RawTeamPlayerMapping,
  FileMetadata,
  CIRAResults,
  AlgorithmConfig,
  BatterClutchStats,
  BowlerClutchStats,
} from './types/cricket';

import { runCIRAEngine, DEFAULT_CONFIG } from './engine/ciraEngine';
import {
  parseCsvText,
  readFileAsText,
  detectFileType,
  unpackZipAndExtractCsvs,
  mapRowToBall,
  mapRowToMatch,
  mapRowToCompetition,
  mapRowToPlayingEleven,
  mapRowToMapping,
} from './engine/csvParser';
import { generateSampleDataset } from './engine/sampleDataGenerator';

import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { DataUploadZone } from './components/DataUploadZone';
import { BattersTable } from './components/BattersTable';
import { BowlersTable } from './components/BowlersTable';
import { PlayerDeepDiveModal } from './components/PlayerDeepDiveModal';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { ExportModal } from './components/ExportModal';

const INITIAL_FILES_META: Record<string, FileMetadata> = {
  ball_by_ball: { name: 'ball_by_ball.csv', loaded: false, rowsCount: 0, sizeBytes: 0, required: true },
  matches: { name: 'matches.csv', loaded: false, rowsCount: 0, sizeBytes: 0, required: true },
  competitions: { name: 'competitions.csv', loaded: false, rowsCount: 0, sizeBytes: 0, required: false },
  playing_eleven: { name: 'playing_eleven.csv', loaded: false, rowsCount: 0, sizeBytes: 0, required: false },
  competition_team_player_mapping: { name: 'competition_team_player_mapping.csv', loaded: false, rowsCount: 0, sizeBytes: 0, required: false },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'batters' | 'bowlers' | 'simulator' | 'files'>('batters');
  const [filesMeta, setFilesMeta] = useState<Record<string, FileMetadata>>(INITIAL_FILES_META);
  
  // Stored Parsed Records in State
  const [rawBalls, setRawBalls] = useState<RawBall[]>([]);
  const [rawMatches, setRawMatches] = useState<RawMatch[]>([]);
  const [rawCompetitions, setRawCompetitions] = useState<RawCompetition[]>([]);
  const [rawPlayingEleven, setRawPlayingEleven] = useState<RawPlayingEleven[]>([]);
  const [rawMappings, setRawMappings] = useState<RawTeamPlayerMapping[]>([]);

  // Computed Results
  const [results, setResults] = useState<CIRAResults | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<BatterClutchStats | BowlerClutchStats | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [config, setConfig] = useState<AlgorithmConfig>(DEFAULT_CONFIG);
  const [compFilter, setCompFilter] = useState<'all' | 'ipl' | 't20i'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRealDataActive, setIsRealDataActive] = useState(false);

  // Load real dataset on mount
  useEffect(() => {
    handleLoadRealData(false);
  }, []);

  const triggerCelebration = () => {
    confetti({
      particleCount: 45,
      spread: 75,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#f59e0b', '#3b82f6'],
    });
  };

  /**
   * Load and Process Real Competition Dataset from Backend
   */
  const handleLoadRealData = async (celebrate = true) => {
    setIsProcessing(true);
    setStatusMessage('Connecting to CIRA Backend Engine (Processing 200,999 Deliveries)...');
    setErrorMessage('');

    try {
      const response = await fetch('/api/process-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minYear: config.minYear,
          compFilter,
          minBatterBalls: config.minPressureBallsBatter,
          minBowlerBalls: config.minPressureBallsBowler,
          rrrThreshold: config.rrrHighPressureThreshold,
          anchorMultiplier: config.anchorCollapseMultiplier,
          lostCauseRrr: config.lostCauseRrrThreshold,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setIsRealDataActive(true);

      setFilesMeta({
        ball_by_ball: { name: 'ball_by_ball.csv', loaded: true, rowsCount: 200999, sizeBytes: 41071837, required: true },
        matches: { name: 'matches.csv', loaded: true, rowsCount: 883, sizeBytes: 123864, required: true },
        competitions: { name: 'competitions.csv', loaded: true, rowsCount: 141, sizeBytes: 7624, required: false },
        playing_eleven: { name: 'playing_eleven.csv', loaded: true, rowsCount: 28382, sizeBytes: 966287, required: false },
        competition_team_player_mapping: { name: 'competition_team_player_mapping.csv', loaded: true, rowsCount: 6414, sizeBytes: 462969, required: false },
      });

      setStatusMessage(`Real dataset loaded! Processed ${data.metadata.deliveriesCount.toLocaleString()} deliveries across ${data.metadata.matchesCount} matches.`);
      if (celebrate) {
        triggerCelebration();
      }
    } catch (err: any) {
      console.warn('Backend call failed, loading fallback sample dataset:', err);
      handleLoadSampleData(false);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Load Realistic 2022-2024 IPL Sample Dataset
   */
  const handleLoadSampleData = (celebrate = true) => {
    setIsProcessing(true);
    setStatusMessage('Generating realistic 2022-2024 IPL pressure dataset...');
    setErrorMessage('');
    setIsRealDataActive(false);

    setTimeout(() => {
      try {
        const bundle = generateSampleDataset();

        setRawBalls(bundle.balls);
        setRawMatches(bundle.matches);
        setRawCompetitions(bundle.competitions);
        setRawPlayingEleven(bundle.playingEleven);
        setRawMappings(bundle.mappings);

        setFilesMeta({
          ball_by_ball: { name: 'ball_by_ball.csv', loaded: true, rowsCount: bundle.balls.length, sizeBytes: 450000, required: true },
          matches: { name: 'matches.csv', loaded: true, rowsCount: bundle.matches.length, sizeBytes: 12000, required: true },
          competitions: { name: 'competitions.csv', loaded: true, rowsCount: bundle.competitions.length, sizeBytes: 1500, required: false },
          playing_eleven: { name: 'playing_eleven.csv', loaded: true, rowsCount: bundle.playingEleven.length, sizeBytes: 45000, required: false },
          competition_team_player_mapping: { name: 'competition_team_player_mapping.csv', loaded: true, rowsCount: bundle.mappings.length, sizeBytes: 8000, required: false },
        });

        const ciraRes = runCIRAEngine(
          bundle.balls,
          bundle.matches,
          bundle.competitions,
          bundle.playingEleven,
          bundle.mappings,
          config
        );

        setResults(ciraRes);
        setStatusMessage('Sample IPL dataset loaded successfully!');
        if (celebrate) {
          triggerCelebration();
        }
      } catch (err: any) {
        console.error('Error loading sample data:', err);
        setErrorMessage(`Failed to load sample dataset: ${err.message || err}`);
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  /**
   * Handle Multi-file or Zipped Upload
   */
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    setStatusMessage('Reading and categorizing uploaded files...');
    setErrorMessage('');

    try {
      const filesArray = Array.from(fileList);
      let extractedCsvMap = new Map<string, string>();

      for (const file of filesArray) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          setStatusMessage(`Extracting zipped archive: ${file.name}...`);
          const unzippedCsvs = await unpackZipAndExtractCsvs(file);
          unzippedCsvs.forEach((content, name) => {
            extractedCsvMap.set(name, content);
          });
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          const content = await readFileAsText(file);
          extractedCsvMap.set(file.name, content);
        }
      }

      if (extractedCsvMap.size === 0) {
        throw new Error('No valid CSV files detected in upload.');
      }

      setStatusMessage(`Parsing ${extractedCsvMap.size} cricket dataset files...`);

      let newBalls = [...rawBalls];
      let newMatches = [...rawMatches];
      let newCompetitions = [...rawCompetitions];
      let newPlayingEleven = [...rawPlayingEleven];
      let newMappings = [...rawMappings];
      const newFilesMeta = { ...filesMeta };

      for (const [filename, csvText] of extractedCsvMap.entries()) {
        const fileType = detectFileType(filename);

        if (fileType === 'ball_by_ball') {
          setStatusMessage(`Parsing ball-by-ball deliveries from ${filename}...`);
          const parsed = await parseCsvText(csvText, mapRowToBall);
          newBalls = parsed;
          newFilesMeta.ball_by_ball = {
            name: filename,
            loaded: true,
            rowsCount: parsed.length,
            sizeBytes: csvText.length,
            required: true,
          };
        } else if (fileType === 'matches') {
          setStatusMessage(`Parsing match fixtures and targets from ${filename}...`);
          const parsed = await parseCsvText(csvText, mapRowToMatch);
          newMatches = parsed;
          newFilesMeta.matches = {
            name: filename,
            loaded: true,
            rowsCount: parsed.length,
            sizeBytes: csvText.length,
            required: true,
          };
        } else if (fileType === 'competitions') {
          const parsed = await parseCsvText(csvText, mapRowToCompetition);
          newCompetitions = parsed;
          newFilesMeta.competitions = {
            name: filename,
            loaded: true,
            rowsCount: parsed.length,
            sizeBytes: csvText.length,
            required: false,
          };
        } else if (fileType === 'playing_eleven') {
          const parsed = await parseCsvText(csvText, mapRowToPlayingEleven);
          newPlayingEleven = parsed;
          newFilesMeta.playing_eleven = {
            name: filename,
            loaded: true,
            rowsCount: parsed.length,
            sizeBytes: csvText.length,
            required: false,
          };
        } else if (fileType === 'competition_team_player_mapping') {
          const parsed = await parseCsvText(csvText, mapRowToMapping);
          newMappings = parsed;
          newFilesMeta.competition_team_player_mapping = {
            name: filename,
            loaded: true,
            rowsCount: parsed.length,
            sizeBytes: csvText.length,
            required: false,
          };
        }
      }

      setRawBalls(newBalls);
      setRawMatches(newMatches);
      setRawCompetitions(newCompetitions);
      setRawPlayingEleven(newPlayingEleven);
      setRawMappings(newMappings);
      setFilesMeta(newFilesMeta);

      if (newBalls.length === 0) {
        throw new Error('Please ensure "ball_by_ball.csv" is included in your upload.');
      }

      setStatusMessage('Executing CIRA Engine (Pressure Index, Anchor Multipliers, IRIS)...');
      
      const ciraRes = runCIRAEngine(
        newBalls,
        newMatches,
        newCompetitions,
        newPlayingEleven,
        newMappings,
        config
      );

      setResults(ciraRes);
      setIsRealDataActive(false);
      setStatusMessage(`Analysis complete! Processed ${ciraRes.metadata.deliveriesCount.toLocaleString()} deliveries.`);
      triggerCelebration();
      setActiveTab('batters');
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(err.message || 'Error processing cricket CSV files.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Recalculate with updated config
   */
  const handleApplyConfig = () => {
    if (isRealDataActive) {
      handleLoadRealData(true);
      return;
    }
    if (rawBalls.length === 0) {
      setErrorMessage('Please upload datasets or load the sample data first.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Re-evaluating CIRA algorithms with updated weights...');

    setTimeout(() => {
      try {
        const ciraRes = runCIRAEngine(
          rawBalls,
          rawMatches,
          rawCompetitions,
          rawPlayingEleven,
          rawMappings,
          config
        );
        setResults(ciraRes);
        setStatusMessage('Rankings recalculated successfully!');
        triggerCelebration();
      } catch (err: any) {
        setErrorMessage(err.message || 'Error recalculating rankings.');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  /**
   * Handle Min Year Season Filter
   */
  const handleSetMinYear = (year: number) => {
    const updatedConfig = { ...config, minYear: year };
    setConfig(updatedConfig);
    if (isRealDataActive) {
      // Re-trigger backend
      setTimeout(() => handleLoadRealData(false), 50);
    } else if (rawBalls.length > 0) {
      const ciraRes = runCIRAEngine(
        rawBalls,
        rawMatches,
        rawCompetitions,
        rawPlayingEleven,
        rawMappings,
        updatedConfig
      );
      setResults(ciraRes);
    }
  };

  /**
   * Handle Competition Filter
   */
  const handleSetCompFilter = (filter: 'all' | 'ipl' | 't20i') => {
    setCompFilter(filter);
    if (isRealDataActive) {
      setTimeout(() => handleLoadRealData(false), 50);
    }
  };

  /**
   * Reset All
   */
  const handleReset = () => {
    setRawBalls([]);
    setRawMatches([]);
    setRawCompetitions([]);
    setRawPlayingEleven([]);
    setRawMappings([]);
    setFilesMeta(INITIAL_FILES_META);
    setResults(null);
    setSelectedPlayer(null);
    setStatusMessage('');
    setErrorMessage('');
    setIsRealDataActive(false);
    setActiveTab('files');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        minYear={config.minYear}
        setMinYear={handleSetMinYear}
        compFilter={compFilter}
        setCompFilter={handleSetCompFilter}
        onReset={handleReset}
        onOpenExport={() => setShowExportModal(true)}
        onLoadRealData={() => handleLoadRealData(true)}
        isProcessing={isProcessing}
        hasData={Boolean(results && results.topBatters.length > 0)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* High-Level Overview Metrics */}
        {results && <MetricCards results={results} />}

        {/* Tab 1: Top 10 Batters Under Pressure */}
        {activeTab === 'batters' && (
          <div>
            {results && results.topBatters.length > 0 ? (
              <BattersTable
                batters={results.topBatters}
                onSelectPlayer={(player) => setSelectedPlayer(player)}
              />
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
                <Flame className="w-12 h-12 text-amber-500/40 mx-auto" />
                <h3 className="text-base font-bold text-white">No Batters Ranked Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click below to process the uploaded 2022+ competition dataset.
                </p>
                <button
                  onClick={() => handleLoadRealData(true)}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                >
                  Process Real Data Pack
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Top 10 Bowlers Under Pressure */}
        {activeTab === 'bowlers' && (
          <div>
            {results && results.topBowlers.length > 0 ? (
              <BowlersTable
                bowlers={results.topBowlers}
                onSelectPlayer={(player) => setSelectedPlayer(player)}
              />
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
                <Shield className="w-12 h-12 text-cyan-500/40 mx-auto" />
                <h3 className="text-base font-bold text-white">No Bowlers Ranked Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click below to process the uploaded 2022+ competition dataset.
                </p>
                <button
                  onClick={() => handleLoadRealData(true)}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                >
                  Process Real Data Pack
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3 / Modal: Player Deep Dive Modal */}
        {selectedPlayer && (
          <PlayerDeepDiveModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}

        {/* Tab 4: CIRA Algorithm Inspector & Weights */}
        {activeTab === 'simulator' && (
          <ScenarioSimulator
            config={config}
            onChangeConfig={setConfig}
            onApplyConfig={handleApplyConfig}
            isProcessing={isProcessing}
          />
        )}

        {/* Tab 5: Data Management & Files Upload */}
        {activeTab === 'files' && (
          <DataUploadZone
            filesMeta={filesMeta}
            onFilesSelected={handleFilesSelected}
            onLoadSampleData={() => handleLoadSampleData(true)}
            onLoadRealData={() => handleLoadRealData(true)}
            isProcessing={isProcessing}
            statusMessage={statusMessage}
          />
        )}
      </main>

      {/* Submission Ready Export Modal */}
      {showExportModal && (
        <ExportModal
          results={results}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CIRA Engine v1.2 • Clutch-Index &amp; Improbable Resilience Analytics (2022+)
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            Algorithmic Engine Active &amp; Ready for Unstop Submission
          </span>
        </div>
      </footer>
    </div>
  );
}
