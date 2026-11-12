const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zip = new JSZip();
const dataDir = path.join(__dirname, '../sample_data');

const files = [
  'ball_by_ball.csv',
  'matches.csv',
  'competitions.csv',
  'playing_eleven.csv',
  'competition_team_player_mapping.csv',
];

for (const f of files) {
  const filePath = path.join(dataDir, f);
  if (fs.existsSync(filePath)) {
    zip.file(f, fs.readFileSync(filePath));
  }
}

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }).then((buf) => {
  const outZipPath = path.join(dataDir, 'CIRA_Cricket_Datasets_2022_2024.zip');
  fs.writeFileSync(outZipPath, buf);
  console.log(`Zipped package created successfully: ${outZipPath} (${(buf.length / 1024).toFixed(1)} KB)`);
});
