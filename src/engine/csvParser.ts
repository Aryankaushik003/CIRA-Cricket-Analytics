import Papa from 'papaparse';
import JSZip from 'jszip';
import {
  RawBall,
  RawMatch,
  RawCompetition,
  RawPlayingEleven,
  RawTeamPlayerMapping,
} from '../types/cricket';

export interface ParsedFilesData {
  ballByBall: RawBall[];
  matches: RawMatch[];
  competitions: RawCompetition[];
  playingEleven: RawPlayingEleven[];
  mappings: RawTeamPlayerMapping[];
  errors: string[];
}

/**
 * Normalizes an object's keys to lowercase stripped strings for flexible lookup
 */
function normalizeRow(row: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    const k = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
    clean[k] = val;
  }
  return clean;
}

/**
 * Maps raw CSV row to RawBall
 */
export function mapRowToBall(row: Record<string, any>): RawBall {
  const c = normalizeRow(row);

  const matchId = c.matchid || c.id || c.match || '1';
  const season = c.season || c.year || '2022';
  const innings = Number(c.innings || c.inning || 1);
  const over = Number(c.over || c.overs || 0);
  const ball = Number(c.ball || c.ballnumber || c.delivery || 1);
  const batter = c.batter || c.batsman || c.striker || 'Unknown Batter';
  const bowler = c.bowler || 'Unknown Bowler';
  const nonStriker = c.nonstriker || c.nonstrikername;

  const runsBatter = Number(c.runsbatter || c.batsmanruns || c.runsoffbat || c.runs || 0);
  const extraRuns = Number(c.extraruns || c.extras || 0);
  const totalRuns = Number(c.totalruns || c.total || (runsBatter + extraRuns));

  const isWicketVal = c.iswicket || c.wicket || c.iswicketdelivery;
  const isWicket = Boolean(
    isWicketVal === true ||
    isWicketVal === 1 ||
    isWicketVal === '1' ||
    isWicketVal === 'true' ||
    Boolean(c.playerdismissed || c.dismissedplayer || c.wickettype)
  );

  const playerDismissed = c.playerdismissed || c.dismissedplayer || (isWicket ? batter : undefined);
  const dismissalKind = c.dismissalkind || c.wickettype || c.kind;
  const wides = Number(c.wides || c.wide || 0);
  const noballs = Number(c.noballs || c.noball || 0);
  const legbyes = Number(c.legbyes || c.legbye || 0);
  const byes = Number(c.byes || c.bye || 0);

  const battingTeam = c.battingteam || c.batteam || c.team1;
  const bowlingTeam = c.bowlingteam || c.bowlteam || c.team2;
  const targetRuns = c.targetruns ? Number(c.targetruns) : undefined;

  return {
    match_id: matchId,
    season,
    innings,
    over,
    ball,
    batter,
    bowler,
    non_striker: nonStriker,
    runs_batter: runsBatter,
    extra_runs: extraRuns,
    total_runs: totalRuns,
    is_wicket: isWicket ? 1 : 0,
    player_dismissed: playerDismissed,
    dismissal_kind: dismissalKind,
    wides,
    noballs,
    legbyes,
    byes,
    batting_team: battingTeam,
    bowling_team: bowlingTeam,
    target_runs: targetRuns,
  };
}

/**
 * Maps raw CSV row to RawMatch
 */
export function mapRowToMatch(row: Record<string, any>): RawMatch {
  const c = normalizeRow(row);
  return {
    match_id: c.matchid || c.id || c.match || '1',
    season: c.season || c.year || '2022',
    date: c.date || c.matchdate,
    team1: c.team1 || c.battingteam || 'Team 1',
    team2: c.team2 || c.bowlingteam || 'Team 2',
    toss_winner: c.tosswinner,
    toss_decision: c.tossdecision,
    winner: c.winner || c.winningteam,
    result: c.result,
    result_margin: c.resultmargin || c.margin,
    target_runs: c.targetruns ? Number(c.targetruns) : (c.target ? Number(c.target) : undefined),
    target_overs: c.targetovers ? Number(c.targetovers) : 20,
    venue: c.venue || c.ground || c.stadium,
    competition_id: c.competitionid || c.competition,
  };
}

