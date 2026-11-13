import {
  RawBall,
  RawMatch,
  RawCompetition,
  RawPlayingEleven,
  RawTeamPlayerMapping,
  ProcessedDelivery,
  BatterClutchStats,
  BowlerClutchStats,
  CIRAResults,
  AlgorithmConfig,
} from '../types/cricket';

export const DEFAULT_CONFIG: AlgorithmConfig = {
  minYear: 2022,
  minPressureBallsBatter: 40,
  minPressureBallsBowler: 36,
  rrrHighPressureThreshold: 8.0,
  anchorCollapseMultiplier: 1.5,
  anchorWindowBalls: 15,
  lostCauseRrrThreshold: 18.0,
  excludeRetained: true,
};

const PAKISTANI_EXCLUDED_PLAYERS = new Set([
  'babar azam', 'mohammad rizwan', 'fakhar zaman', 'iftikhar ahmed', 'khushdil shah',
  'shadab khan', 'asif ali', 'mohammad nawaz', 'haris rauf', 'naseem shah',
  'shahnawaz dhani', 'mohammad hasnain', 'hasan ali', 'usman qadir', 'haider ali',
  'shan masood', 'mohammad wasim', 'aamer jamal', 'mohammad haris', 'saim ayub',
  'abdullah shafique', 'tayyab tahir', 'imad wasim', 'azam khan', 'faheem ashraf',
  'zaman khan', 'ihsanullah ihsanullah', 'shaheen afridi', 'abbas afridi', 'usama mir',
  'sahibzada farhan', 'haseebullah khan', 'mohammad amir', 'abrar ahmed', 'usman khan',
  'muhammad irfan', 'mohammad jnr', 'sufiyan muqeem', 'arafat minhas', 'qasim akram',
  'omair yousuf', 'yasir khan', 'rohail nazir', 'ahmed daniyal', 'salman agha',
  'jahandad khan', 'hasan nawaz', 'mohammad ali', 'salman mirza', 'hussain talat',
  'usman tariq', 'mohammad naeem', 'maaz sadaqat', 'mohammad faiq', 'saad masood',
  'mohammad salman', 'ubaid shah', 'mubasir khan', 'shahid aziz', 'muhammad shehzad',
  'ghazi ghouri', 'khawaja nafay', 'mohammad imran randhawa', 'razaullah razaullah'
]);

export const RETAINED_CORE_STALWARTS = new Set([
  'jasprit bumrah', 'sunil narine', 'virat kohli', 'rohit sharma', 'suryakumar yadav',
  'ms dhoni', 'mahendra singh dhoni', 'ruturaj gaikwad', 'ravindra jadeja',
  'yashasvi jaiswal', 'riyan parag', 'dhruv jurel', 'arshdeep singh', 'axar patel',
  'kuldeep yadav', 'rajat patidar', 'shivam dube', 'devon conway', 'mukesh choudhary',
  'prabhsimran singh', 'harpreet brar', 'namboori tilak varma', 'tilak varma', 'naman dhir',
  'andre russell'
]);

function isExcludedPakistanPlayer(name: string, team: string): boolean {
  if (team && team.toLowerCase().includes('pakistan')) return true;
  if (PAKISTANI_EXCLUDED_PLAYERS.has(name.toLowerCase())) return true;
  return false;
}

export function isFranchiseRetainedStalwart(name: string, dynamicRetainedSet?: Set<string>): boolean {
  const lower = name.toLowerCase().trim();
  if (dynamicRetainedSet && dynamicRetainedSet.has(lower)) return true;
  if (RETAINED_CORE_STALWARTS.has(lower)) return true;
  return false;
}



/**
 * Normalizes text/name to title case or trimmed string
 */
function cleanName(name: string | undefined): string {
  if (!name) return 'Unknown Player';
  return name.trim();
}

/**
 * Safely parses integer or float
 */
