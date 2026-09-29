# Friend Portals

An independent 3D Rare Friends Vibeathon adventure on a floating island. This repository has its own Git history and does not contain Friend Forge code.

## Concept

Explore a mysterious 3D island and solve four different portal puzzles. The intended journey is Island → Portal → Puzzle → Shard → Next Portal → Final activation.

## Current phase: The Restoration

Phase 2 completes Portal I. Walk through its gold portal into a compact floating temple. A light emitter feeds three rotatable crystals. Route the beam through all three engraved seals to charge the Portal Core, then approach and claim Portal Shard I. Walk into the temple's exit arch to return to the island. Portal I gains a completed rune and light; energy crosses the central monument and awakens Portal II. The HUD advances to **1 / 4 shards**.

Phase 3 completes Portal II. Its cyan portal leads to a twilight garden with five symbol-marked, musical Echo Runes around a three-part shrine. Watch and listen to each sequence, then **walk onto** the runes in the same order. The three seed-selected rounds contain 3, 4, and 5 echoes. A wrong step replays the current round after a short pause; earlier rounds stay complete. After the third round, approach the shrine to claim Portal Shard II, then manually use the exit arch. The HUD advances to **2 / 4 shards**. Portal II remains restored, the central monument shows two lit sockets, and an energy pulse awakens Portal III.

Phase 4 completes Portal III. In the suspended **Temple of Balance**, push weight-marked stone blocks across a constrained grid onto three pressure plates. First raise a counterweight, then reuse blocks to release a gate, and finally balance both sides at once. The bridge assembles toward the central shrine. Walk across it, claim Portal Shard III, and use the exit arch yourself. The HUD advances to **3 / 4 shards**, the monument lights its third socket, and an orange pulse awakens Portal IV.

Phase 5 completes Portal IV. Its violet portal leads to the **Celestial Observatory**, an open night chamber with an ancient moving astrolabe. Read the three-symbol constellation above it, then physically visit the Outer, Middle, and Inner control pedestals. Each ring turns continuously; press **E** or mobile **ACTION** as its target symbol crosses the fixed star marker. Alignment is forgiving, and a missed lock retries only that ring. The observation pedestal shows the clue again at any time. After all three rings align, the stars form a constellation and Portal Shard IV appears. Claim it at the center and manually return to the island. The HUD advances to **4 / 4 shards**, all portals are complete, and all four monument sockets glow. The four-shard monument finale begins only when the player returns to the island and activates the central structure.

Phase 6 completes the journey. With four shards, approach the ready Central Monument and press **E** or mobile **ACTION**. Light beams, Echo waves, Balance ground mechanisms, and Celestial stars reach its four sockets in sequence. The monument rises and draws a seed-derived **Journey Sigil** over the island. The restored island gains flowers, path runes, stable energy connections, and a brighter central structure. The completion screen shows the selected Friend, four restored portals, and a short Journey ID. **EXPLORE RESTORED ISLAND** returns control to the completed island; approach the monument again to view the sigil and screen. **NEW JOURNEY** asks for confirmation before clearing this session and generating a new seed. The new journey returns to 0/4 with only Portal I active. No token, NFT, blockchain reward, or permanent Journey history is created.

The beam uses an authored discrete route. One of eight verified crystal configurations is selected for each journey, so the required orientations change while the puzzle rules stay familiar. Each interaction advances exactly 90°. The route is Emitter → A → Seal I → B → Seal II → C → Seal III → Core. Beam visuals follow these logical links; gameplay does not rely on raycast precision. The crystals lock during their short rotation and after the route is solved. Reset returns to the **same journey's** initial orientations.

## Seeded journeys

A new journey gets one cryptographically generated `runSeed`, independent of the selected Friend ID. Named deterministic forks derive separate Light, Echo, Balance, Celestial, and world seeds. Adding a flower cannot change a portal solution. Light selects one of eight authored five-turn variants. Echo selects an authored pattern bank and transforms its rune positions. Balance selects one of six authored, logically verified block layouts. Celestial selects one of eight authored constellations; separate named seeds set each ring's starting angle, direction, and safe speed, plus the decorative starfield. The island varies small decorative props, flower placement and colors, clouds, and a slight sky tint; paths, portals, and gameplay geometry remain fixed.

Puzzle configurations and `runSeed` stay in centralized session progress, so resets, mistakes, room exits, and island returns preserve the same journey. `startNewJourney(state, fixedSeed?)` powers the completion screen’s confirmed New Journey action. It clears all portal and restoration state, returns the Friend to the island, and generates a new Light configuration. The Journey Sigil uses separate named finale forks and references the run’s Light, Echo, Balance, and Celestial configurations. For development or browser QA, open the sandbox game URL with `?runSeed=SLICE_0379` (or another fixed string). This initializes a fixed seed only when that sandbox session starts; it is not a durable save mechanism.

## Controls

- **Desktop:** WASD or arrow keys move relative to the camera. **E** or Space interacts nearby, including the ready monument. **R** resets an unsolved Light Temple, Balance Temple, or Celestial Observatory. Echo Runes activate automatically when stepped onto.
- **Mobile:** Drag the left joystick to move and step onto Echo Runes; tap **ACTION** near a crystal, Balance block, Celestial control, shard, portal, or ready monument. Use the on-screen puzzle reset button. Landscape gives the clearest view.
- **Sound:** The SOUND button toggles original temporary procedural cues. The game stops movement and interactions while the SDK menu is open. Reduced-motion preferences remove ambient motion and shorten transition effects.

