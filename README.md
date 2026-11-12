# CIRA: Clutch-Index & Improbable Resilience Analytics
### Advanced Cricket Situational Pressure & Resilience Analytics (2022 – Present)
**Official Entry for Rajasthan Royals — SupeRR Selector Season 2**  
*Problem Statement: Identify the Most Reliable Players Under Pressure*

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

---

## 📌 Overview

Standard aggregate metrics (overall strike rate, average, economy rate) fail to isolate true performance under high-leverage match conditions. A run scored when needing 14 runs per over in the death overs against elite pacers is fundamentally different from a run scored in an uncontested powerplay.

**CIRA (Clutch-Index & Improbable Resilience Analytics)** is an end-to-end full-stack data science platform and analytical engine designed to quantify and rank cricket players who consistently deliver when matches are on the line.

---

## ⚡ Key Analytical Pillars

### 1. Situational Pressure Index (PI)
Evaluates dynamic game state per delivery:
- **Continuous Required Run Rate (RRR):** Calculated dynamically in second innings chases:
  $$\text{RRR} = \frac{\max(0, \text{Target} - \text{Current Runs})}{\max(1, 120 - \text{Legal Balls Bowled})} \times 6$$
- **High Pressure Triggers:** $\text{RRR} > 8.0$, Death Overs (Overs 16–20), or Low Wickets in Hand ($\ge 6$ wickets lost).
- **Base Formulation:**
  $$PI = 1.0 + \Delta_{\text{death}} (0.50) + \min(1.5, (\text{RRR} - 8.0) \times 0.15) + \Delta_{\text{wickets\_lost}}$$

### 2. Primary Anchor Collapse Multiplier (1.5×)
- Scans all deliveries to dynamically detect each team's primary season run leader (e.g., Virat Kohli, Shubman Gill, Heinrich Klaasen).
- Upon the anchor's dismissal, applies a **1.5× multiplier** ($PI_{\text{effective}} = PI \times 1.50$) to the next **15 deliveries**, isolating batters who counter-attack versus those who succumb to opposition momentum.

### 3. Improbable Resilience Index (IRIS)
- **Batting IRIS:** Quantifies intent and boundary rates in near-impossible chases ($\text{RRR} \ge 18.0$ or win probability $< 5\%$):
  $$\text{IRIS}_{\text{bat}} = (0.45 \times \text{BoundaryRate}_{\text{lost\_cause}}) + (0.35 \times \frac{\text{IntentSR}}{2}) + (0.20 \times \text{DotAversion})$$
- **Bowling IRIS:** Rewards bowlers who maintain dot-ball pressure and zero illegal extras when defending low totals ($\le 160$ runs) or death overs.

### 4. IPL Auction Eligibility Filtering
- In compliance with official **IPL Player Auction regulations**, all Pakistani national and representative players (`team_id: 25`, `team_id: 341`) are filtered out, ensuring the final Top 10 rankings represent legally signable, auction-eligible targets.

---

## 🏆 Final Official Rankings (2022 – Present)

### Top 10 Batters Under Pressure
| Rank | Player | Franchise / Team | Pressure SR | Baseline SR | SR Delta (Δ) | Collapse SR (1.5×) | Boundary % | IRIS Score | Clutch Rating |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Vaibhav Sooryavanshi** | Rajasthan Royals / India | 214.7 | 211.3 | +3.4 | 244.0 | 37.4% | 99.5 | **98.5** |
| **2** | **Urvil Patel** | Chennai Super Kings | 220.7 | 193.1 | +27.6 | 222.2 | 36.2% | 99.5 | **97.2** |
| **3** | **Priyansh Arya** | Punjab Kings | 179.2 | 182.7 | -3.5 | 214.3 | 31.0% | 85.9 | **87.7** |
| **4** | **Phil Salt** | England | 168.8 | 163.6 | +5.2 | 192.0 | 26.3% | 94.4 | **85.7** |
| **5** | **Jake McGurk** | Australia / Delhi Capitals | 174.0 | 171.8 | +2.2 | 174.0 | 28.6% | 81.1 | **80.8** |
| **6** | **Tim David** | Australia / Mumbai Indians | 175.4 | 168.4 | +6.9 | 174.3 | 25.2% | 73.4 | **80.6** |
| **7** | **Vipraj Nigam** | India / Delhi Capitals | 175.3 | 170.7 | +4.6 | 164.1 | 28.2% | 74.4 | **78.7** |
| **8** | **Rilee Rossouw** | South Africa / PBKS | 160.9 | 162.7 | -1.8 | 178.3 | 24.5% | 72.2 | **76.6** |
| **9** | **Naman Dhir** | India / Mumbai Indians | 167.4 | 164.5 | +2.8 | 134.9 | 25.4% | 77.5 | **75.7** |
| **10** | **Donovan Ferreira** | Rajasthan Royals | 171.7 | 158.8 | +12.9 | 181.4 | 25.0% | 56.5 | **75.6** |

