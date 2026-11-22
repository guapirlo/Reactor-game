# REACTOR 5.1.0 · Adventure Foundation

Arcade and Adventure share the Phaser scene, connected groups, pressure, scoring, energy and cascades. Adventure adds a mission state, authored openings, fixed obstacles, and a separate completion gate. Its score never updates the Arcade record. A move starts only when a valid group is accepted. The move must settle before the objective can win. Reactor meltdown takes priority while a move is settling. Countdowns suspend with pause, hidden tabs and cascade animation, while the shared pressure clock retains its original behavior during active play.

A lock blocks matching and separates its column into gravity segments. Reinforced locks take two adjacent clears on distinct waves. A fragment is a fixed socket. Clearing the crystal covering it collects the fragment. A short-lived storm cell releases automatically. If the Adventure board has no valid group, a deterministic adjacent pair is restored. Normal refills still use the Arcade random generator. Two and three stars require at least 18% and 33% margin respectively across pressure headroom and any time or move limit.

## Miami missions

| Level | Chapter | Mission | Objectives | Limits |
| --- | --- | --- | --- | --- |
| 1 | Golden Hour | Welcome to Miami | score 2,500 | None |
| 2 | Golden Hour | Ocean Drive | score 5,000 | None |
| 3 | Golden Hour | Palm Beach Fever | score 6,000 | 30 moves |
| 4 | Golden Hour | Sunset Boulevard | score 7,500, combos 3 | None |
| 5 | Golden Hour | The Golden Hour | score 10,000 | 35 moves |
| 6 | Violet Hour | Purple Haze | locks 4 | None |
| 7 | Violet Hour | Collins Avenue | score 10,500 | 34 moves |
| 8 | Violet Hour | Neon Boulevard | locks 6, score 8,000 | 35 moves |
| 9 | Violet Hour | Vice City Lights | score 12,000 | 150 s |
| 10 | Violet Hour | Midnight Calling | fragments 3 | 35 moves |
| 11 | Neon Nights | After Sunset | fragments 4 | None |
| 12 | Neon Nights | Electric Paradise | score 18,000 | 35 moves |
| 13 | Neon Nights | South Beach Underground | locks 4, fragments 2 | 44 moves |
| 14 | Neon Nights | Neon Overload | overdrive 1, score 15,000 | 180 s |
| 15 | Neon Nights | Miami Heat | score 25,000, locks 6 | 45 moves |
| 16 | Miami After Dark | The Last Drive | score 30,000 | 40 moves |
| 17 | Miami After Dark | Nightfall Protocol | fragments 5, locks 6 | 48 moves |
| 18 | Miami After Dark | Electric Storm | score 35,000 | 210 s |
| 19 | Miami After Dark | The Final Overdrive | overdrive 2, score 40,000 | 70 moves |
| 20 | Miami After Dark | Miami 1986: LEGEND | score 45,000, fragments 5, locks 6, overdrive 1 | None |

## Saves and progression

The new `reactor.profile.v2` record stores profile, scoped statistics, Adventure results, achievement timestamps, secrets and language. Existing settings, tutorial data, Arcade high score, world preference and achievement storage keep their original keys. The known legacy record and known unlocks are copied into the new profile, with no fabricated dates or historical totals. Invalid profile fields recover independently. Historical activity is unavailable, so score and playtime totals begin with finished sessions. Started counters also record aborted attempts. XP is awarded on a legitimate Arcade finish, new Adventure clears, star improvements and unique discoveries. Retrying a result or refreshing cannot award its XP again.

## Adding music

Place original tracks inside `nt v2/audio/`. Configure the two empty entries in `WORLDS['miami-1986'].music` in `js/adventure.js`. Index 1 is Violet Hour and index 2 is Neon Nights. Use relative paths such as `./audio/miami-violet.mp3`. Golden Hour and After Dark use the existing Miami Reactor track. Empty or failed slots fall back to `fallback`. Check the asset URL on a Pages preview and test transitions with a fresh browser interaction.

## Adding Ouagadougou

The registry includes Ouagadougou as unavailable. Add a world configuration with chapters, validated levels, theme and reward identifiers, relative media paths and a fallback. Connect a presentation skin and add its localized campaign copy. Extend the player save with a world-scoped campaign bucket and wire the selection screen to pass the new world and bucket into the campaign renderer. The level runner, gravity, objective evaluation and star rules accept the same data model. Add seeded simulations and browser coverage before marking the campaign available.

## Verification

From the repository root run `node "nt v2/adventure.test.cjs"`. It includes the existing pressure suite. The simulated policy prioritizes large groups, reachable objectives and cooling at high pressure. It completes all 20 levels on each of seeds 326, 7001 and 94011. Every level also has a three-star result on at least one of those seeds. These runs test reachability, not human difficulty. Timers, obstacles, replay rewards, migrations and localization also have deterministic coverage. Browser checks used Chromium touch emulation. No physical Galaxy S23 Ultra was available.
