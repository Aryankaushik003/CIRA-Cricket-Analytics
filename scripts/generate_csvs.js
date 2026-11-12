import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import generator logic directly
import { generateSampleDataset } from '../src/engine/sampleDataGenerator.ts';

const outDir = path.join(__dirname, '../sample_data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating sample dataset files...');
const bundle = generateSampleDataset();

// 1. ball_by_ball.csv
const bbbCsv = Papa.unparse(bundle.balls);
fs.writeFileSync(path.join(outDir, 'ball_by_ball.csv'), bbbCsv);
console.log(`Saved ball_by_ball.csv (${bundle.balls.length} deliveries)`);

// 2. matches.csv
const matchesCsv = Papa.unparse(bundle.matches);
fs.writeFileSync(path.join(outDir, 'matches.csv'), matchesCsv);
console.log(`Saved matches.csv (${bundle.matches.length} fixtures)`);

// 3. competitions.csv
const compCsv = Papa.unparse(bundle.competitions);
fs.writeFileSync(path.join(outDir, 'competitions.csv'), compCsv);
console.log(`Saved competitions.csv (${bundle.competitions.length} competitions)`);

// 4. playing_eleven.csv
const peCsv = Papa.unparse(bundle.playingEleven);
fs.writeFileSync(path.join(outDir, 'playing_eleven.csv'), peCsv);
console.log(`Saved playing_eleven.csv (${bundle.playingEleven.length} entries)`);

// 5. competition_team_player_mapping.csv
const mapCsv = Papa.unparse(bundle.mappings);
fs.writeFileSync(path.join(outDir, 'competition_team_player_mapping.csv'), mapCsv);
console.log(`Saved competition_team_player_mapping.csv (${bundle.mappings.length} mappings)`);

console.log('All 5 dataset files generated successfully in sample_data/ !');
