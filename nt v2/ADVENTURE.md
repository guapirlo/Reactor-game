# REACTOR 5.1.0 · Adventure Foundation

Arcade and Adventure share the Phaser scene, connected groups, pressure, scoring, energy and cascades. Adventure adds a mission state, authored openings, fixed obstacles, and a separate completion gate. Its score never updates the Arcade record. A move starts only when a valid group is accepted. The move must settle before the objective can win. Reactor meltdown takes priority while a move is settling. Countdowns suspend with pause, hidden tabs and cascade animation, while the shared pressure clock retains its original behavior during active play.

A lock blocks matching and separates its column into gravity segments. Reinforced locks take two adjacent clears on distinct waves. A fragment is a fixed socket. Clearing the crystal covering it collects the fragment. A short-lived storm cell releases automatically. If the Adventure board has no valid group, a deterministic adjacent pair is restored. Normal refills still use the Arcade random generator. Hard Mode awards extra stars for pressure control, efficient clears, and margin on applicable move or time budgets.

## Miami missions

See [Miami Hard Mode](MIAMI-BALANCE.md) for the current missions, rating criteria, and before/after simulation.

## Saves and progression

The new `reactor.profile.v2` record stores profile, scoped statistics, Adventure results, achievement timestamps, secrets and language. Existing settings, tutorial data, Arcade high score, world preference and achievement storage keep their original keys. The known legacy record and known unlocks are copied into the new profile, with no fabricated dates or historical totals. Invalid profile fields recover independently. Historical activity is unavailable, so score and playtime totals begin with finished sessions. Started counters also record aborted attempts. XP is awarded on a legitimate Arcade finish, new Adventure clears, star improvements and unique discoveries. Retrying a result or refreshing cannot award its XP again.

## Adding music

Place original tracks inside `nt v2/audio/`. Configure the two empty entries in `WORLDS['miami-1986'].music` in `js/adventure.js`. Index 1 is Violet Hour and index 2 is Neon Nights. Use relative paths such as `./audio/miami-violet.mp3`. Golden Hour and After Dark use the existing Miami Reactor track. Empty or failed slots fall back to `fallback`. Check the asset URL on a Pages preview and test transitions with a fresh browser interaction.

## Adding Ouagadougou

The registry includes Ouagadougou as unavailable. Add a world configuration with chapters, validated levels, theme and reward identifiers, relative media paths and a fallback. Connect a presentation skin and add its localized campaign copy. Extend the player save with a world-scoped campaign bucket and wire the selection screen to pass the new world and bucket into the campaign renderer. The level runner, gravity, objective evaluation and star rules accept the same data model. Add seeded simulations and browser coverage before marking the campaign available.

## Verification

Run `node "nt v2/adventure.test.cjs"` from the repository root. The [balance report](MIAMI-BALANCE.md) lists reproducible seeded results for the current campaign.
