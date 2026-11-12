const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const outDir = path.join(__dirname, '../sample_data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating sample dataset files...');

const competitions = [
  { competition_id: 'IPL2022', name: 'Indian Premier League 2022', season: 2022, type: 'T20' },
  { competition_id: 'IPL2023', name: 'Indian Premier League 2023', season: 2023, type: 'T20' },
  { competition_id: 'IPL2024', name: 'Indian Premier League 2024', season: 2024, type: 'T20' },
];

const teams = [
  {
    name: 'Kolkata Knight Riders',
    short: 'KKR',
    anchor: 'Shreyas Iyer',
    topBatters: ['Rinku Singh', 'Andre Russell', 'Nitish Rana', 'Venkatesh Iyer'],
    topBowlers: ['Sunil Narine', 'Harshit Rana', 'Mitchell Starc', 'Varun Chakaravarthy'],
  },
  {
    name: 'Sunrisers Hyderabad',
    short: 'SRH',
    anchor: 'Travis Head',
    topBatters: ['Heinrich Klaasen', 'Abdul Samad', 'Abhishek Sharma', 'Nitish Kumar Reddy'],
    topBowlers: ['Pat Cummins', 'Bhuvneshwar Kumar', 'T Natarajan', 'Mayank Markande'],
  },
  {
    name: 'Mumbai Indians',
    short: 'MI',
    anchor: 'Rohit Sharma',
    topBatters: ['Suryakumar Yadav', 'Tim David', 'Hardik Pandya', 'Tilak Varma'],
    topBowlers: ['Jasprit Bumrah', 'Gerald Coetzee', 'Piyush Chawla', 'Akash Madhwal'],
  },
  {
    name: 'Chennai Super Kings',
    short: 'CSK',
    anchor: 'Ruturaj Gaikwad',
    topBatters: ['MS Dhoni', 'Shivam Dube', 'Ravindra Jadeja', 'Ajinkya Rahane'],
    topBowlers: ['Matheesha Pathirana', 'Mustafizur Rahman', 'Tushar Deshpande', 'Deepak Chahar'],
  },
  {
    name: 'Royal Challengers Bengaluru',
    short: 'RCB',
    anchor: 'Virat Kohli',
    topBatters: ['Dinesh Karthik', 'Glenn Maxwell', 'Rajat Patidar', 'Faf du Plessis'],
    topBowlers: ['Mohammed Siraj', 'Yash Dayal', 'Lockie Ferguson', 'Cameron Green'],
  },
  {
    name: 'Gujarat Titans',
    short: 'GT',
    anchor: 'Shubman Gill',
    topBatters: ['David Miller', 'Rahul Tewatia', 'Sai Sudharsan', 'Vijay Shankar'],
    topBowlers: ['Rashid Khan', 'Mohammed Shami', 'Mohit Sharma', 'Noor Ahmad'],
  },
  {
    name: 'Lucknow Super Giants',
    short: 'LSG',
    anchor: 'KL Rahul',
    topBatters: ['Nicholas Pooran', 'Marcus Stoinis', 'Ayush Badoni', 'Deepak Hooda'],
    topBowlers: ['Mayank Yadav', 'Naveen-ul-Haq', 'Ravi Bishnoi', 'Mohsin Khan'],
  },
  {
    name: 'Rajasthan Royals',
    short: 'RR',
    anchor: 'Jos Buttler',
    topBatters: ['Sanju Samson', 'Shimron Hetmyer', 'Riyan Parag', 'Dhruv Jurel'],
    topBowlers: ['Yuzvendra Chahal', 'Trent Boult', 'Sandeep Sharma', 'Avesh Khan'],
  },
];

const mappings = [];
const playingEleven = [];
const matches = [];
const balls = [];

for (const t of teams) {
  mappings.push({ competition_id: 'IPL2024', team_name: t.name, player_name: t.anchor });
  for (const b of t.topBatters) {
    mappings.push({ competition_id: 'IPL2024', team_name: t.name, player_name: b });
  }
  for (const bw of t.topBowlers) {
    mappings.push({ competition_id: 'IPL2024', team_name: t.name, player_name: bw });
  }
}

