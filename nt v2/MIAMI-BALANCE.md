# Miami Hard Mode · REACTOR 5.2

Arcade scoring, reactor pressure, refill, timing, and Overdrive retain their existing rules. Hard Mode upgrades the Adventure campaign rather than changing Arcade or requiring a reset.

## Configured missions

S = Standard (2 adjacent hits), R = Reinforced (4), X = cyan Reactor Seal (2 qualifying hits). A seal accepts a cascade or an adjacent manual clear of at least five crystals. Each wave may hit any lock once. Locks are fixed gravity separators. Topology validation checks that required neighbors and fragment sockets can participate in a legal group. A deterministic recovery still supplies an adjacent pair when the board runs out of groups.

| Level | Before | After |
| --- | --- | --- |
| 1 Welcome to Miami | 2,500 pts | 22,000 pts |
| 2 Ocean Drive | 5,000 pts | 27,000 pts · 15 combos |
| 3 Palm Beach Fever | 6,000 pts · 30 moves | 28,000 pts · 66 moves |
| 4 Sunset Boulevard | 7,500 pts · 3 combos | 33,000 pts · 22 combos · ≤65% pressure |
| 5 The Golden Hour | 10,000 pts · 35 moves | 38,000 pts · 2 Overdrive · 88 moves |
| 6 Purple Haze | 4 locks | 4 locks · 41,000 pts · S/R/X 4/0/0 |
| 7 Collins Avenue | 10,500 pts · 34 moves | 47,000 pts · 106 moves |
| 8 Neon Boulevard | 6 locks · 8,000 pts · 35 moves | 6 locks · 49,000 pts · 116 moves · S/R/X 5/1/0 |
| 9 Vice City Lights | 12,000 pts · 150 s | 53,000 pts · 169 s |
| 10 Midnight Calling | 3 fragments · 35 moves | 4 fragments · 57,000 pts · 196 s |
| 11 After Sunset | 4 fragments | 5 fragments · 62,000 pts · 35 combos |
| 12 Electric Paradise | 18,000 pts · 35 moves | 68,000 pts · 142 moves |
| 13 South Beach Underground | 4 locks · 2 fragments · 44 moves | 6 locks · 3 fragments · 66,000 pts · 148 moves · S/R/X 3/3/0 |
| 14 Neon Overload | 1 Overdrive · 15,000 pts · 180 s | 3 Overdrive · 74,000 pts · 242 s |
| 15 Miami Heat | 25,000 pts · 6 locks · 45 moves | 83,000 pts · 7 locks · 175 moves · S/R/X 3/3/1 |
| 16 The Last Drive | 30,000 pts · 40 moves | 94,000 pts · 176 moves |
| 17 Nightfall Protocol | 5 fragments · 6 locks · 48 moves | 5 fragments · 8 locks · 98,000 pts · 202 moves · S/R/X 3/3/2 |
| 18 Electric Storm | 35,000 pts · 210 s | 103,000 pts · ≤64% pressure · 296 s |
| 19 The Final Overdrive | 2 Overdrive · 40,000 pts · 70 moves | 4 Overdrive · 110,000 pts · ≤63% pressure · 212 moves |
| 20 Miami 1986: LEGEND | 45,000 pts · 5 fragments · 6 locks · 1 Overdrive | 124,000 pts · 5 fragments · 8 locks · 4 Overdrive · ≤65% pressure · 230 moves · 440 s · S/R/X 3/3/2 |

## Rating and migration

A win earns one star. Two stars require at most 70% pressure, at least 3.90 crystals per manual clear on average, and 12% of any move and time budgets remaining. Three stars require at most 44% pressure, a level-specific average shown in the briefing, and 26% of any budgets remaining. The higher average is generally 4.17–4.95 depending on chapter and mission features. Level 8 was tuned to 4.35 after checking three-star feasibility. Timers exclude pause, hidden pages and mandatory settlement.

The existing profile schema retains its best-ever stars, wins, XP, and rewards. Pre-5.2 results are snapshotted in campaign.legacyLevels. Hard Mode stars and score records are stored in campaign.mastery['miami-hard-5.2']. A harder replay cannot reduce a historic star total or reissue a chapter reward.

## Before and after

Five seeds (326, 7001, 94011, 30103, 1959) per level and policy produced 400 trials per version. Both builds used 1.9 seconds per attempted decision with the same policy code. Policies choose uniform random legal clears, the largest group, objective-weighted groups with a heat guard, or objective-aware groups with a preference for preserving large clears near Overdrive. Metrics use actual Phaser-engine logic driven by a headless clock. Successes use arithmetic means. Pressure is sampled after each accepted manual clear, and score shares use all attempts. Automatic dead-board recoveries are counted separately.

