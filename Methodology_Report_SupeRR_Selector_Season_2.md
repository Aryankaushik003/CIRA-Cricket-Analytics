# CIRA: Clutch-Index & Improbable Resilience Analytics
## Methodology Report — SupeRR Selector Season 2 (Rajasthan Royals)
**Submission Category:** Round 1 Problem Statement: *Identify the Most Reliable Players Under Pressure*  
**Evaluation Scope:** Historical IPL & T20 International Data (2022 – Present)  
**Author:** Aryan Kaushik  
**Dataset Scale:** 200,999 Deliveries | 883 Fixtures | 141 Competitions  
**Eligibility Rule Applied:** IPL Auction Eligibility Filtering (Complete Exclusion of Non-Eligible Pakistani Players)  

---

### Executive Summary

In T20 cricket and specifically for franchise strategy in the **Indian Premier League (IPL)**, standard aggregate metrics such as overall strike rate or raw bowling economy fail to capture critical situational value. Scoring 24 runs off 10 balls when requiring 14 runs per over against elite death bowlers in a collapsing chase is fundamentally distinct from accumulating powerplay runs against fielding restrictions.

**CIRA (Clutch-Index & Improbable Resilience Analytics)** is an advanced, data-driven framework developed to isolate, quantify, and rank players who excel when the contest is on the line. 

Importantly, in accordance with **IPL Auction Governing Regulations**, all players who represent Pakistan or Pakistani domestic/A teams are **ineligible for the IPL Player Auction**. The CIRA pipeline integrates an automated compliance filter that cross-references all 200,999 deliveries against team affiliations (`team_id: 25`, `team_id: 341`, national representative status), ensuring that the final Top 10 Batters and Top 10 Bowlers represent actionable, auction-eligible targets for franchise recruitment.

---

### 1. Pressure Definition & Match Context Formulation

Pressure in cricket is multi-dimensional and escalates as the probability of failure increases. In CIRA, every legal delivery is scored with a continuous Situational Pressure Index ($PI \ge 1.0$):

```
       ┌────────────────────────────────────────────────────────┐
       │               SITUATIONAL PRESSURE INDEX (PI)          │
       ├──────────────────────────┬─────────────────────────────┤
       │ 2nd Innings (Chase):     │ 1st Innings / Death:        │
       │ • Dynamic RRR > 8.0      │ • Death Phase (Overs 16-20) │
       │ • Critical RRR ≥ 12.0    │ • Powerplay Collapse (≥3 wk)│
       │ • Low Wickets Lost (≥6)  │ • Target Defense (≤160)     │
       └──────────────────────────┴─────────────────────────────┘
                                  │
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │      ANCHOR COLLAPSE MULTIPLIER (1.5x for 15 Balls)    │
       │ Dismissal of Team's Premier Season Run Aggregate Leader│
       └────────────────────────────────────────────────────────┘
                                  │
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │     IMPROBABLE RESILIENCE INDEX (IRIS) EVALUATION      │
       │ Batting: Lost-Cause Chases (RRR ≥ 18.0) Intent & Bnd % │
       │ Bowling: Dot-Ball Squeeze & Zero Extras in Death Overs │
       └────────────────────────────────────────────────────────┘
```

#### A. Dynamic Required Run Rate (RRR)
For chasing innings (Innings 2):
$$\text{RRR} = \frac{\max(0, \text{Target} - \text{Current Innings Runs})}{\max(1, 120 - \text{Legal Balls Bowled})} \times 6$$
- **Thresholds:**
  - $\text{RRR} > 8.0$: Triggers high-pressure calculation ($+0.15 \times (\text{RRR} - 8.0)$).
  - $\text{RRR} \ge 12.0$: Critical jeopardy bonus ($+0.35$).
  - Wickets Lost $\ge 6$: Tailender exposure bonus ($+0.40$).

#### B. Death Overs & Early Collapse Leverage
- **Death Phase:** Overs 16 through 20 (`overid >= 16`) automatically receive a $+0.50$ PI bonus.
- **Top-Order Collapse:** First-innings powerplay collapse ($\ge 3$ wickets down within first 6 overs) increases delivery pressure by $+0.50$.

