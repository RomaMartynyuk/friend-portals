# Friend Portals

An independent 3D Rare Friends Vibeathon adventure on a floating island. This repository has its own Git history and does not contain Friend Forge code.

## Concept

Explore a mysterious 3D island and solve four different portal puzzles. The intended journey is Island → Portal → Puzzle → Shard → Next Portal → Final activation.

## Current phase: Temple of Light

Phase 2 completes Portal I. Walk through its gold portal into a compact floating temple. A light emitter feeds three rotatable crystals. Route the beam through all three engraved seals to charge the Portal Core, then approach and claim Portal Shard I. Walk into the temple's exit arch to return to the island. Portal I gains a completed rune and light; energy crosses the central monument and awakens Portal II. The HUD advances to **1 / 4 shards**.

Portal II is a visible, active **Phase 3 placeholder**. Portals III and IV remain locked. Their puzzles and the final event are not implemented.

The beam uses an authored discrete route. Crystal A must face 90°, B 270°, and C 90° from their initial orientations. Each interaction advances exactly 90°. The route is Emitter → A → Seal I → B → Seal II → C → Seal III → Core. Beam visuals follow these logical links; gameplay does not rely on raycast precision. The crystals lock during their short rotation and after the route is solved. Reset changes only crystal orientations.

## Controls

- **Desktop:** WASD or arrow keys move relative to the camera. **E** or Space interacts nearby. **R** resets the unsolved light puzzle. The reset button is also clickable.
- **Mobile:** Drag the left joystick and tap **ACTION** near a crystal, shard, or portal. Use the on-screen reset button. Landscape gives the clearest view.
- **Sound:** The SOUND button toggles original temporary procedural cues. The game stops movement and interactions while the SDK menu is open. Reduced-motion preferences remove ambient motion and shorten transition effects.

The temple's return arch is usable before solving, so the player can leave and re-enter without losing current session puzzle progress. After claiming the shard it lights up as the return portal. Portal I can be revisited after completion; the shard cannot be claimed again.

## Technology

TypeScript, React 19, Three.js, React Three Fiber, and FriendSDK v0.1.2. The FriendSDK CLI uses esbuild to produce a trusted wallet host and sandboxed game; Vite is not part of this build. The island, temple, avatar, beam, effects, and temporary sounds are original procedural assets. No canonical 3D Friend model or canonical audio is claimed.

## Rare Friends integration

FriendSDK's trusted host connects the wallet, discovers eligible owned Generations NFTs, verifies ownership on Robinhood mainnet (chain 4663), and passes the selected `friendId` into the sandbox. The ID appears in the HUD and deterministically changes the avatar accent and island prop arrangement. The game calls the supplied client `read()` to initialize its session. There are no purchases, NFT rewards, token claims, or blockchain writes. The SDK currently requires an otherwise unused `game.json` chance-game definition; its fields are not mechanics in Friend Portals. Canonical 2D sprite integration is reserved for a later phase.

Normal preview play requires a wallet owning a hardwired Generation 1+ Rare Friend on Robinhood mainnet. The automated SDK browser harness uses mock ownership only for tests.

## Session progress and persistence

`ProgressStore` isolates progress reads and writes. Its current implementation is an in-memory map keyed by selected Friend ID. Crystal orientations, puzzle phase, completed portals, and shard ownership survive room exits and re-entry **during the current page session**. A page refresh or new browser session resets them. The FriendSDK game sandbox has no supported `localStorage`, IndexedDB, or save bridge; this project does not invent SDK or blockchain persistence. A future persistence adapter needs a supported host-side design.

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

Install Playwright Chromium first if needed: `npx playwright install chromium`. `test:slice` drives the full island → crystal rotations → shard claim → island unlock flow in the SDK's mock-wallet browser harness. It also checks puzzle reset, completed-portal re-entry, duplicate-claim prevention, and phone-sized ACTION interaction. Generated output is `.friendsdk/`; browser screenshots are saved under `artifacts/`. Both are untracked.

## Deployment

For GitHub Pages, copy **all contents** of `.friendsdk/` to the root of a dedicated `gh-pages` branch and add `.nojekyll`. Configure Pages to serve that branch root. The SDK emits relative asset URLs, so the generated files work under a repository subpath. The wallet ownership gate remains active. A public playable preview link is required for a Vibeathon submission.

## Vibeathon

Friend Portals is a separate Rare Friends Vibeathon game and will use its own source repository and submission PR.

## Known limits

Real-wallet play and physical-device FPS remain unmeasured. Portal II's puzzle, Portals III–IV, the four-shard finale, canonical Friend artwork presentation, and durable save support remain future work.