function safeNum(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

/**
 * Extract year from season or date field
 */
function extractYear(season: any, date: any): number {
  if (season) {
    const sStr = String(season);
    const m = sStr.match(/\d{4}/);
    if (m) return parseInt(m[0], 10);
  }
  if (date) {
    const dStr = String(date);
    const m = dStr.match(/\d{4}/);
    if (m) return parseInt(m[0], 10);
  }
  return 2022; // default fallback
}

/**
 * Determine primary anchor / icon player for each team per season
 * Formula: Highest total runs scored across all matches in that season
 */
export function identifyAnchorPlayers(
  rawBalls: RawBall[],
  matchSeasonMap: Map<string | number, number>
): { teamSeasonAnchors: Map<string, string>; teamDisplayAnchors: Record<string, string> } {
  // Key: `${team}_${season}` -> Map<batter, runs>
  const runsMap = new Map<string, Map<string, number>>();

  for (const b of rawBalls) {
    const matchId = b.match_id;
    const season = matchSeasonMap.get(matchId) || extractYear(b.season, null);
    const team = cleanName(b.batting_team || 'Unknown');
    const batter = cleanName(b.batter);
    const runs = safeNum(b.runs_batter);

    const key = `${team}_${season}`;
    if (!runsMap.has(key)) {
      runsMap.set(key, new Map<string, number>());
    }
    const batterRuns = runsMap.get(key)!;
    batterRuns.set(batter, (batterRuns.get(batter) || 0) + runs);
  }

  const teamSeasonAnchors = new Map<string, string>();
  const teamDisplayAnchors: Record<string, string> = {};

  for (const [key, batterMap] of runsMap.entries()) {
    let topBatter = '';
    let maxRuns = -1;
    for (const [batter, runs] of batterMap.entries()) {
      if (runs > maxRuns) {
        maxRuns = runs;
        topBatter = batter;
      }
    }
    if (topBatter) {
      teamSeasonAnchors.set(key, topBatter);
      const team = key.split('_')[0];
      teamDisplayAnchors[team] = topBatter;
    }
  }

  return { teamSeasonAnchors, teamDisplayAnchors };
}

/**
 * Map player to their primary team
 */
export function buildPlayerTeamMap(
  rawBalls: RawBall[],
  mappings?: RawTeamPlayerMapping[],
  playingElevens?: RawPlayingEleven[]
): Map<string, string> {
  const playerTeams = new Map<string, string>();

  // Check explicit mappings first
  if (mappings) {
    for (const m of mappings) {
      if (m.player_name && m.team_name) {
        playerTeams.set(cleanName(m.player_name), cleanName(m.team_name));
      }
    }
  }

  // Check playing eleven
  if (playingElevens) {
    for (const p of playingElevens) {
      if (p.player_name && p.team) {
        playerTeams.set(cleanName(p.player_name), cleanName(p.team));
      }
    }
  }

  // Fallback to ball-by-ball appearances
  for (const b of rawBalls) {
    if (b.batter && b.batting_team && !playerTeams.has(cleanName(b.batter))) {
      playerTeams.set(cleanName(b.batter), cleanName(b.batting_team));
    }
    if (b.bowler && b.bowling_team && !playerTeams.has(cleanName(b.bowler))) {
      playerTeams.set(cleanName(b.bowler), cleanName(b.bowling_team));
    }
  }

  return playerTeams;
}

/**
 * Main CIRA Algorithm Processor
 */
export function runCIRAEngine(
  rawBalls: RawBall[],
  rawMatches: RawMatch[] = [],
  rawCompetitions: RawCompetition[] = [],
  rawPlayingEleven: RawPlayingEleven[] = [],
  rawMappings: RawTeamPlayerMapping[] = [],
  config: AlgorithmConfig = DEFAULT_CONFIG
): CIRAResults {
  // Step 1: Index matches by ID and filter matches >= minYear
  const matchMap = new Map<string | number, RawMatch>();
  const matchSeasonMap = new Map<string | number, number>();
  const matchTargetMap = new Map<string | number, number>();

  for (const m of rawMatches) {
    const year = extractYear(m.season, m.date);
    matchMap.set(m.match_id, m);
    matchSeasonMap.set(m.match_id, year);
    if (m.target_runs) {
      matchTargetMap.set(m.match_id, safeNum(m.target_runs));
    }
  }

  // If match target is not explicitly in match row, pre-compute from 1st innings total
  const firstInningsTotals = new Map<string | number, number>();
  for (const b of rawBalls) {
    if (safeNum(b.innings) === 1) {
      const current = firstInningsTotals.get(b.match_id) || 0;
      firstInningsTotals.set(b.match_id, current + safeNum(b.total_runs));
    }
  }

  // Step 2: Build anchor players dictionary per team & season
  const { teamSeasonAnchors, teamDisplayAnchors } = identifyAnchorPlayers(rawBalls, matchSeasonMap);
  const playerTeamMap = buildPlayerTeamMap(rawBalls, rawMappings, rawPlayingEleven);

  // Multi-Season Franchise Loyalty Check:
  const iplPlayerSeasons = new Map<string, { teams: Set<string>; seasons: Set<string> }>();
  for (const m of rawMappings) {
    if (!m.player_name) continue;
    const pName = cleanName(m.player_name).toLowerCase();
    const teamName = cleanName(m.team_name);
    const comp = rawCompetitions.find((c) => String(c.competition_id) === String(m.competition_id));
    const compName = comp ? comp.name : String(m.competition_id || '');
    if (
      compName.toUpperCase().includes('IPL') ||
      teamName.includes('Indians') ||
      teamName.includes('Super Kings') ||
      teamName.includes('Riders') ||
      teamName.includes('Royals') ||
      teamName.includes('Challengers') ||
      teamName.includes('Capitals') ||
      teamName.includes('Kings') ||
      teamName.includes('Titans') ||
      teamName.includes('Super Giants') ||
      teamName.includes('Sunrisers')
    ) {
      if (!iplPlayerSeasons.has(pName)) {
        iplPlayerSeasons.set(pName, { teams: new Set(), seasons: new Set() });
      }
      const data = iplPlayerSeasons.get(pName)!;
      data.teams.add(teamName);
      data.seasons.add(compName || String(comp?.season || 'season'));
    }
  }

  const dynamicRetainedSet = new Set<string>();
  for (const [name, data] of iplPlayerSeasons.entries()) {
    if (data.teams.size === 1 && data.seasons.size >= 3) {
      dynamicRetainedSet.add(name);
    }
  }

  // Step 3: Group deliveries by match and innings to compute dynamic game state
  // Key: `${match_id}_${innings}` -> RawBall[]
  const inningsDeliveriesMap = new Map<string, RawBall[]>();
  for (const b of rawBalls) {
    const key = `${b.match_id}_${b.innings}`;
    if (!inningsDeliveriesMap.has(key)) {
      inningsDeliveriesMap.set(key, []);
    }
    inningsDeliveriesMap.get(key)!.push(b);
  }

  const processedDeliveries: ProcessedDelivery[] = [];
  let totalCollapsesDetected = 0;
  let highPressureCount = 0;
  let lostCauseCount = 0;

  // Step 4: Process dynamic situational RRR, Anchor dismissal, and IRIS per delivery
  for (const [key, balls] of inningsDeliveriesMap.entries()) {
    const [matchIdStr, inningsStr] = key.split('_');
    const inningsNum = safeNum(inningsStr, 1);
    const matchId = isNaN(Number(matchIdStr)) ? matchIdStr : Number(matchIdStr);
    const seasonYear = matchSeasonMap.get(matchId) || extractYear(balls[0]?.season, null);

    // Apply Year Filter (2022 onwards)
    if (seasonYear < config.minYear) {
      continue;
    }

    const isChase = inningsNum >= 2;
    let targetRuns = matchTargetMap.get(matchId) || 0;
    if (isChase && (!targetRuns || targetRuns <= 0)) {
      const inn1Total = firstInningsTotals.get(matchId) || 160;
      targetRuns = inn1Total + 1;
    }

    const battingTeam = cleanName(balls[0]?.batting_team || 'Team A');
    const bowlingTeam = cleanName(balls[0]?.bowling_team || 'Team B');
    const anchorPlayer = teamSeasonAnchors.get(`${battingTeam}_${seasonYear}`) || '';

    let currentInningsRuns = 0;
    let currentWicketsLost = 0;
    let legalBallsCount = 0;

    // Anchor collapse tracker
    let anchorDismissedBall = -1; // delivery index when anchor got out
    let collapseDeliveriesRemaining = 0;

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      const runsBatter = safeNum(b.runs_batter);
      const extraRuns = safeNum(b.extra_runs);
      const totalRuns = safeNum(b.total_runs) || (runsBatter + extraRuns);
      const wides = safeNum(b.wides);
      const noballs = safeNum(b.noballs);
      const isLegal = wides === 0 && noballs === 0;

      if (isLegal) {
        legalBallsCount++;
      }

      currentInningsRuns += totalRuns;
      const isWicket = Boolean(b.is_wicket && String(b.is_wicket) !== '0');
      const dismissedPlayer = cleanName(b.player_dismissed || (isWicket ? b.batter : ''));

      if (isWicket) {
        currentWicketsLost++;
        // Check if the dismissed batter is the anchor player
        if (anchorPlayer && dismissedPlayer.toLowerCase() === anchorPlayer.toLowerCase()) {
          anchorDismissedBall = i;
          collapseDeliveriesRemaining = config.anchorWindowBalls;
          totalCollapsesDetected++;
        }
      }

      // Check if this delivery falls inside the 15-ball collapse window
      let isCollapseActive = false;
      if (collapseDeliveriesRemaining > 0 && i > anchorDismissedBall) {
        isCollapseActive = true;
        collapseDeliveriesRemaining--;
      }

      const overNum = safeNum(b.over);
      const isDeathOvers = overNum >= 15; // death overs 16 to 20
      const ballsRemaining = Math.max(1, 120 - legalBallsCount);
      const runsNeeded = isChase ? Math.max(0, targetRuns - currentInningsRuns) : 0;
      const dynamicRRR = isChase ? (runsNeeded / ballsRemaining) * 6 : 0;

      // Improbable / Lost-Cause Situation
      const isLostCause = isChase && (
        dynamicRRR >= config.lostCauseRrrThreshold ||
        (runsNeeded >= 48 && ballsRemaining <= 18) ||
        (currentWicketsLost >= 8 && dynamicRRR >= 12.0)
      );
      if (isLostCause) lostCauseCount++;

      // Situational Pressure Index (PI) Calculation
      let pi = 1.0;

      if (isDeathOvers) {
        pi += 0.50;
      }

      if (isChase) {
        if (dynamicRRR > config.rrrHighPressureThreshold) {
          const rrrDelta = dynamicRRR - config.rrrHighPressureThreshold;
          pi += Math.min(1.5, rrrDelta * 0.15);
        }
        if (dynamicRRR >= 12.0) pi += 0.35;
        if (dynamicRRR >= 16.0) pi += 0.45;
      } else {
        // 1st innings early collapse pressure
        if (overNum < 10 && currentWicketsLost >= 4) {
          pi += 0.60;
        }
      }

      if (currentWicketsLost >= 6) {
        pi += 0.40;
      }
      if (currentWicketsLost >= 8) {
        pi += 0.30;
      }

      // Anchor Collapse 1.5x Multiplier
      let effectivePI = pi;
      if (isCollapseActive) {
        effectivePI = pi * config.anchorCollapseMultiplier;
      }

      const isHighPressure = (
        effectivePI >= 1.45 ||
        (isChase && dynamicRRR > config.rrrHighPressureThreshold) ||
        isDeathOvers ||
        currentWicketsLost >= 6 ||
        isCollapseActive
      );

      if (isHighPressure) highPressureCount++;

      processedDeliveries.push({
        match_id: matchId,
        season: seasonYear,
        innings: inningsNum,
        over: overNum,
        ball: safeNum(b.ball),
        delivery_num: i + 1,
        batting_team: battingTeam,
        bowling_team: bowlingTeam,
        batter: cleanName(b.batter),
        bowler: cleanName(b.bowler),
        runs_batter: runsBatter,
        extra_runs: extraRuns,
        total_runs: totalRuns,
        is_wicket: isWicket,
        player_dismissed: dismissedPlayer,
        dismissal_kind: b.dismissal_kind,
        wides,
        noballs,
        current_innings_runs: currentInningsRuns,
        current_wickets_lost: currentWicketsLost,
        balls_remaining: ballsRemaining,
        target_runs: targetRuns,
        runs_needed: runsNeeded,
        dynamic_rrr: Number(dynamicRRR.toFixed(2)),
        is_chase: isChase,
        is_death_overs: isDeathOvers,
        is_collapse_active: isCollapseActive,
        is_lost_cause: isLostCause,
        pressure_index: Number(pi.toFixed(2)),
        effective_pressure_index: Number(effectivePI.toFixed(2)),
        is_high_pressure: isHighPressure,
      });
    }
  }

  // Step 5: Aggregate Batter Statistics & Compute CIRA Clutch Rating + IRIS
  const batterMap = new Map<string, {
    totalRuns: number;
    totalBalls: number;
    pressureRuns: number;
    pressureBalls: number;
    pressureFours: number;
    pressureSixes: number;
    pressureDots: number;
    collapseRuns: number;
    collapseBalls: number;
    lostCauseRuns: number;
    lostCauseBalls: number;
    lostCauseBoundaries: number;
    lostCauseDots: number;
    team: string;
  }>();

  for (const d of processedDeliveries) {
    const batter = d.batter;
    if (!batterMap.has(batter)) {
      batterMap.set(batter, {
        totalRuns: 0,
        totalBalls: 0,
        pressureRuns: 0,
        pressureBalls: 0,
        pressureFours: 0,
        pressureSixes: 0,
        pressureDots: 0,
        collapseRuns: 0,
        collapseBalls: 0,
        lostCauseRuns: 0,
        lostCauseBalls: 0,
        lostCauseBoundaries: 0,
        lostCauseDots: 0,
        team: playerTeamMap.get(batter) || d.batting_team,
      });
    }

    const bStat = batterMap.get(batter)!;
    // Wides do not count as ball faced by batter
    if (d.wides === 0) {
      bStat.totalBalls++;
      bStat.totalRuns += d.runs_batter;

      if (d.is_high_pressure) {
        bStat.pressureBalls++;
        bStat.pressureRuns += d.runs_batter;
        if (d.runs_batter === 4) bStat.pressureFours++;
        if (d.runs_batter === 6) bStat.pressureSixes++;
        if (d.runs_batter === 0) bStat.pressureDots++;
      }

      if (d.is_collapse_active) {
        bStat.collapseBalls++;
        bStat.collapseRuns += d.runs_batter;
      }

      if (d.is_lost_cause) {
        bStat.lostCauseBalls++;
        bStat.lostCauseRuns += d.runs_batter;
        if (d.runs_batter >= 4) bStat.lostCauseBoundaries++;
        if (d.runs_batter === 0) bStat.lostCauseDots++;
      }
    }
  }

  // Step 6: Aggregate Bowler Statistics & Compute CIRA Clutch Rating + IRIS
  const bowlerMap = new Map<string, {
    totalBalls: number;
    totalRunsConceded: number;
    pressureBalls: number;
    pressureRunsConceded: number;
    pressureWickets: number;
    pressureDots: number;
    pressureExtras: number;
    deathBalls: number;
    deathRunsConceded: number;
    deathWickets: number;
    deathDots: number;
    deathExtras: number;
    lowTotalBalls: number;
    lowTotalRuns: number;
    lowTotalDots: number;
    team: string;
  }>();

  for (const d of processedDeliveries) {
    const bowler = d.bowler;
    if (!bowlerMap.has(bowler)) {
      bowlerMap.set(bowler, {
        totalBalls: 0,
        totalRunsConceded: 0,
        pressureBalls: 0,
        pressureRunsConceded: 0,
        pressureWickets: 0,
        pressureDots: 0,
        pressureExtras: 0,
        deathBalls: 0,
        deathRunsConceded: 0,
        deathWickets: 0,
        deathDots: 0,
        deathExtras: 0,
        lowTotalBalls: 0,
        lowTotalRuns: 0,
        lowTotalDots: 0,
        team: playerTeamMap.get(bowler) || d.bowling_team,
      });
    }

    const boStat = bowlerMap.get(bowler)!;
    boStat.totalBalls++;
    // Runs conceded by bowler = runs_batter + wides + noballs (legbyes and byes are not bowler's fault)
    const bowlerConceded = d.runs_batter + d.wides + d.noballs;
    boStat.totalRunsConceded += bowlerConceded;

    const isExtra = d.wides > 0 || d.noballs > 0;
    const isDot = d.total_runs === 0;

    if (d.is_high_pressure) {
      boStat.pressureBalls++;
      boStat.pressureRunsConceded += bowlerConceded;
      if (d.is_wicket && d.dismissal_kind !== 'run out') {
        boStat.pressureWickets++;
      }
      if (isDot) boStat.pressureDots++;
      if (isExtra) boStat.pressureExtras++;
    }

    if (d.is_death_overs) {
      boStat.deathBalls++;
      boStat.deathRunsConceded += bowlerConceded;
      if (d.is_wicket && d.dismissal_kind !== 'run out') {
        boStat.deathWickets++;
      }
      if (isDot) boStat.deathDots++;
      if (isExtra) boStat.deathExtras++;
    }

    // Low target defense scenario (<= 160)
    if (d.target_runs > 0 && d.target_runs <= 160 && d.is_chase) {
      boStat.lowTotalBalls++;
      boStat.lowTotalRuns += bowlerConceded;
      if (isDot) boStat.lowTotalDots++;
    }
  }

  // Step 7: Score Batters
  const allBatters: BatterClutchStats[] = [];
  for (const [name, s] of batterMap.entries()) {
    if (s.totalBalls < 10) continue; // Minimum activity filter
    if (isExcludedPakistanPlayer(name, s.team)) continue; // IPL Auction Eligibility Rule

    const baselineSR = s.totalBalls > 0 ? (s.totalRuns / s.totalBalls) * 100 : 0;
    const pressureSR = s.pressureBalls > 0 ? (s.pressureRuns / s.pressureBalls) * 100 : baselineSR;
    const pressureBoundaries = s.pressureFours + s.pressureSixes;
    const boundaryPct = s.pressureBalls > 0 ? (pressureBoundaries / s.pressureBalls) * 100 : 0;
    const dotPct = s.pressureBalls > 0 ? (s.pressureDots / s.pressureBalls) * 100 : 0;
    const collapseSR = s.collapseBalls > 0 ? (s.collapseRuns / s.collapseBalls) * 100 : pressureSR;

    // Batting IRIS calculation
    // Rewards boundary rate & intent under lost-cause/impossible odds
    let battingIRIS = 50.0;
    if (s.lostCauseBalls >= 5) {
      const lcBoundaryRate = (s.lostCauseBoundaries / s.lostCauseBalls) * 100;
      const lcSR = (s.lostCauseRuns / s.lostCauseBalls) * 100;
      const lcDotAversion = Math.max(0, 100 - (s.lostCauseDots / s.lostCauseBalls) * 100);
      battingIRIS = (lcBoundaryRate * 0.45) + (Math.min(250, lcSR) * 0.20) + (lcDotAversion * 0.35);
    } else {
      // Proxy from pressure boundary % and SR if limited lost cause balls
      battingIRIS = (boundaryPct * 1.5) + (Math.min(220, pressureSR) * 0.22);
    }
    battingIRIS = Math.min(99.4, Math.max(35.0, Number(battingIRIS.toFixed(1))));

    // Composite Clutch Rating (70 - 99 scale)
    // Factors: Pressure SR (weighted), Boundary %, Post-Collapse SR, Batting IRIS, Volume
    const srScore = Math.min(100, (pressureSR / 220) * 100);
    const bndScore = Math.min(100, (boundaryPct / 35) * 100);
    const colScore = Math.min(100, (collapseSR / 200) * 100);
    const irisScore = battingIRIS;
    const volBonus = Math.min(10, Math.log10(s.pressureBalls + 1) * 3);

    const rawClutch = (srScore * 0.32) + (bndScore * 0.22) + (colScore * 0.18) + (irisScore * 0.20) + volBonus;
    const clutchRating = Number(Math.min(98.8, Math.max(62.0, rawClutch)).toFixed(1));

    // Radar normalized metrics (0 - 100)
    const radarData = [
      { metric: 'Strike Rate', baseline: Math.min(100, (baselineSR / 200) * 100), pressure: Math.min(100, (pressureSR / 220) * 100) },
      { metric: 'Boundary Intent', baseline: Math.min(100, ((s.totalRuns * 0.15) / Math.max(1, s.totalBalls)) * 150), pressure: Math.min(100, boundaryPct * 3.2) },
      { metric: 'Dot Aversion', baseline: 65, pressure: Math.max(20, 100 - dotPct * 1.6) },
      { metric: 'Collapse Resil.', baseline: 55, pressure: Math.min(100, (collapseSR / 200) * 100) },
      { metric: 'Lost Cause IRIS', baseline: 50, pressure: battingIRIS },
      { metric: 'Pressure Longevity', baseline: 60, pressure: Math.min(100, (s.pressureBalls / 150) * 100) },
    ];

    const srDiff = Number((pressureSR - baselineSR).toFixed(1));

    // Auto-generate scouting report
    const scoutingReport = generateBatterScoutingReport(
      name,
      s.team,
      pressureSR,
      baselineSR,
      boundaryPct,
      collapseSR,
      battingIRIS,
      clutchRating
    );

    const isRetained = isFranchiseRetainedStalwart(name, dynamicRetainedSet);
    const marketStatus: 'Retained Core' | 'Auction Targetable' = isRetained ? 'Retained Core' : 'Auction Targetable';

    allBatters.push({
      rank: 0,
      name,
      team: s.team,
      isRetained,
      marketStatus,
      totalRuns: s.totalRuns,
      totalBalls: s.totalBalls,
      baselineStrikeRate: Number(baselineSR.toFixed(1)),
      pressureRuns: s.pressureRuns,
      pressureBalls: s.pressureBalls,
      pressureStrikeRate: Number(pressureSR.toFixed(1)),
      pressureBoundaries,
      pressureBoundaryPercent: Number(boundaryPct.toFixed(1)),
      pressureDots: s.pressureDots,
      pressureDotPercent: Number(dotPct.toFixed(1)),
      collapseRuns: s.collapseRuns,
      collapseBalls: s.collapseBalls,
      collapseStrikeRate: Number(collapseSR.toFixed(1)),
      lostCauseRuns: s.lostCauseRuns,
      lostCauseBalls: s.lostCauseBalls,
      lostCauseStrikeRate: Number((s.lostCauseBalls > 0 ? (s.lostCauseRuns / s.lostCauseBalls) * 100 : 0).toFixed(1)),
      lostCauseBoundaryRate: Number((s.lostCauseBalls > 0 ? (s.lostCauseBoundaries / s.lostCauseBalls) * 100 : 0).toFixed(1)),
      battingIRIS,
      strikeRateDifferential: srDiff,
      clutchRating,
      radarData,
      scoutingReport,
    });
  }

  // Filter top qualified batters
  let qualifiedBatters = allBatters.filter((b) => b.pressureBalls >= config.minPressureBallsBatter);
  if (config.excludeRetained) {
    qualifiedBatters = qualifiedBatters.filter((b) => !b.isRetained);
  }
  const candidateBatters = qualifiedBatters.length >= 10
    ? qualifiedBatters
    : allBatters.filter((b) => !config.excludeRetained || !b.isRetained);
  candidateBatters.sort((a, b) => b.clutchRating - a.clutchRating || b.pressureStrikeRate - a.pressureStrikeRate);
  candidateBatters.forEach((b, idx) => {
    b.rank = idx + 1;
  });
  const topBatters = candidateBatters.slice(0, 10);

  // Step 8: Score Bowlers
  const allBowlers: BowlerClutchStats[] = [];
  for (const [name, s] of bowlerMap.entries()) {
    if (s.totalBalls < 18) continue; // Minimum 3 overs
    if (isExcludedPakistanPlayer(name, s.team)) continue; // IPL Auction Eligibility Rule

    const baselineEcon = s.totalBalls > 0 ? (s.totalRunsConceded / (s.totalBalls / 6)) : 8.5;
    const pressureOvers = s.pressureBalls / 6;
    const pressureEcon = pressureOvers > 0 ? s.pressureRunsConceded / pressureOvers : baselineEcon;
    const dotPct = s.pressureBalls > 0 ? (s.pressureDots / s.pressureBalls) * 100 : 0;
    const extraControlRate = s.pressureBalls > 0 ? Math.max(0, (1 - s.pressureExtras / s.pressureBalls) * 100) : 95.0;

    const deathOvers = s.deathBalls / 6;
    const deathEcon = deathOvers > 0 ? s.deathRunsConceded / deathOvers : pressureEcon;

    // Bowling IRIS: Rewards maintaining dot-ball pressure and minimizing extras defending low totals / death
    let bowlingIRIS = 50.0;
    const dotScore = dotPct;
    const extraScore = extraControlRate;
    const econScore = Math.max(0, 100 - pressureEcon * 8.5);
    bowlingIRIS = (dotScore * 0.40) + (extraScore * 0.35) + (econScore * 0.25);
    bowlingIRIS = Math.min(99.2, Math.max(35.0, Number(bowlingIRIS.toFixed(1))));

    // Composite Bowler Clutch Rating (70 - 99 scale)
    // Factors: Low pressure economy, high extra control rate, dot %, death wickets, IRIS
    const econClutchScore = Math.max(0, Math.min(100, 100 - (pressureEcon - 5.5) * 10));
    const wicketScore = Math.min(100, (s.pressureWickets / Math.max(1, pressureOvers)) * 40);
    const dotClutchScore = dotPct;
    const volBonus = Math.min(10, Math.log10(s.pressureBalls + 1) * 3);

    const rawClutch = (econClutchScore * 0.32) + (extraScore * 0.22) + (dotClutchScore * 0.18) + (bowlingIRIS * 0.18) + (wicketScore * 0.05) + volBonus;
    const clutchRating = Number(Math.min(98.5, Math.max(60.0, rawClutch)).toFixed(1));

    const econDiff = Number((baselineEcon - pressureEcon).toFixed(2)); // Positive is good!

    const radarData = [
      { metric: 'Economy Control', baseline: Math.max(20, 100 - baselineEcon * 8), pressure: Math.max(20, 100 - pressureEcon * 8) },
      { metric: 'Extra Discipline', baseline: 85, pressure: extraControlRate },
      { metric: 'Dot Ball Mastery', baseline: 40, pressure: dotPct },
      { metric: 'Death Threat', baseline: 50, pressure: Math.min(100, (s.deathWickets / Math.max(1, deathOvers)) * 50) },
      { metric: 'Defending IRIS', baseline: 55, pressure: bowlingIRIS },
      { metric: 'Pressure Longevity', baseline: 50, pressure: Math.min(100, (s.pressureBalls / 120) * 100) },
    ];

    const scoutingReport = generateBowlerScoutingReport(
      name,
      s.team,
      pressureEcon,
      baselineEcon,
      dotPct,
      extraControlRate,
      bowlingIRIS,
      clutchRating
    );

    const isRetained = isFranchiseRetainedStalwart(name, dynamicRetainedSet);
    const marketStatus: 'Retained Core' | 'Auction Targetable' = isRetained ? 'Retained Core' : 'Auction Targetable';

    allBowlers.push({
      rank: 0,
      name,
      team: s.team,
      isRetained,
      marketStatus,
      totalBalls: s.totalBalls,
      totalRunsConceded: s.totalRunsConceded,
      baselineEconomy: Number(baselineEcon.toFixed(2)),
      pressureBalls: s.pressureBalls,
      pressureOvers: Number(pressureOvers.toFixed(1)),
      pressureRunsConceded: s.pressureRunsConceded,
      pressureWickets: s.pressureWickets,
      pressureEconomy: Number(pressureEcon.toFixed(2)),
      pressureDots: s.pressureDots,
      pressureDotPercent: Number(dotPct.toFixed(1)),
      pressureExtras: s.pressureExtras,
      extraControlRate: Number(extraControlRate.toFixed(1)),
      deathOversBalls: s.deathBalls,
      deathOversRunsConceded: s.deathRunsConceded,
      deathOversEconomy: Number(deathEcon.toFixed(2)),
      deathOversWickets: s.deathWickets,
      bowlingIRIS,
      economyDifferential: econDiff,
      clutchRating,
      radarData,
      scoutingReport,
    });
  }

  // Filter top qualified bowlers
  let qualifiedBowlers = allBowlers.filter((b) => b.pressureBalls >= config.minPressureBallsBowler);
  if (config.excludeRetained) {
    qualifiedBowlers = qualifiedBowlers.filter((b) => !b.isRetained);
  }
  const candidateBowlers = qualifiedBowlers.length >= 10
    ? qualifiedBowlers
    : allBowlers.filter((b) => !config.excludeRetained || !b.isRetained);
  candidateBowlers.sort((a, b) => b.clutchRating - a.clutchRating || a.pressureEconomy - b.pressureEconomy);
  candidateBowlers.forEach((b, idx) => {
    b.rank = idx + 1;
  });
  const topBowlers = candidateBowlers.slice(0, 10);

  return {
    topBatters,
    topBowlers,
    allBatters,
    allBowlers,
    metadata: {
      matchesCount: matchMap.size,
      deliveriesCount: processedDeliveries.length,
      highPressureDeliveriesCount: highPressureCount,
      anchorCollapsesDetected: totalCollapsesDetected,
      lostCauseDeliveriesCount: lostCauseCount,
      seasonRange: `${config.minYear} - Present`,
      generatedAt: new Date().toISOString(),
      anchorPlayers: teamDisplayAnchors,
    },
  };
}

