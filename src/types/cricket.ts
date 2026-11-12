export interface RawBall {
  match_id: string | number;
  season?: string | number;
  innings: number;
  over: number;
  ball: number;
  batter: string;
  bowler: string;
  non_striker?: string;
  runs_batter: number;
  extra_runs: number;
  total_runs: number;
  is_wicket: boolean | number;
  player_dismissed?: string;
  dismissal_kind?: string;
  wides?: number;
  noballs?: number;
  legbyes?: number;
  byes?: number;
  batting_team?: string;
  bowling_team?: string;
  target_runs?: number;
}

export interface RawMatch {
  match_id: string | number;
  season: string | number;
  date?: string;
  team1: string;
  team2: string;
  toss_winner?: string;
  toss_decision?: string;
  winner?: string;
  result?: string;
  result_margin?: number | string;
  target_runs?: number;
  target_overs?: number;
  venue?: string;
  competition_id?: string | number;
}

export interface RawCompetition {
  competition_id: string | number;
  name: string;
  season?: string | number;
  type?: string;
}

export interface RawPlayingEleven {
  match_id: string | number;
  team: string;
  player_name: string;
  role?: string;
}

export interface RawTeamPlayerMapping {
  competition_id?: string | number;
  team_name: string;
  player_name: string;
  player_id?: string | number;
}

export interface UploadedFilesState {
  ball_by_ball: File | null;
  matches: File | null;
  competitions: File | null;
  playing_eleven: File | null;
  competition_team_player_mapping: File | null;
}

export interface FileMetadata {
  name: string;
  loaded: boolean;
  rowsCount: number;
  sizeBytes: number;
  required: boolean;
  error?: string;
}

export interface ProcessedDelivery {
  match_id: string | number;
  season: number;
  innings: number;
  over: number;
  ball: number;
  delivery_num: number;
  batting_team: string;
  bowling_team: string;
  batter: string;
  bowler: string;
  runs_batter: number;
  extra_runs: number;
  total_runs: number;
  is_wicket: boolean;
  player_dismissed?: string;
  dismissal_kind?: string;
  wides: number;
  noballs: number;
  
  // Dynamic Situational Attributes
  current_innings_runs: number;
  current_wickets_lost: number;
  balls_remaining: number;
  target_runs: number;
  runs_needed: number;
  dynamic_rrr: number;
  
  // CIRA Specific Flags & Multipliers
  is_chase: boolean;
  is_death_overs: boolean;
  is_collapse_active: boolean; // 15 balls following anchor dismissal
  is_lost_cause: boolean; // RRR >= 18.0 or extreme improbable win probability
  pressure_index: number; // Base situational PI
  effective_pressure_index: number; // After 1.5x anchor collapse multiplier
  is_high_pressure: boolean;
}

export interface BatterClutchStats {
  rank: number;
  name: string;
  team: string;
  totalRuns: number;
  totalBalls: number;
  baselineStrikeRate: number;
  
  // Pressure Specific Metrics
  pressureRuns: number;
  pressureBalls: number;
  pressureStrikeRate: number;
  pressureBoundaries: number; // 4s + 6s
  pressureBoundaryPercent: number;
  pressureDots: number;
  pressureDotPercent: number;
  
  // Anchor Collapse Performance (15-ball window with 1.5x)
  collapseRuns: number;
  collapseBalls: number;
  collapseStrikeRate: number;
  
  // Improbable Resilience Index (IRIS)
  lostCauseRuns: number;
  lostCauseBalls: number;
  lostCauseStrikeRate: number;
  lostCauseBoundaryRate: number;
  battingIRIS: number; // 0 - 100
  
  // Overall Rating
  strikeRateDifferential: number; // pressureSR - baselineSR
  clutchRating: number; // 0 - 100
  
  // Radar data points (normalized 0 - 100)
  radarData: {
    metric: string;
    baseline: number;
    pressure: number;
  }[];
  
  scoutingReport: string;
}

export interface BowlerClutchStats {
  rank: number;
  name: string;
  team: string;
  totalBalls: number;
  totalRunsConceded: number;
  baselineEconomy: number;
  
  // Pressure Specific Metrics
  pressureBalls: number;
  pressureOvers: number;
  pressureRunsConceded: number;
  pressureWickets: number;
  pressureEconomy: number;
  pressureDots: number;
  pressureDotPercent: number;
  pressureExtras: number; // wides + no-balls
  extraControlRate: number; // percentage of legal balls (1 - extras/balls)
  
  // Defending Low Totals & Death
  deathOversBalls: number;
  deathOversRunsConceded: number;
  deathOversEconomy: number;
  deathOversWickets: number;
  bowlingIRIS: number; // 0 - 100
  
  // Overall Rating
  economyDifferential: number; // baselineEcon - pressureEcon (positive is great)
  clutchRating: number; // 0 - 100
  
  radarData: {
    metric: string;
    baseline: number;
    pressure: number;
  }[];
  
  scoutingReport: string;
}

export interface CIRAResults {
  topBatters: BatterClutchStats[];
  topBowlers: BowlerClutchStats[];
  allBatters: BatterClutchStats[];
  allBowlers: BowlerClutchStats[];
  metadata: {
    matchesCount: number;
    deliveriesCount: number;
    highPressureDeliveriesCount: number;
    anchorCollapsesDetected: number;
    lostCauseDeliveriesCount: number;
    seasonRange: string;
    generatedAt: string;
    anchorPlayers: Record<string, string>; // team -> anchor player name
  };
}

export interface AlgorithmConfig {
  minYear: number;
  minPressureBallsBatter: number;
  minPressureBallsBowler: number;
  rrrHighPressureThreshold: number; // default 8.0
  anchorCollapseMultiplier: number; // default 1.5
  anchorWindowBalls: number; // default 15
  lostCauseRrrThreshold: number; // default 18.0
}