| Rules | Strategy | Wins / 100 | Winning moves | Winning seconds | Winning score | Stars 1/2/3 | Mean pressure | Points/manual group | Score from cascades | Overdrives/attempt | Recoveries |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Before | random | 67 | 12 | 21 | 7514 | 5/5/57 | 34.1% | 156 | 72% | 0.3 | 0 |
| Before | largest | 99 | 16 | 29 | 16013 | 2/5/92 | 5.4% | 446 | 55% | 0.8 | 0 |
| Before | objectives | 90 | 17 | 30 | 14565 | 3/4/83 | 10.1% | 401 | 50% | 0.8 | 0 |
| Before | overdrive | 94 | 17 | 31 | 15569 | 5/4/85 | 9.9% | 423 | 50% | 0.8 | 0 |
| 5.2 | random | 4 | 36 | 67 | 27389 | 4/0/0 | 52.6% | 173 | 71% | 0.8 | 0 |
| 5.2 | largest | 94 | 63 | 118 | 64188 | 12/51/31 | 14.1% | 470 | 53% | 2.7 | 0 |
| 5.2 | objectives | 63 | 68 | 128 | 57089 | 17/39/7 | 24.8% | 367 | 50% | 2.4 | 0 |
| 5.2 | overdrive | 71 | 65 | 121 | 57359 | 19/46/6 | 23.5% | 393 | 50% | 2.5 | 0 |

Largest-group wins averaged 53, 92, 129, 205 seconds per chapter, respectively. Summing per-level successful means gives 40.3 minutes. A simple independent-retry estimate using sampled failure durations gives 43.7 minutes, excluding menus, movies, breaks, and decisions at other speeds. These are bot estimates. No human 45–75 minute completion time has been verified.

## Final score distribution across all attempts

| Rules | Strategy | Final score P10 | Median | P90 |
| --- | --- | ---: | ---: | ---: |
| Before | random | 3,350 | 8,332 | 18,727 |
| Before | largest | 3,766 | 10,830 | 37,908 |
| Before | objectives | 3,483 | 11,508 | 35,056 |
| Before | overdrive | 3,483 | 11,592 | 35,171 |
| 5.2 | random | 9,979 | 19,325 | 31,561 |
| 5.2 | largest | 28,251 | 57,924 | 104,741 |
| 5.2 | objectives | 23,257 | 45,032 | 94,171 |
| 5.2 | overdrive | 23,330 | 49,153 | 97,432 |

## 5.2 seeded reachability

| Level | Random | Largest | Objectives | Overdrive | Best stars |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 1/5 | 5/5 | 5/5 | 5/5 | 3 |
| 2 | 2/5 | 5/5 | 4/5 | 5/5 | 3 |
| 3 | 1/5 | 5/5 | 4/5 | 5/5 | 3 |
| 4 | 0/5 | 5/5 | 4/5 | 5/5 | 3 |
| 5 | 0/5 | 5/5 | 3/5 | 4/5 | 3 |
| 6 | 0/5 | 5/5 | 3/5 | 3/5 | 3 |
| 7 | 0/5 | 5/5 | 3/5 | 4/5 | 3 |
| 8 | 0/5 | 4/5 | 5/5 | 5/5 | 3 |
| 9 | 0/5 | 5/5 | 3/5 | 4/5 | 3 |
| 10 | 0/5 | 5/5 | 5/5 | 5/5 | 3 |
| 11 | 0/5 | 5/5 | 4/5 | 4/5 | 3 |
| 12 | 0/5 | 5/5 | 3/5 | 3/5 | 3 |
| 13 | 0/5 | 4/5 | 3/5 | 3/5 | 3 |
| 14 | 0/5 | 5/5 | 3/5 | 3/5 | 3 |
| 15 | 0/5 | 3/5 | 1/5 | 1/5 | 3 |
| 16 | 0/5 | 5/5 | 3/5 | 3/5 | 3 |
| 17 | 0/5 | 4/5 | 2/5 | 1/5 | 3 |
| 18 | 0/5 | 5/5 | 2/5 | 3/5 | 3 |
| 19 | 0/5 | 5/5 | 1/5 | 2/5 | 3 |
| 20 | 0/5 | 4/5 | 2/5 | 3/5 | 3 |

Run node "nt v2/miami.balance.cjs" results.json to reproduce the matrix on the checked-out version. Run node "nt v2/adventure.test.cjs" for gameplay and migration checks, and node "nt v2/js/cutscenes.test.cjs" for the cinematic manifest.
