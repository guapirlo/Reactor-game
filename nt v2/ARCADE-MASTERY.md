# REACTOR 5.3.0 — Arcade Mastery

## Base and scope

The branch starts at #36 (5.2.1), which contains the Ocean Drive epilogue, the localized map titles and the original objective gauge. The existing campaign route, cutscene art, audio files, gem rules and Arcade scoring are reused.

The former text strip is now a primary objective gauge and individual icon-and-text counters. An Adventure tap previews the connected group and any qualifying extra impacts without adding a confirmation or an input delay. Locks show durability and respond to hits. The roadmap distinguishes earned stars from outlines. Mission briefings separate optional bonuses from requirements.

## Campaign changes

Unlisted goals, limits, layouts and star rules carry over from 5.2.1. A large group means at least eight gems in one manual clear. A wave means one actual automatic cascade step and can contain multiple groups.

| Level | 5.2.1 | 5.3 |
| --- | --- | --- |
| 1 Welcome to Miami | 22k | Same |
| 2 Ocean Drive | 27k, 15 combos | Same |
| 3 Palm Beach Fever | 28k, 66 moves | Same |
| 4 Sunset Boulevard | 33k, 22 combos, finish at ≤65% pressure | Same |
| 5 The Golden Hour | 38k, 2 Overdrives, 88 moves | The New Kid adds 1 large group and allows 92 moves |
| 6 Purple Haze | 4 locks, 41k | 4 locks, 32k |
| 7 Collins Avenue | 47k, 106 moves | 47k, 96 moves |
| 8 Neon Boulevard | 6 locks, 49k, 116 moves | Same goals, introduces extra lock impacts at size 8 |
| 9 Vice City Lights | 53k, 169s | Adds 8 waves |
| 10 Midnight Calling | 4 fragments, 57k, 196s | No Respect adds 4 locks (3 standard, 1 reinforced), 118 moves and 216s |
| 11 After Sunset | 5 fragments, 62k, 35 combos | 5 fragments, 52k |
| 12 Electric Paradise | 68k, 142 moves | Adds 2 large groups |
| 13 South Beach Underground | 6 locks, 3 fragments, 66k, 148 moves | Adds 10 waves, size 12 can hit a second lock |
| 14 Neon Overload | 3 Overdrives, 74k, 242s | Same |
| 15 Miami Heat | 83k, 7 locks, 175 moves | Bad Business adds 15 waves and extra lock impacts |
| 16 The Last Drive | 94k, 176 moves | 78k, 160 moves |
| 17 Nightfall Protocol | 5 fragments, 8 locks, 98k, 202 moves | Same goals, adds extra lock impacts |
| 18 Electric Storm | 103k, finish at ≤64% pressure, 296s | Adds 15 waves |
| 19 The Final Overdrive | 4 Overdrives, 110k, finish at ≤63% pressure, 212 moves | Same |
| 20 Miami 1986: LEGEND | 124k, 5 fragments, 8 locks, 4 Overdrives, finish at ≤65% pressure, 230 moves, 440s | King of Miami adds 3 large groups and extra lock impacts |

## Lock and mastery rules

- Standard locks still take two adjacent impacts. Reinforced locks still take four durability damage. Reactor seals still take two impacts and require an adjacent group of at least five or a cascade.
- In configured missions, a manual group of at least eight hits one eligible adjacent reinforced lock or seal for one extra damage. In chapters III and IV, a group of twelve can do the same to a second distinct target. Candidates with the most durability come first, with row-major position breaking ties. Extra damage applies only when the target has more than one durability left. Cascades never produce an extra impact.
- The original efficiency, pressure and remaining-resource star calculations carry over, so the score gauge has no artificial star ticks.
- After clearing the campaign, the map shows actual 5.3 achievements per mission for three stars, optional bonus, finish at ≤35% pressure, and victory without Overdrive. Optional bonuses carry no progression requirements or repeatable rewards.
- Existing best stars, unlocks, cosmetic grants and 5.2 results remain stored. The new mastery ledger uses `miami-hard-5.3` under the existing profile key.

## Seeded comparison

Run `node "nt v2/miami.balance.cjs" /tmp/miami.json`. Each revision uses five matching seeds per level for 400 attempts. Bots make decisions at a fixed 1.9-second cadence. The time column is the median modeled win duration, in seconds.

| Policy | Wins 5.2 → 5.3 (of 100) | 3-star wins 5.2 → 5.3 | Median win seconds 5.2 → 5.3 |
| --- | ---: | ---: | ---: |
| Random | 4 → 4 | 0 → 0 | 64.0 → 64.0 |
| Largest group | 94 → 95 | 31 → 33 | 111.4 → 108.7 |
| Objective-aware | 63 → 62 | 7 → 5 | 120.0 → 113.2 |
| Overdrive-aware | 71 → 69 | 6 → 7 | 114.1 → 104.8 |

Every mission produced a seeded win and a three-star result. The largest-group bot won 3/5 on level 17 and at least 4/5 on all others. Neither revision showed a dead board or used a recovery in this sample. The results describe these bots and seeds. They do not establish human difficulty or device performance.