/**
 * Maps raw CSV row to RawCompetition
 */
export function mapRowToCompetition(row: Record<string, any>): RawCompetition {
  const c = normalizeRow(row);
  return {
    competition_id: c.competitionid || c.id || c.competition || 'COMP',
    name: c.name || c.competitionname || c.title || 'Competition',
    season: c.season || c.year,
    type: c.type || c.matchtype || 'T20',
  };
}

/**
 * Maps raw CSV row to RawPlayingEleven
 */
export function mapRowToPlayingEleven(row: Record<string, any>): RawPlayingEleven {
  const c = normalizeRow(row);
  return {
    match_id: c.matchid || c.id || c.match || '1',
    team: c.team || c.teamname || 'Team',
    player_name: c.playername || c.player || c.name || 'Player',
    role: c.role || c.playerrole,
  };
}

/**
 * Maps raw CSV row to RawTeamPlayerMapping
 */
export function mapRowToMapping(row: Record<string, any>): RawTeamPlayerMapping {
  const c = normalizeRow(row);
  return {
    competition_id: c.competitionid || c.competition,
    team_name: c.teamname || c.team || 'Team',
    player_name: c.playername || c.player || c.name || 'Player',
    player_id: c.playerid || c.id,
  };
}

/**
 * Parse CSV text using PapaParse with Promise wrapper
 */
export function parseCsvText<T>(
  csvString: string,
  mapFn: (row: Record<string, any>) => T
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          const mapped = results.data.map(mapFn);
          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      },
      error: (err: any) => reject(err),
    });
  });
}

/**
 * Reads a File object as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Detect file type based on file name or columns
 */
export function detectFileType(
  fileName: string,
  headers: string[] = []
): 'ball_by_ball' | 'matches' | 'competitions' | 'playing_eleven' | 'competition_team_player_mapping' | 'unknown' {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes('ball') || lowerName.includes('delivery') || lowerName.includes('bbb')) {
    return 'ball_by_ball';
  }
  if (lowerName.includes('match') && !lowerName.includes('mapping')) {
    return 'matches';
  }
  if (lowerName.includes('competition') && (lowerName.includes('map') || lowerName.includes('team_player'))) {
    return 'competition_team_player_mapping';
  }
  if (lowerName.includes('comp')) {
    return 'competitions';
  }
  if (lowerName.includes('eleven') || lowerName.includes('xi') || lowerName.includes('lineup') || lowerName.includes('roster')) {
    return 'playing_eleven';
  }
  if (lowerName.includes('mapping')) {
    return 'competition_team_player_mapping';
  }

  // Fallback to headers
  const joinedHeaders = headers.map((h) => h.toLowerCase()).join(' ');
  if (joinedHeaders.includes('batter') || joinedHeaders.includes('batsman') || joinedHeaders.includes('bowler')) {
    return 'ball_by_ball';
  }
  if (joinedHeaders.includes('team1') && joinedHeaders.includes('team2')) {
    return 'matches';
  }
  if (joinedHeaders.includes('competition_id') && joinedHeaders.includes('team_name') && joinedHeaders.includes('player_name')) {
    return 'competition_team_player_mapping';
  }
  if (joinedHeaders.includes('playing_eleven') || (joinedHeaders.includes('match_id') && joinedHeaders.includes('role'))) {
    return 'playing_eleven';
  }

  return 'unknown';
}

/**
 * Unpacks a zip file and extracts all CSV files
 */
export async function unpackZipAndExtractCsvs(
  zipFile: File
): Promise<Map<string, string>> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const csvFilesMap = new Map<string, string>();

  for (const [filename, fileObj] of Object.entries(loadedZip.files)) {
    if (!fileObj.dir && filename.toLowerCase().endsWith('.csv')) {
      const text = await fileObj.async('text');
      csvFilesMap.set(filename, text);
    }
  }

  return csvFilesMap;
}
