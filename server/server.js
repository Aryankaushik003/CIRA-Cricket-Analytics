import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const dataPackDir = path.join(__dirname, '../real_dataset/Data Pack');

/**
 * Execute CIRA Engine on Real Dataset
 */
async function processRealCompetitionData(options = {}) {
  const minYear = options.minYear || 2022;
  const compFilter = options.compFilter || 'all'; // 'all', 'ipl', 't20i'
  const minBatterBalls = options.minBatterBalls || 50;
  const minBowlerBalls = options.minBowlerBalls || 48;
  const rrrThreshold = options.rrrThreshold || 8.0;
  const anchorMultiplier = options.anchorMultiplier || 1.5;
  const lostCauseRrr = options.lostCauseRrr || 18.0;
  const excludePakistan = options.excludePakistan !== false; // Default true!

  // 1. Teams
  const teamIdNameMap = new Map();
  const pakTeamIds = new Set(['25', '341']);

  if (fs.existsSync(path.join(dataPackDir, 'teams.csv'))) {
    const teamsContent = fs.readFileSync(path.join(dataPackDir, 'teams.csv'), 'utf8');
    const teamLines = teamsContent.split('\n');
    for (let i = 1; i < teamLines.length; i++) {
      const line = teamLines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 3) {
        const teamId = parts[1].trim();
        const teamName = parts.slice(2).join(',').trim();
        teamIdNameMap.set(teamId, teamName);
        if (teamName.toLowerCase().includes('pakistan')) {
          pakTeamIds.add(teamId);
        }
      }
    }
  }

  // 2. Competitions
  const compMap = new Map();
  const iplCompIds = new Set();
  if (fs.existsSync(path.join(dataPackDir, 'competitions.csv'))) {
    const compContent = fs.readFileSync(path.join(dataPackDir, 'competitions.csv'), 'utf8');
    const compLines = compContent.split('\n');
    for (let i = 1; i < compLines.length; i++) {
      const line = compLines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 4) {
        const compId = parts[0].trim();
        const compName = parts[1].trim();
        const format = parts[2].trim();
        const season = parseInt(parts[3].trim(), 10) || 2022;
        compMap.set(compId, { season, name: compName, format });
        if (compName.toUpperCase().includes('IPL')) {
          iplCompIds.add(compId);
        }
      }
    }
  }

  // 3. Player mappings and identify Pakistani Player IDs
  const pakPlayerIds = new Set();
  const pakPlayerNames = new Set();
  const playerTeamMap = new Map();

  if (fs.existsSync(path.join(dataPackDir, 'competition_team_player_mapping.csv'))) {
    const mapContent = fs.readFileSync(path.join(dataPackDir, 'competition_team_player_mapping.csv'), 'utf8');
    const mapLines = mapContent.split('\n');
    for (let i = 1; i < mapLines.length; i++) {
      const line = mapLines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 6) {
        const teamId = parts[2].trim();
        const teamName = parts[3].trim();
        const pId = parts[4].trim();
        const pName = parts[5].trim();
        if (pakTeamIds.has(teamId) || teamName.toLowerCase().includes('pakistan')) {
          pakPlayerIds.add(pId);
          pakPlayerNames.add(pName.toLowerCase());
        } else {
          playerTeamMap.set(pName, teamName);
        }
      }
    }
  }

  // 4. Matches
  const matchMap = new Map();
  if (fs.existsSync(path.join(dataPackDir, 'matches.csv'))) {
    const matchContent = fs.readFileSync(path.join(dataPackDir, 'matches.csv'), 'utf8');
    const matchLines = matchContent.split('\n');
    const header = matchLines[0].split(',').map((h) => h.trim());
    const mIdIdx = header.indexOf('match_id');
    const cIdIdx = header.indexOf('comp_id');
    const dateIdx = header.indexOf('match_date');
    const hTeamIdx = header.indexOf('home_team');
    const aTeamIdx = header.indexOf('away_team');
    const hIdIdx = header.indexOf('home_team_id');
    const aIdIdx = header.indexOf('away_team_id');
    const targetIdx = header.indexOf('revised_target');

    for (let i = 1; i < matchLines.length; i++) {
      const line = matchLines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      const matchId = cols[mIdIdx]?.trim();
      if (!matchId) continue;
      const compId = cols[cIdIdx]?.trim();
      const compInfo = compMap.get(compId);
      const dateStr = cols[dateIdx]?.trim();
      let year = compInfo ? compInfo.season : 2022;
      if (dateStr) {
        const m = dateStr.match(/\d{4}/);
        if (m) year = parseInt(m[0], 10);
      }

      const isIPL = iplCompIds.has(compId) || (compInfo && compInfo.name.toUpperCase().includes('IPL'));
      if (compFilter === 'ipl' && !isIPL) continue;
      if (compFilter === 't20i' && isIPL) continue;
      if (year < minYear) continue;

      const revisedTarget = cols[targetIdx] ? parseFloat(cols[targetIdx]) : 0;

      matchMap.set(matchId, {
        matchId,
        compId,
        year,
        date: dateStr,
        isIPL,
        homeTeam: cols[hTeamIdx]?.trim() || teamIdNameMap.get(cols[hIdIdx]?.trim()) || 'Home Team',
        awayTeam: cols[aTeamIdx]?.trim() || teamIdNameMap.get(cols[aIdIdx]?.trim()) || 'Away Team',
        homeTeamId: cols[hIdIdx]?.trim(),
        awayTeamId: cols[aIdIdx]?.trim(),
        revisedTarget,
      });
    }
  }

  // 5. Pass 1: Accumulate batter season runs to find Anchors & scan Pakistani player IDs
  const firstInningsTotals = new Map();
  const teamSeasonBatterRuns = new Map();

  const bbbPath = path.join(dataPackDir, 'ball_by_ball.csv');
  if (!fs.existsSync(bbbPath)) {
    throw new Error('ball_by_ball.csv not found in Data Pack.');
  }

  const rl1 = readline.createInterface({
    input: fs.createReadStream(bbbPath),
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  for await (const line of rl1) {
    lineCount++;
    if (lineCount === 1) continue;
    if (!line) continue;

    const cols = line.split(',');
    const matchId = cols[0]?.trim();
    const match = matchMap.get(matchId);
    if (!match) continue;

    const innings = parseInt(cols[1]?.trim(), 10) || 1;
    const batTeamId = cols[5]?.trim();
    const bowlTeamId = cols[6]?.trim();
    const strikerId = cols[7]?.trim();
    const striker = cols[8]?.trim();
    const bowlerId = cols[11]?.trim();
    const bowler = cols[12]?.trim();

    // Track Pakistani player IDs
    if (pakTeamIds.has(batTeamId)) {
      if (strikerId) pakPlayerIds.add(strikerId);
      if (striker) pakPlayerNames.add(striker.toLowerCase());
    }
    if (pakTeamIds.has(bowlTeamId)) {
      if (bowlerId) pakPlayerIds.add(bowlerId);
      if (bowler) pakPlayerNames.add(bowler.toLowerCase());
    }

    const runs = parseFloat(cols[16]?.trim()) || 0;
    const extras1 = parseFloat(cols[24]?.trim()) || 0;
    const extras2 = parseFloat(cols[25]?.trim()) || 0;
    const totalRuns = runs + extras1 + extras2;

    if (innings === 1) {
      firstInningsTotals.set(matchId, (firstInningsTotals.get(matchId) || 0) + totalRuns);
    }

    if (batTeamId && striker) {
      const key = `${batTeamId}_${match.year}`;
      if (!teamSeasonBatterRuns.has(key)) {
        teamSeasonBatterRuns.set(key, new Map());
      }
      const bMap = teamSeasonBatterRuns.get(key);
      bMap.set(striker, (bMap.get(striker) || 0) + runs);

      const teamName = teamIdNameMap.get(batTeamId) || (match.homeTeamId === batTeamId ? match.homeTeam : match.awayTeam);
      if (teamName && !playerTeamMap.has(striker)) {
        playerTeamMap.set(striker, teamName);
      }
    }
  }

  const teamSeasonAnchors = new Map();
  const displayAnchors = {};
  for (const [key, bMap] of teamSeasonBatterRuns.entries()) {
    let topBatter = '';
    let maxRuns = -1;
    for (const [batter, runs] of bMap.entries()) {
      if (runs > maxRuns) {
        maxRuns = runs;
        topBatter = batter;
      }
    }
    if (topBatter) {
      teamSeasonAnchors.set(key, topBatter);
      const teamId = key.split('_')[0];
      const tName = teamIdNameMap.get(teamId) || teamId;
      displayAnchors[tName] = topBatter;
    }
  }

  // 6. Pass 2: Delivery-by-delivery CIRA Engine
  const batterStatsMap = new Map();
  const bowlerStatsMap = new Map();

  let totalDeliveries = 0;
  let totalHighPressure = 0;
  let totalCollapses = 0;
  let totalLostCause = 0;

  function processMatchInnings(balls) {
    if (balls.length === 0) return;
    const matchId = balls[0].matchId;
    const innings = balls[0].innings;
    const match = matchMap.get(matchId);
    if (!match) return;

    const batTeamId = balls[0].batTeamId;
    const anchorPlayer = teamSeasonAnchors.get(`${batTeamId}_${match.year}`) || '';

    const isChase = innings >= 2;
    let targetRuns = match.revisedTarget || 0;
    if (isChase && targetRuns <= 0) {
      targetRuns = (firstInningsTotals.get(matchId) || 160) + 1;
    }

    let currentRuns = 0;
    let wicketsLost = 0;
    let legalBalls = 0;
    let anchorDismissedIdx = -1;
    let collapseBallsLeft = 0;

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      totalDeliveries++;

      const isWide = b.extrasType === 'wides';
      const isNoBall = b.extrasType === 'no ball';
      const isLegal = !isWide && !isNoBall;
      if (isLegal) legalBalls++;

      currentRuns += b.totalRuns;
      const isWicket = b.isWicket && b.dismissalType !== 'run out';

      if (b.isWicket) {
        wicketsLost++;
        if (anchorPlayer && b.striker.toLowerCase() === anchorPlayer.toLowerCase()) {
          anchorDismissedIdx = i;
          collapseBallsLeft = 15;
          totalCollapses++;
        }
      }

      let isCollapseActive = false;
      if (collapseBallsLeft > 0 && i > anchorDismissedIdx) {
        isCollapseActive = true;
        collapseBallsLeft--;
      }

      const over1Indexed = b.overId;
      const isDeathOvers = over1Indexed >= 16;
      const ballsRemaining = Math.max(1, 120 - legalBalls);
      const runsNeeded = isChase ? Math.max(0, targetRuns - currentRuns) : 0;
      const rrr = isChase ? (runsNeeded / ballsRemaining) * 6 : 0;

      const isLostCause = isChase && (rrr >= lostCauseRrr || (runsNeeded >= 48 && ballsRemaining <= 18) || (wicketsLost >= 8 && rrr >= 12.0));
      if (isLostCause) totalLostCause++;

      let pi = 1.0;
      if (isDeathOvers) pi += 0.50;
      if (isChase) {
        if (rrr > rrrThreshold) {
          pi += Math.min(1.5, (rrr - rrrThreshold) * 0.15);
        }
        if (rrr >= 12.0) pi += 0.35;
      } else {
        if (over1Indexed <= 6 && wicketsLost >= 3) pi += 0.50;
      }
      if (wicketsLost >= 6) pi += 0.40;

      let effectivePI = pi;
      if (isCollapseActive) {
        effectivePI = pi * anchorMultiplier;
      }

      const isHighPressure = effectivePI >= 1.45 || (isChase && rrr > rrrThreshold) || isDeathOvers || wicketsLost >= 6 || isCollapseActive;
      if (isHighPressure) totalHighPressure++;

      // Batter (Exclude Pakistan players if flag is active)
      const isPakBatter = excludePakistan && (pakPlayerIds.has(b.strikerId) || pakPlayerNames.has(b.striker.toLowerCase()));
      if (!isWide && !isPakBatter) {
        if (!batterStatsMap.has(b.striker)) {
          batterStatsMap.set(b.striker, {
            name: b.striker,
            team: playerTeamMap.get(b.striker) || 'T20 Team',
            totalBalls: 0,
            totalRuns: 0,
            pressureBalls: 0,
            pressureRuns: 0,
            pressureDots: 0,
            pressureFours: 0,
            pressureSixes: 0,
            collapseBalls: 0,
            collapseRuns: 0,
            lostCauseBalls: 0,
            lostCauseRuns: 0,
            lostCauseBoundaries: 0,
            lostCauseDots: 0,
          });
        }
        const bStat = batterStatsMap.get(b.striker);
        bStat.totalBalls++;
        bStat.totalRuns += b.runs;

        if (isHighPressure) {
          bStat.pressureBalls++;
          bStat.pressureRuns += b.runs;
          if (b.runs === 0) bStat.pressureDots++;
          if (b.isFour) bStat.pressureFours++;
          if (b.isSix) bStat.pressureSixes++;
        }

        if (isCollapseActive) {
          bStat.collapseBalls++;
          bStat.collapseRuns += b.runs;
        }

        if (isLostCause) {
          bStat.lostCauseBalls++;
          bStat.lostCauseRuns += b.runs;
          if (b.isFour || b.isSix) bStat.lostCauseBoundaries++;
          if (b.runs === 0) bStat.lostCauseDots++;
        }
      }

      // Bowler (Exclude Pakistan players if flag is active)
      const isPakBowler = excludePakistan && (pakPlayerIds.has(b.bowlerId) || pakPlayerNames.has(b.bowler.toLowerCase()));
      if (!isPakBowler) {
        if (!bowlerStatsMap.has(b.bowler)) {
          bowlerStatsMap.set(b.bowler, {
            name: b.bowler,
            team: playerTeamMap.get(b.bowler) || 'T20 Team',
            totalBalls: 0,
            totalConceded: 0,
            pressureBalls: 0,
            pressureConceded: 0,
            pressureWickets: 0,
            pressureDots: 0,
            pressureExtras: 0,
            deathBalls: 0,
            deathConceded: 0,
            deathWickets: 0,
            deathDots: 0,
            deathExtras: 0,
          });
        }
        const boStat = bowlerStatsMap.get(b.bowler);
        boStat.totalBalls++;
        const bowlerConceded = b.runs + (isWide || isNoBall ? b.extras : 0);
        boStat.totalConceded += bowlerConceded;

        const isDot = b.totalRuns === 0;
        const isExtra = isWide || isNoBall;

        if (isHighPressure) {
          boStat.pressureBalls++;
          boStat.pressureConceded += bowlerConceded;
          if (isWicket) boStat.pressureWickets++;
          if (isDot) boStat.pressureDots++;
          if (isExtra) boStat.pressureExtras++;
        }

        if (isDeathOvers) {
          boStat.deathBalls++;
          boStat.deathConceded += bowlerConceded;
          if (isWicket) boStat.deathWickets++;
          if (isDot) boStat.deathDots++;
          if (isExtra) boStat.deathExtras++;
        }
      }
    }
  }

  const rl2 = readline.createInterface({
    input: fs.createReadStream(bbbPath),
    crlfDelay: Infinity,
  });

  let currentMatchKey = '';
  let matchDeliveries = [];

  lineCount = 0;
  for await (const line of rl2) {
    lineCount++;
    if (lineCount === 1) continue;
    if (!line) continue;

    const cols = line.split(',');
    const matchId = cols[0]?.trim();
    const innings = parseInt(cols[1]?.trim(), 10) || 1;
    const key = `${matchId}_${innings}`;

    if (key !== currentMatchKey) {
      if (matchDeliveries.length > 0) {
        processMatchInnings(matchDeliveries);
      }
      currentMatchKey = key;
      matchDeliveries = [];
    }

    matchDeliveries.push({
      matchId,
      innings,
      overId: parseInt(cols[2]?.trim(), 10) || 1,
      batTeamId: cols[5]?.trim(),
      bowlTeamId: cols[6]?.trim(),
      strikerId: cols[7]?.trim(),
      striker: cols[8]?.trim(),
      bowlerId: cols[11]?.trim(),
      bowler: cols[12]?.trim(),
      runs: parseFloat(cols[16]?.trim()) || 0,
      isFour: cols[17]?.trim().toLowerCase() === 'true',
      isSix: cols[18]?.trim().toLowerCase() === 'true',
      isWicket: cols[19]?.trim().toLowerCase() === 'true',
      dismissalType: cols[21]?.trim().toLowerCase(),
      extrasType: cols[23]?.trim().toLowerCase(),
      extras: (parseFloat(cols[24]?.trim()) || 0) + (parseFloat(cols[25]?.trim()) || 0),
      totalRuns: (parseFloat(cols[16]?.trim()) || 0) + (parseFloat(cols[24]?.trim()) || 0) + (parseFloat(cols[25]?.trim()) || 0),
    });
  }

  if (matchDeliveries.length > 0) {
    processMatchInnings(matchDeliveries);
  }

  // 7. Format Batters
  const allBatters = [];
  for (const b of batterStatsMap.values()) {
    if (b.totalBalls < 15) continue;
    const baselineSR = b.totalBalls > 0 ? (b.totalRuns / b.totalBalls) * 100 : 0;
    const pressureSR = b.pressureBalls > 0 ? (b.pressureRuns / b.pressureBalls) * 100 : baselineSR;
    const boundaries = b.pressureFours + b.pressureSixes;
    const boundaryPct = b.pressureBalls > 0 ? (boundaries / b.pressureBalls) * 100 : 0;
    const dotPct = b.pressureBalls > 0 ? (b.pressureDots / b.pressureBalls) * 100 : 0;
    const collapseSR = b.collapseBalls > 0 ? (b.collapseRuns / b.collapseBalls) * 100 : pressureSR;

    let battingIRIS = 50.0;
    if (b.lostCauseBalls >= 5) {
      const lcBndRate = (b.lostCauseBoundaries / b.lostCauseBalls) * 100;
      const lcSR = (b.lostCauseRuns / b.lostCauseBalls) * 100;
      const lcDotAversion = Math.max(0, 100 - (b.lostCauseDots / b.lostCauseBalls) * 100);
      battingIRIS = (lcBndRate * 0.45) + (Math.min(250, lcSR) * 0.20) + (lcDotAversion * 0.35);
    } else {
      battingIRIS = (boundaryPct * 1.5) + (Math.min(220, pressureSR) * 0.22);
    }
    battingIRIS = Math.min(99.5, Math.max(35.0, Number(battingIRIS.toFixed(1))));

    const srScore = Math.min(100, (pressureSR / 220) * 100);
    const bndScore = Math.min(100, (boundaryPct / 35) * 100);
    const colScore = Math.min(100, (collapseSR / 200) * 100);
    const volBonus = Math.min(10, Math.log10(b.pressureBalls + 1) * 3);

    const rawClutch = (srScore * 0.32) + (bndScore * 0.22) + (colScore * 0.18) + (battingIRIS * 0.20) + volBonus;
    const clutchRating = Number(Math.min(98.8, Math.max(60.0, rawClutch)).toFixed(1));
    const srDiff = Number((pressureSR - baselineSR).toFixed(1));

    const radarData = [
      { metric: 'Strike Rate', baseline: Math.min(100, (baselineSR / 200) * 100), pressure: Math.min(100, (pressureSR / 220) * 100) },
      { metric: 'Boundary Intent', baseline: Math.min(100, ((b.totalRuns * 0.15) / Math.max(1, b.totalBalls)) * 150), pressure: Math.min(100, boundaryPct * 3.2) },
      { metric: 'Dot Aversion', baseline: 65, pressure: Math.max(20, 100 - dotPct * 1.6) },
      { metric: 'Collapse Resil.', baseline: 55, pressure: Math.min(100, (collapseSR / 200) * 100) },
      { metric: 'Lost Cause IRIS', baseline: 50, pressure: battingIRIS },
      { metric: 'Pressure Longevity', baseline: 60, pressure: Math.min(100, (b.pressureBalls / 150) * 100) },
    ];

    const scoutingReport = `${b.name} (${b.team}) registered an elite CIRA Clutch Rating of ${clutchRating}. In high-pressure deliveries (RRR > 8.0 & Death), struck at ${pressureSR.toFixed(1)} SR (${srDiff >= 0 ? '+' : ''}${srDiff.toFixed(1)} vs baseline) with a ${boundaryPct.toFixed(1)}% boundary rate. During the 15-ball window following their anchor's dismissal, accelerated at ${collapseSR.toFixed(1)} SR, exhibiting a resilience IRIS rating of ${battingIRIS}.`;

    allBatters.push({
      rank: 0,
      name: b.name,
      team: b.team,
      totalRuns: b.totalRuns,
      totalBalls: b.totalBalls,
      baselineStrikeRate: Number(baselineSR.toFixed(1)),
      pressureRuns: b.pressureRuns,
      pressureBalls: b.pressureBalls,
      pressureStrikeRate: Number(pressureSR.toFixed(1)),
      pressureBoundaries: boundaries,
      pressureBoundaryPercent: Number(boundaryPct.toFixed(1)),
      pressureDots: b.pressureDots,
      pressureDotPercent: Number(dotPct.toFixed(1)),
      collapseRuns: b.collapseRuns,
      collapseBalls: b.collapseBalls,
      collapseStrikeRate: Number(collapseSR.toFixed(1)),
      lostCauseRuns: b.lostCauseRuns,
      lostCauseBalls: b.lostCauseBalls,
      lostCauseStrikeRate: Number((b.lostCauseBalls > 0 ? (b.lostCauseRuns / b.lostCauseBalls) * 100 : 0).toFixed(1)),
      lostCauseBoundaryRate: Number((b.lostCauseBalls > 0 ? (b.lostCauseBoundaries / b.lostCauseBalls) * 100 : 0).toFixed(1)),
      battingIRIS,
      strikeRateDifferential: srDiff,
      clutchRating,
      radarData,
      scoutingReport,
    });
  }

  const qualifiedBatters = allBatters.filter((b) => b.pressureBalls >= minBatterBalls);
  const candidateBatters = qualifiedBatters.length >= 10 ? qualifiedBatters : allBatters;
  candidateBatters.sort((a, b) => b.clutchRating - a.clutchRating || b.pressureStrikeRate - a.pressureStrikeRate);
  candidateBatters.forEach((b, idx) => {
    b.rank = idx + 1;
  });
  const topBatters = candidateBatters.slice(0, 10);

  // 8. Format Bowlers
  const allBowlers = [];
  for (const b of bowlerStatsMap.values()) {
    if (b.totalBalls < 18) continue;
    const baselineEcon = b.totalBalls > 0 ? (b.totalConceded / (b.totalBalls / 6)) : 8.5;
    const pressureOvers = b.pressureBalls / 6;
    const pressureEcon = pressureOvers > 0 ? b.pressureConceded / pressureOvers : baselineEcon;
    const dotPct = b.pressureBalls > 0 ? (b.pressureDots / b.pressureBalls) * 100 : 0;
    const extraControlRate = b.pressureBalls > 0 ? Math.max(0, (1 - b.pressureExtras / b.pressureBalls) * 100) : 95.0;

    const deathOvers = b.deathBalls / 6;
    const deathEcon = deathOvers > 0 ? b.deathConceded / deathOvers : pressureEcon;

    const dotScore = dotPct;
    const extraScore = extraControlRate;
    const econScore = Math.max(0, 100 - pressureEcon * 8.5);
    let bowlingIRIS = (dotScore * 0.40) + (extraScore * 0.35) + (econScore * 0.25);
    bowlingIRIS = Math.min(99.2, Math.max(35.0, Number(bowlingIRIS.toFixed(1))));

    const econClutchScore = Math.max(0, Math.min(100, 100 - (pressureEcon - 5.5) * 10));
    const wicketScore = Math.min(100, (b.pressureWickets / Math.max(1, pressureOvers)) * 40);
    const volBonus = Math.min(10, Math.log10(b.pressureBalls + 1) * 3);

    const rawClutch = (econClutchScore * 0.32) + (extraScore * 0.22) + (dotScore * 0.18) + (bowlingIRIS * 0.18) + (wicketScore * 0.05) + volBonus;
    const clutchRating = Number(Math.min(98.5, Math.max(60.0, rawClutch)).toFixed(1));
    const econDiff = Number((baselineEcon - pressureEcon).toFixed(2));

    const radarData = [
      { metric: 'Economy Control', baseline: Math.max(20, 100 - baselineEcon * 8), pressure: Math.max(20, 100 - pressureEcon * 8) },
      { metric: 'Extra Discipline', baseline: 85, pressure: extraControlRate },
      { metric: 'Dot Ball Mastery', baseline: 40, pressure: dotPct },
      { metric: 'Death Threat', baseline: 50, pressure: Math.min(100, (b.deathWickets / Math.max(1, deathOvers)) * 50) },
      { metric: 'Defending IRIS', baseline: 55, pressure: bowlingIRIS },
      { metric: 'Pressure Longevity', baseline: 50, pressure: Math.min(100, (b.pressureBalls / 120) * 100) },
    ];

    const scoutingReport = `${b.name} (${b.team}) earned a standout CIRA Clutch Rating of ${clutchRating}. Operating in death overs and defending targets, conceded only ${pressureEcon.toFixed(2)} RPO (${econDiff >= 0 ? '-' : '+'}${Math.abs(econDiff).toFixed(2)} vs baseline) with ${dotPct.toFixed(1)}% dot balls and ${extraControlRate.toFixed(1)}% extra control discipline. Bowling IRIS: ${bowlingIRIS}.`;

    allBowlers.push({
      rank: 0,
      name: b.name,
      team: b.team,
      totalBalls: b.totalBalls,
      totalRunsConceded: b.totalConceded,
      baselineEconomy: Number(baselineEcon.toFixed(2)),
      pressureBalls: b.pressureBalls,
      pressureOvers: Number(pressureOvers.toFixed(1)),
      pressureRunsConceded: b.pressureConceded,
      pressureWickets: b.pressureWickets,
      pressureEconomy: Number(pressureEcon.toFixed(2)),
      pressureDots: b.pressureDots,
      pressureDotPercent: Number(dotPct.toFixed(1)),
      pressureExtras: b.pressureExtras,
      extraControlRate: Number(extraControlRate.toFixed(1)),
      deathOversBalls: b.deathBalls,
      deathOversRunsConceded: b.deathConceded,
      deathOversEconomy: Number(deathEcon.toFixed(2)),
      deathOversWickets: b.deathWickets,
      bowlingIRIS,
      economyDifferential: econDiff,
      clutchRating,
      radarData,
      scoutingReport,
    });
  }

  const qualifiedBowlers = allBowlers.filter((b) => b.pressureBalls >= minBowlerBalls);
  const candidateBowlers = qualifiedBowlers.length >= 10 ? qualifiedBowlers : allBowlers;
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
      deliveriesCount: totalDeliveries,
      highPressureDeliveriesCount: totalHighPressure,
      anchorCollapsesDetected: totalCollapses,
      lostCauseDeliveriesCount: totalLostCause,
      seasonRange: `${minYear} - Present (${compFilter.toUpperCase()})`,
      generatedAt: new Date().toISOString(),
      anchorPlayers: displayAnchors,
      auctionEligibilityRule: 'Pakistan Players Excluded for IPL Auction Compliance',
    },
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'CIRA: Clutch-Index & Improbable Resilience Analytics',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/process-real', async (req, res) => {
  try {
    const results = await processRealCompetitionData(req.body || {});
    res.json(results);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Error processing real data' });
  }
});

// Serve frontend build if dist exists
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.listen(PORT, () => {
  console.log(`CIRA Analytics Server running on http://localhost:${PORT}`);
});