---

### 2. The Anchor Collapse Factor (1.5x Multiplier)

When a franchise loses its primary anchor, opposition bowling attacks aggressively attack to trigger a collapse, while incoming batters face acute psychological tension.
- **Automated Anchor Identification:** CIRA parses all match records to identify each team's highest aggregate run-scorer for each season (e.g., Virat Kohli for RCB, Shubman Gill for GT, Heinrich Klaasen for SRH, Sanju Samson for CSK/RR).
- **The 1.5x Surge Window:** Upon the anchor's dismissal, the Pressure Index of the subsequent **15 deliveries** is amplified by **1.5×** ($PI_{\text{effective}} = PI \times 1.50$).
- **Significance:** This 2.5-over window isolates batters who counter-attack versus those who succumb to opposition momentum.

---

### 3. Improbable Resilience Index (IRIS)

#### Batting IRIS (Lost-Cause Situations)
Quantifies performance in near-impossible chases (win probability $<5\%$ or $\text{RRR} \ge 18.0$):
$$\text{IRIS}_{\text{bat}} = (0.45 \times \text{BoundaryRate}_{\text{lost\_cause}}) + (0.35 \times \frac{\text{IntentSR}}{2}) + (0.20 \times \text{DotAversion})$$
Rewards fearless ball-striking, high intent, and boundary conversion when conventional probability dictates defeat.

#### Bowling IRIS (Defending Low Totals & Death Discipline)
Rewards bowlers defending par or sub-par totals ($\le 160$ runs) and operating in the death overs:
$$\text{IRIS}_{\text{bowl}} = (0.40 \times \text{DotBall\%}) + (0.35 \times \text{ExtraControlRate}) + (0.25 \times \text{EconFactor})$$
Bowlers who maintain dot-ball pressure without conceding free hits or wides at the death achieve top ratings.

---

### 4. Player Eligibility & Fair Comparisons

1. **IPL Auction Eligibility Rule:** All 68 players affiliated with Pakistan national or representative teams (`team_id: 25`, `team_id: 341`) were purged from the candidate selection pool to guarantee that every ranked player is legally signable in the IPL Auction.
2. **Sample Size Rigor:**
   - **Batters:** Minimum **50 pressure deliveries faced** ($PI \ge 1.45$).
   - **Bowlers:** Minimum **48 pressure deliveries bowled** (8 completed pressure overs).
3. **Cross-Competition Normalization:** Balances performances across IPL and T20 International fixtures (2022 onwards) without inflating small-sample blitzes.

---

### 5. Final Top 10 Player Rankings (IPL Auction Eligible)

#### **Top 10 Batters Under Pressure**
*(Rank order for Unstop dropdown selections)*

| Rank | Player | Franchise / Team | Pressure SR | Baseline SR | SR Delta ($\Delta$) | Collapse SR (1.5×) | Boundary % | IRIS Score | Clutch Rating |
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

#### **Top 10 Bowlers Under Pressure**
*(Rank order for Unstop dropdown selections)*

| Rank | Player | Franchise / Team | Pressure Econ | Baseline Econ | Econ Delta ($\Delta$) | Dot Ball % | Extra Control % | Wickets | IRIS Score | Clutch Rating |
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

### 6. Analytical Insights & Key Highlights

1. **Vaibhav Sooryavanshi (#1 Batter):** Exhibits unprecedented strike acceleration under acute pressure ($214.7$ Pressure SR), jumping to a stunning $244.0$ SR in post-anchor collapse windows with an elite $99.5$ IRIS rating.
2. **Jasprit Bumrah (#5 Bowler):** Despite bowling predominantly at the death across 78 high-pressure wickets, maintains an extraordinary economy of $6.70$ and $40.1\%$ dot-ball percentage with $100\%$ extra discipline.
3. **Sunil Narine (#3 Bowler):** Proves invaluable as a four-over defensive stranglehold, sustaining an economy of $6.19$ under pressure with $46$ high-leverage dismissals.
4. **Reproducibility:** All scripts, calculations, and visualizers are interactive in real-time on the CIRA application dashboard.
