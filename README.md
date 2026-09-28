# Friend Portals

An independent 3D Rare Friends Vibeathon adventure on a floating island. This repository has its own Git history and does not contain Friend Forge code.

## Concept

Explore a mysterious 3D island and solve four different portal puzzles. The intended journey is Island → Portal → Puzzle → Shard → Next Portal → Final activation.

## Current phase: Echo Garden

Phase 2 completes Portal I. Walk through its gold portal into a compact floating temple. A light emitter feeds three rotatable crystals. Route the beam through all three engraved seals to charge the Portal Core, then approach and claim Portal Shard I. Walk into the temple's exit arch to return to the island. Portal I gains a completed rune and light; energy crosses the central monument and awakens Portal II. The HUD advances to **1 / 4 shards**.

Phase 3 completes Portal II. Its cyan portal leads to a twilight garden with five symbol-marked, musical Echo Runes around a three-part shrine. Watch and listen to each sequence, then **walk onto** the runes in the same order. The three authored rounds contain 3, 4, and 5 echoes. A wrong step replays the current round after a short pause; earlier rounds stay complete. After the third round, approach the shrine to claim Portal Shard II, then manually use the exit arch. The HUD advances to **2 / 4 shards**. Portal II remains restored, the central monument shows two lit sockets, and an energy pulse awakens Portal III.

Portal III is an active **Phase 4 placeholder** and cannot be entered yet. Portal IV remains locked. Their puzzles and the final event are not implemented.

The beam uses an authored discrete route. Crystal A must face 90°, B 270°, and C 90° from their initial orientations. Each interaction advances exactly 90°. The route is Emitter → A → Seal I → B → Seal II → C → Seal III → Core. Beam visuals follow these logical links; gameplay does not rely on raycast precision. The crystals lock during their short rotation and after the route is solved. Reset changes only crystal orientations.

## Controls

- **Desktop:** WASD or arrow keys move relative to the camera. **E** or Space interacts nearby. **R** resets the unsolved light puzzle. Echo Runes activate automatically when stepped onto.
- **Mobile:** Drag the left joystick to move and step onto Echo Runes; tap **ACTION** near a crystal, shard, or portal. Use the on-screen light puzzle reset button. Landscape gives the clearest view.
- **Sound:** The SOUND button toggles original temporary procedural cues. The game stops movement and interactions while the SDK menu is open. Reduced-motion preferences remove ambient motion and shorten transition effects.

Each room's return arch is usable before solving. Leaving Echo Garden before completion restarts the current round's demonstration on re-entry while preserving completed rounds. Completed portals can be revisited; claimed shards cannot be claimed again.

The Echo Runes use original geometric symbols and original procedural pentatonic notes. Their input zones register only on entry, so standing on a rune never repeats it. During playback, footsteps cannot submit inputs.

## Technology

TypeScript, React 19, Three.js, React Three Fiber, and FriendSDK v0.1.2. The FriendSDK CLI uses esbuild to produce a trusted wallet host and sandboxed game; Vite is not part of this build. The island, temple, garden, avatar, beam, effects, and temporary sounds are original procedural assets. No canonical 3D Friend model or canonical audio is claimed.

## Rare Friends integration

FriendSDK's trusted host connects the wallet, discovers eligible owned Generations NFTs, verifies ownership on Robinhood mainnet (chain 4663), and passes the selected `friendId` into the sandbox. The ID appears in the HUD and deterministically changes the avatar accent and island prop arrangement. The game calls the supplied client `read()` to initialize its session. There are no purchases, NFT rewards, token claims, or blockchain writes. The SDK currently requires an otherwise unused `game.json` chance-game definition; its fields are not mechanics in Friend Portals. Canonical 2D sprite integration is reserved for a later phase.

Normal preview play requires a wallet owning a hardwired Generation 1+ Rare Friend on Robinhood mainnet. The automated SDK browser harness uses mock ownership only for tests.

## Session progress and persistence

`ProgressStore` isolates progress reads and writes. Its current implementation is an in-memory map keyed by selected Friend ID. Crystal orientations, Echo round progress, completed portals, and shard ownership survive room exits and re-entry **during the current page session**. A page refresh or new browser session resets them. The FriendSDK game sandbox has no supported `localStorage`, IndexedDB, or save bridge; this project does not invent SDK or blockchain persistence. A future persistence adapter needs a supported host-side design.

## Development

Node.js 22+ and npm are required. The FriendSDK v0.1.2 package archive is included in `vendor/` so this repository installs independently.

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
npm run test:browser
npm run test:slice
```

Install Playwright Chromium first if needed: `npx playwright install chromium`. `test:slice` drives both portals in the SDK's mock-wallet browser harness, including Echo playback lock, wrong-step replay, all three rounds, both shard claims, early exit and re-entry, Portal III unlock, completed-room re-entry, phone-sized joystick and ACTION controls. Generated output is `.friendsdk/`; browser screenshots are saved under `artifacts/`. Both are untracked.

## Deployment

For GitHub Pages, copy **all contents** of `.friendsdk/` to the root of a dedicated `gh-pages` branch and add `.nojekyll`. Configure Pages to serve that branch root. The SDK emits relative asset URLs, so the generated files work under a repository subpath. The wallet ownership gate remains active. A public playable preview link is required for a Vibeathon submission.

## Vibeathon

Friend Portals is a separate Rare Friends Vibeathon game and will use its own source repository and submission PR.

## Known limits

Real-wallet play and physical-device FPS remain unmeasured. Portals III–IV, the four-shard finale, canonical Friend artwork presentation, and durable save support remain future work.