/**
 * Generate Batter Scouting Narrative
 */
function generateBatterScoutingReport(
  name: string,
  team: string,
  pressureSR: number,
  baselineSR: number,
  boundaryPct: number,
  collapseSR: number,
  iris: number,
  clutch: number
): string {
  const diff = pressureSR - baselineSR;
  let acceleration = '';
  if (diff > 25) {
    acceleration = `demonstrates exceptional hyper-acceleration (+${diff.toFixed(1)} SR delta) when the required rate escalates beyond 8.0 RRR`;
  } else if (diff > 0) {
    acceleration = `retains scoring poise under pressure (+${diff.toFixed(1)} SR delta above baseline)`;
  } else {
    acceleration = `maintains reliable boundary contact even against specialized death bowling units`;
  }

  let anchorPhrase = '';
  if (collapseSR > 165) {
    anchorPhrase = `During the vulnerable 15-ball window following their team anchor's dismissal, ${name} strikes at a punishing ${collapseSR.toFixed(1)} SR, nullifying defensive momentum.`;
  } else {
    anchorPhrase = `Manages strike rotation and minimizes dot percentage effectively during top-order collapses.`;
  }

  let irisPhrase = '';
  if (iris > 80) {
    irisPhrase = `With an elite Improbable Resilience Index (IRIS) of ${iris.toFixed(1)}, this batter exhibits world-class intent and boundary conversion in statistically hopeless chases.`;
  } else {
    irisPhrase = `Maintains an IRIS score of ${iris.toFixed(1)}, providing high-leverage boundary utility.`;
  }

  return `${name} (${team}) qualifies as an elite clutch asset (Clutch Rating: ${clutch}). Under intense game pressure, ${name} ${acceleration}, converting ${boundaryPct.toFixed(1)}% of high-leverage deliveries into boundaries. ${anchorPhrase} ${irisPhrase}`;
}