Each room's return arch is usable before solving. Leaving Echo Garden before completion restarts the current round's demonstration on re-entry while preserving completed rounds. Completed portals can be revisited; claimed shards cannot be claimed again.

Balance blocks show one, two, or three engraved marks for their weight. Each plate shows the required number of marks. A dim plate is underweight; gold is balanced; red is overweight. A block slides one grid cell away from the Friend per interaction and cannot leave the platform or overlap another block. Completed mechanisms latch so blocks can be redistributed. Reset restores the **same journey's** layout and mechanisms without changing earlier shards. Leaving and re-entering preserves the current block positions. After completion, the bridge remains available and Shard III cannot respawn.

The Observatory clue displays three original geometric symbols in Outer → Middle → Inner order. The rings move at different seeded speeds and directions. A control locks only its corresponding active ring. The logical angle evaluator gives a roughly **18° window on either side** of the marker, independent of frame rate; a closer alignment gets a stronger snap. A miss pauses briefly and resumes that ring while earlier locks remain. Reset restores this journey's seeded starting angles and clue, without touching previous shards. Re-entry keeps the same constellation and current ring alignment. After Shard IV is claimed, the aligned mechanism remains visible and the shard cannot respawn.

The Echo Runes use original geometric symbols and original procedural pentatonic notes. Their input zones register only on entry, so standing on a rune never repeats it. During playback, footsteps cannot submit inputs.

## Technology

TypeScript, React 19, Three.js, React Three Fiber, and FriendSDK v0.1.3. The FriendSDK CLI uses esbuild to produce a trusted wallet host and sandboxed game; Vite is not part of this build. The island, temples, garden, observatory, avatar, beam, effects, and temporary sounds are original procedural assets. Balance uses discrete logic and animated geometry, with no rigid-body dependency. Celestial ring angles are logical time calculations that drive procedural geometry; no physics or post-processing package is used. No canonical 3D Friend model or canonical audio is claimed.

## Rare Friends integration

FriendSDK's trusted host connects the wallet, discovers eligible owned Generations NFTs, verifies ownership on Robinhood mainnet (chain 4663), and passes the selected `friendId` into the sandbox. The ID appears in the HUD and deterministically changes the avatar accent and island prop arrangement. The game calls the supplied client `read()` to initialize its session. There are no purchases, NFT rewards, token claims, or blockchain writes. The SDK currently requires an otherwise unused `game.json` chance-game definition; its fields are not mechanics in Friend Portals. Canonical 2D sprite integration is reserved for a later phase.

Normal preview play requires a wallet owning a hardwired Generation 1+ Rare Friend on Robinhood mainnet. The automated SDK browser harness uses mock ownership only for tests.

## Session progress and persistence

`ProgressStore` isolates progress reads and writes. Its current implementation is an in-memory map keyed by selected Friend ID. The `runSeed`, Light orientations, Echo sequences and round progress, Balance layout and block positions, Celestial constellation and ring state, completed portals, shard ownership, and restoration state survive room exits and re-entry **during the current page session**. A page refresh or new browser session resets them. The FriendSDK game sandbox has no supported `localStorage`, IndexedDB, or save bridge; this project does not invent SDK or blockchain persistence. A future persistence adapter needs a supported host-side design.

## Development

Node.js 22+ and npm are required. The FriendSDK v0.1.3 package archive is included in `vendor/` so this repository installs independently. Version 0.1.3 fixes owned Friend discovery on the default Robinhood RPC by paging account-filtered Transfer history from the canonical collection's first Transfer block.

```sh
npm ci
npm run dev
```

Open the printed local URL, usually `http://localhost:4173`.

## Validation and build

```sh
npm run typecheck
npm run check
npm run build
npm run test:seed
npm run test:balance
npm run test:celestial
npm run test:finale
npm run test:browser
npm run test:slice
```

Install Playwright Chromium first if needed: `npx playwright install chromium`. `test:seed` verifies every Light variant, fixed-seed reproducibility, Echo sequence rules, world variation, reset/re-entry, and the New Journey reset. `test:balance` searches legal grid pushes to verify all six Balance layouts and checks collision, reset, re-entry, duplicate claims, and Portal IV progression. `test:celestial` verifies all eight clues, deterministic motion, angular tolerance and wrapping, retries, reset, re-entry, and duplicate-claim protection. `test:finale` verifies stage timing, sigil snapshots, named-seed isolation, duplicate activation, and New Journey. `test:slice` drives all four portals and the monument restoration with a fixed seed in the SDK's mock-wallet browser harness, including mobile interaction, Explore, confirmation, and New Journey reset. Generated output is `.friendsdk/`; browser screenshots are saved under `artifacts/`. Both are untracked.

## Deployment

For GitHub Pages, copy **all contents** of `.friendsdk/` to the root of a dedicated `gh-pages` branch and add `.nojekyll`. Configure Pages to serve that branch root. The SDK emits relative asset URLs, so the generated files work under a repository subpath. The wallet ownership gate remains active. A public playable preview link is required for a Vibeathon submission.

## Vibeathon

Friend Portals is a separate Rare Friends Vibeathon game and will use its own source repository and submission PR.

## Known limits

Real-wallet play and physical-device FPS remain unmeasured. Simulated phone-width layout and controls are tested, but real device performance still needs profiling. Canonical Friend artwork presentation and durable save support remain future work. The game is not yet production-ready or deployed.