---

### Top 10 Bowlers Under Pressure
| Rank | Player | Franchise / Team | Pressure Econ | Baseline Econ | Econ Delta (Δ) | Dot Ball % | Extra Control % | Wickets | IRIS Score | Clutch Rating |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Sonny Baker** | England / T20 | 4.78 | 5.69 | -0.92 | 61.1% | 100.0% | 5 | 74.3 | **84.7** |
| **2** | **Ashton Agar** | Australia | 4.47 | 5.01 | -0.53 | 41.8% | 100.0% | 1 | 67.2 | **79.1** |
| **3** | **Sunil Narine** | Kolkata Knight Riders | 6.19 | 6.66 | -0.47 | 37.4% | 100.0% | 46 | 61.8 | **79.0** |
| **4** | **Sharafuddin Ashraf** | Afghanistan | 5.66 | 6.41 | -0.75 | 37.6% | 100.0% | 7 | 63.0 | **78.6** |
| **5** | **Jasprit Bumrah** | Mumbai Indians / India | 6.70 | 6.64 | +0.06 | 40.1% | 100.0% | 78 | 61.8 | **78.5** |
| **6** | **Mujeeb Ur Rahman** | Afghanistan | 6.42 | 6.55 | -0.13 | 39.7% | 100.0% | 31 | 62.3 | **78.2** |
| **7** | **Logan van Beek** | Netherlands | 6.09 | 6.30 | -0.22 | 42.9% | 100.0% | 6 | 64.2 | **78.0** |
| **8** | **Mitchell Santner** | New Zealand / CSK | 6.51 | 6.97 | -0.46 | 35.9% | 100.0% | 60 | 60.5 | **77.8** |
| **9** | **Matt Hollard** | Ireland | 5.88 | 5.77 | +0.11 | 38.0% | 100.0% | 6 | 62.7 | **77.5** |
| **10** | **Mahedi Hasan** | Bangladesh | 6.69 | 6.74 | -0.05 | 41.5% | 100.0% | 26 | 62.4 | **77.4** |

---

## 💻 Tech Stack & Architecture

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React, Recharts (Radar charts), Canvas Confetti
- **Backend:** Node.js, Express 5, PapaParse, JSZip
- **Data Engine:** Streaming CSV processing with situational state machines and memory caching

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (v24 recommended)
- npm v9+

### Installation
```bash
git clone https://github.com/Aryankaushik003/CIRA-Cricket-Analytics.git
cd CIRA-Cricket-Analytics
npm install
```

### Running the App
1. Start the backend analytics server:
```bash
npm run server
```
2. Start the Vite development UI:
```bash
npm run dev
```
3. Open **http://localhost:3000** in your browser.

---

## 📄 Submission Files

- **`CIRA_Unstop_Official_Submission.json`**: Pre-formatted JSON output matching Unstop entry fields.
- **`Methodology_Report_SupeRR_Selector_Season_2.md`**: Complete methodology document covering mathematical definitions, sample size controls, and limitations.

---

## 📜 License
MIT License. Created by Aryan Kaushik for Rajasthan Royals SupeRR Selector Season 2.