/**
 * Generate Bowler Scouting Narrative
 */
function generateBowlerScoutingReport(
  name: string,
  team: string,
  pressureEcon: number,
  baselineEcon: number,
  dotPct: number,
  extraControl: number,
  iris: number,
  clutch: number
): string {
  const diff = baselineEcon - pressureEcon;
  let econPhrase = '';
  if (diff > 0.5) {
    econPhrase = `restricts scoring drastically under pressure, improving economy by ${diff.toFixed(2)} RPO compared to standard overs`;
  } else {
    econPhrase = `operates with pinpoint discipline in high-leverage overs, sustaining a pressure economy of ${pressureEcon.toFixed(2)}`;
  }

  let disciplinePhrase = `With an Extra Control Rate of ${extraControl.toFixed(1)}%, ${name} concedes virtually zero free hits or illegal deliveries at the death.`;
  let dotPhrase = `Delivers ${dotPct.toFixed(1)}% dot balls under pressure, starving opposition hitters of scoring momentum.`;

  return `${name} (${team}) registers an extraordinary Clutch Rating of ${clutch}. When defending tight targets or bowling at the death, ${name} ${econPhrase}. ${disciplinePhrase} ${dotPhrase} Their Bowling IRIS score of ${iris.toFixed(1)} highlights proven low-total defense capability.`;
}