let matchCounter = 1001;
const seasons = [2022, 2023, 2024];

for (const season of seasons) {
  for (let m = 0; m < 15; m++) {
    const matchId = matchCounter++;
    const t1Idx = (m * 2) % teams.length;
    let t2Idx = (m * 2 + 1) % teams.length;
    if (t1Idx === t2Idx) t2Idx = (t2Idx + 1) % teams.length;

    const team1 = teams[t1Idx];
    const team2 = teams[t2Idx];
    const targetRuns = 160 + ((matchId * 17) % 65);

    matches.push({
      match_id: matchId,
      season,
      date: `${season}-04-${String((m % 28) + 1).padStart(2, '0')}`,
      team1: team1.name,
      team2: team2.name,
      toss_winner: team2.name,
      toss_decision: 'field',
      winner: (m % 2 === 0) ? team2.name : team1.name,
      result: 'runs',
      result_margin: 8 + (m % 15),
      target_runs: targetRuns,
      target_overs: 20,
      venue: 'Eden Gardens / Wankhede Stadium / Narendra Modi Stadium',
      competition_id: `IPL${season}`,
    });

    const allT1Players = [team1.anchor, ...team1.topBatters, ...team1.topBowlers];
    const allT2Players = [team2.anchor, ...team2.topBatters, ...team2.topBowlers];

    for (const p of allT1Players) {
      playingEleven.push({ match_id: matchId, team: team1.name, player_name: p });
    }
    for (const p of allT2Players) {
      playingEleven.push({ match_id: matchId, team: team2.name, player_name: p });
    }

    generateInnings(balls, matchId, season, 1, team1, team2, 0);
    generateInnings(balls, matchId, season, 2, team2, team1, targetRuns);
  }
}

