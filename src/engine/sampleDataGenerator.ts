import {
  RawBall,
  RawMatch,
  RawCompetition,
  RawPlayingEleven,
  RawTeamPlayerMapping,
} from '../types/cricket';

export interface SampleDatasetBundle {
  balls: RawBall[];
  matches: RawMatch[];
  competitions: RawCompetition[];
  playingEleven: RawPlayingEleven[];
  mappings: RawTeamPlayerMapping[];
}

export function generateSampleDataset(): SampleDatasetBundle {
  const competitions: RawCompetition[] = [
    { competition_id: 'IPL2022', name: 'Indian Premier League 2022', season: 2022, type: 'T20' },
    { competition_id: 'IPL2023', name: 'Indian Premier League 2023', season: 2023, type: 'T20' },
    { competition_id: 'IPL2024', name: 'Indian Premier League 2024', season: 2024, type: 'T20' },
  ];

  // Marquee teams and their designated anchors & clutch players
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

  const mappings: RawTeamPlayerMapping[] = [];
  const playingEleven: RawPlayingEleven[] = [];
  const matches: RawMatch[] = [];
  const balls: RawBall[] = [];

  // Build team player mappings
  for (const t of teams) {
    mappings.push({ competition_id: 'IPL2024', team_name: t.name, player_name: t.anchor });
    for (const b of t.topBatters) {
      mappings.push({ competition_id: 'IPL2024', team_name: t.name, player_name: b });
    }
    for (const bw of t.topBowlers) {
      mappings.push({ competition_id: 'IPL2024', team_name: t.name, player_name: bw });
    }
  }

  // Generate 45 realistic matches across 2022, 2023, 2024
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

      const targetRuns = 160 + ((matchId * 17) % 65); // 160 to 224

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

      // Playing Eleven
      const allT1Players = [team1.anchor, ...team1.topBatters, ...team1.topBowlers];
      const allT2Players = [team2.anchor, ...team2.topBatters, ...team2.topBowlers];

      for (const p of allT1Players) {
        playingEleven.push({ match_id: matchId, team: team1.name, player_name: p });
      }
      for (const p of allT2Players) {
        playingEleven.push({ match_id: matchId, team: team2.name, player_name: p });
      }

      // Generate Ball-by-ball for 1st Innings (Team 1 bat, Team 2 bowl)
      generateInningsDeliveries(balls, matchId, season, 1, team1, team2, 0);

      // Generate Ball-by-ball for 2nd Innings (Team 2 bat, Team 1 bowl, chasing targetRuns)
      generateInningsDeliveries(balls, matchId, season, 2, team2, team1, targetRuns);
    }
  }

  return {
    balls,
    matches,
    competitions,
    playingEleven,
    mappings,
  };
}

function generateInningsDeliveries(
  ballsList: RawBall[],
  matchId: number,
  season: number,
  innings: number,
  batTeam: any,
  bowlTeam: any,
  targetRuns: number
) {
  let currentRuns = 0;
  let wickets = 0;
  let batterIdx = 0;
  const battersLineup = [batTeam.anchor, ...batTeam.topBatters];
  let striker = battersLineup[0];
  let nonStriker = battersLineup[1];
  batterIdx = 2;

  // Let anchor get out around over 7-11 to trigger the 1.5x anchor collapse window!
  const anchorDismissOver = 7 + (matchId % 5);
  let anchorOutDone = false;

  for (let over = 0; over < 20; over++) {
    // Select bowler from bowling team
    const bowler = bowlTeam.topBowlers[over % bowlTeam.topBowlers.length];

    for (let ball = 1; ball <= 6; ball++) {
      let isWicket = 0;
      let playerDismissed: string | undefined = undefined;
      let dismissalKind: string | undefined = undefined;
      let runsBatter = 0;
      let wides = 0;
      let noballs = 0;

      // Check if target is achieved in 2nd innings
      if (innings === 2 && targetRuns > 0 && currentRuns >= targetRuns) {
        return;
      }

      // Check if all out
      if (wickets >= 10) {
        return;
      }

      // Calculate context
      const ballsBowledSoFar = over * 6 + ball;
      const ballsRemaining = Math.max(1, 120 - ballsBowledSoFar);
      const runsNeeded = Math.max(0, targetRuns - currentRuns);
      const rrr = innings === 2 ? (runsNeeded / ballsRemaining) * 6 : 8.0;

      // Anchor dismissal trigger
      if (!anchorOutDone && over === anchorDismissOver && ball === 3 && striker === batTeam.anchor) {
        isWicket = 1;
        playerDismissed = striker;
        dismissalKind = 'caught';
        wickets++;
        anchorOutDone = true;
        striker = battersLineup[batterIdx] || 'Lower Order';
        batterIdx++;
      } else {
        // Natural distribution with clutch traits for specific players
        const roll = Math.random();

        // Bowler influence
        let isTopBowler = ['Jasprit Bumrah', 'Rashid Khan', 'Matheesha Pathirana', 'Sunil Narine'].includes(bowler);
        let isClutchHitter = ['Heinrich Klaasen', 'Rinku Singh', 'Nicholas Pooran', 'Andre Russell', 'Suryakumar Yadav', 'MS Dhoni'].includes(striker);

        // Extras rate
        if (roll < (isTopBowler ? 0.02 : 0.06)) {
          wides = 1;
        }

        // Dot ball or boundaries
        if (wides === 0) {
          if (isTopBowler && over >= 15) {
            // Death overs against Bumrah/Rashid/Pathirana: high dot % & low boundaries
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
            // Clutch hitters under pressure: elevated 4s & 6s!
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
            // Standard baseline delivery
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

      // Strike rotation on singles/triples
      if (runsBatter % 2 === 1) {
        const temp = striker;
        striker = nonStriker;
        nonStriker = temp;
      }
    }

    // Over change strike switch
    const temp = striker;
    striker = nonStriker;
    nonStriker = temp;
  }
}