function generateInnings(ballsList, matchId, season, innings, batTeam, bowlTeam, targetRuns) {
  let currentRuns = 0;
  let wickets = 0;
  let batterIdx = 0;
  const battersLineup = [batTeam.anchor, ...batTeam.topBatters];
  let striker = battersLineup[0];
  let nonStriker = battersLineup[1];
  batterIdx = 2;

  const anchorDismissOver = 7 + (matchId % 5);
  let anchorOutDone = false;

  for (let over = 0; over < 20; over++) {
    const bowler = bowlTeam.topBowlers[over % bowlTeam.topBowlers.length];

    for (let ball = 1; ball <= 6; ball++) {
      let isWicket = 0;
      let playerDismissed = '';
      let dismissalKind = '';
      let runsBatter = 0;
      let wides = 0;
      let noballs = 0;

      if (innings === 2 && targetRuns > 0 && currentRuns >= targetRuns) return;
      if (wickets >= 10) return;

      const ballsBowledSoFar = over * 6 + ball;
      const ballsRemaining = Math.max(1, 120 - ballsBowledSoFar);
      const runsNeeded = Math.max(0, targetRuns - currentRuns);
      const rrr = innings === 2 ? (runsNeeded / ballsRemaining) * 6 : 8.0;

      if (!anchorOutDone && over === anchorDismissOver && ball === 3 && striker === batTeam.anchor) {
        isWicket = 1;
        playerDismissed = striker;
        dismissalKind = 'caught';
        wickets++;
        anchorOutDone = true;
        striker = battersLineup[batterIdx] || 'Lower Order';
        batterIdx++;
      } else {
        const roll = Math.random();
        const isTopBowler = ['Jasprit Bumrah', 'Rashid Khan', 'Matheesha Pathirana', 'Sunil Narine'].includes(bowler);
        const isClutchHitter = ['Heinrich Klaasen', 'Rinku Singh', 'Nicholas Pooran', 'Andre Russell', 'Suryakumar Yadav', 'MS Dhoni'].includes(striker);

        if (roll < (isTopBowler ? 0.02 : 0.06)) {
          wides = 1;
        }

        if (wides === 0) {
          if (isTopBowler && over >= 15) {
            if (roll < 0.50) runsBatter = 0;
            else if (roll < 0.75) runsBatter = 1;
            else if (roll < 0.88) runsBatter = 2;
            else if (roll < 0.94) runsBatter = 4;
            else if (roll < 0.98) runsBatter = 6;
            else {
              isWicket = 1;
              playerDismissed = striker;
              dismissalKind = 'bowled';
            }
          } else if (isClutchHitter && (over >= 15 || rrr > 10.0)) {
            if (roll < 0.22) runsBatter = 0;
            else if (roll < 0.42) runsBatter = 1;
            else if (roll < 0.52) runsBatter = 2;
            else if (roll < 0.78) runsBatter = 4;
            else if (roll < 0.96) runsBatter = 6;
            else {
              isWicket = 1;
              playerDismissed = striker;
              dismissalKind = 'caught';
            }
          } else {
            if (roll < 0.35) runsBatter = 0;
            else if (roll < 0.65) runsBatter = 1;
            else if (roll < 0.77) runsBatter = 2;
            else if (roll < 0.90) runsBatter = 4;
            else if (roll < 0.96) runsBatter = 6;
            else {
              isWicket = 1;
              playerDismissed = striker;
              dismissalKind = 'caught';
            }
          }
        }
      }

      if (isWicket && !playerDismissed) {
        playerDismissed = striker;
        dismissalKind = 'caught';
        wickets++;
        striker = battersLineup[batterIdx] || 'Lower Order';
        batterIdx++;
      }

      const extraRuns = wides + noballs;
      const totalRuns = runsBatter + extraRuns;
      currentRuns += totalRuns;

      ballsList.push({
        match_id: matchId,
        season,
        innings,
        over,
        ball,
        batter: striker,
        bowler,
        non_striker: nonStriker,
        runs_batter: runsBatter,
        extra_runs: extraRuns,
        total_runs: totalRuns,
        is_wicket: isWicket,
        player_dismissed: playerDismissed,
        dismissal_kind: dismissalKind,
        wides,
        noballs,
        batting_team: batTeam.name,
        bowling_team: bowlTeam.name,
        target_runs: targetRuns,
      });

      if (runsBatter % 2 === 1) {
        const temp = striker;
        striker = nonStriker;
        nonStriker = temp;
      }
    }

    const temp = striker;
    striker = nonStriker;
    nonStriker = temp;
  }
}

// 1. ball_by_ball.csv
const bbbCsv = Papa.unparse(balls);
fs.writeFileSync(path.join(outDir, 'ball_by_ball.csv'), bbbCsv);
console.log(`Saved ball_by_ball.csv (${balls.length} deliveries)`);

// 2. matches.csv
const matchesCsv = Papa.unparse(matches);
fs.writeFileSync(path.join(outDir, 'matches.csv'), matchesCsv);
console.log(`Saved matches.csv (${matches.length} fixtures)`);

// 3. competitions.csv
const compCsv = Papa.unparse(competitions);
fs.writeFileSync(path.join(outDir, 'competitions.csv'), compCsv);
console.log(`Saved competitions.csv (${competitions.length} competitions)`);

// 4. playing_eleven.csv
const peCsv = Papa.unparse(playingEleven);
fs.writeFileSync(path.join(outDir, 'playing_eleven.csv'), peCsv);
console.log(`Saved playing_eleven.csv (${playingEleven.length} entries)`);

// 5. competition_team_player_mapping.csv
const mapCsv = Papa.unparse(mappings);
fs.writeFileSync(path.join(outDir, 'competition_team_player_mapping.csv'), mapCsv);
console.log(`Saved competition_team_player_mapping.csv (${mappings.length} mappings)`);

console.log('All 5 dataset files generated successfully in sample_data/ !');
