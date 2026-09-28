# Friend Portals

A small 3D Rare Friends adventure set on a floating island. This is an independent Rare Friends Vibeathon game and a new project with its own Git history.

## Concept

Explore a mysterious 3D island and solve four different portal puzzles. Phase 1 is a playable vertical slice: walk the island, enter Portal I, explore its temporary chamber, and return. The four actual puzzles, shards, unlock sequence, and ending are future phases.

## Gameplay

Island → Portal → Puzzle → Shard → Next Portal → Final activation. In this build, only the island → Portal I test chamber → island loop is active. The remaining portals are visible and locked; the shard count stays at 0/4.

## Controls

Desktop: WASD or arrow keys to move, E or Space to interact near the active portal or the chamber exit. Movement is camera relative. Mobile: landscape orientation recommended; drag the left joystick to move and tap ACTION when near an entrance or exit. The game pauses input when the SDK menu is open. SOUND OFF/ON controls original temporary synthesized cues.

## Technology

TypeScript, React 19, Three.js, React Three Fiber, and FriendSDK v0.1.2. The FriendSDK CLI builds the trusted wallet host and sandboxed game with esbuild; Vite is not part of the build. All game geometry and the provisional avatar are original procedural artwork. No canonical 3D Rare Friend model is claimed.

## Rare Friends Integration

FriendSDK's trusted host connects the wallet, discovers owned eligible Generations NFTs, verifies ownership on Robinhood mainnet (chain 4663), and passes the selected `friendId` into the sandbox. The ID appears in the HUD and deterministically changes the avatar accent and island prop arrangement. The game calls the supplied client `read()` to initialize the session. There are no purchases, rewards, token claims or blockchain writes. The SDK currently requires an otherwise unused `game.json` chance-game definition; its fields are not game mechanics. Canonical 2D sprite integration is reserved for a later phase.

Normal preview play requires a wallet owning a hardwired Generation 1+ Rare Friend on Robinhood mainnet. The SDK's automated browser test uses mock ownership only inside its test harness.

## Development

Node.js 22+ and npm are required. The 1 MB FriendSDK v0.1.2 package archive is included in `vendor/` so this repository installs independently.

```sh
npm ci
npm run dev
```

Open the local URL printed by the runner, usually `http://localhost:4173`.

## Checks and build

```sh
npm run typecheck
npm run check
npm run build
npm run test:browser
npm run test:slice
```

`npm run test:browser` requires Playwright Chromium to be installed first (`npx playwright install chromium`). The SDK command names are verified against the bundled v0.1.2 package. `test:slice` checks movement, Portal I entry, return, and a phone-sized HUD in the SDK browser harness. Build output is `.friendsdk/` and is intentionally untracked.

## Deployment

For a GitHub Pages project URL, copy **all contents** of `.friendsdk/` to the root of a dedicated `gh-pages` branch and add an empty `.nojekyll`. Configure Pages to serve that branch root. The SDK emits relative URLs, so the entire generated folder works at a repository subpath. The wallet ownership gate remains active. A public playable preview URL is required for the Vibeathon submission.

## Vibeathon

This is an independent Rare Friends Vibeathon game. The submission will live in its own source repository and will receive a separate submission PR. The source follows the SDK game container and uses the selected verified Friend ID. Future phases will add the four distinct puzzles, progression, canonical artwork presentation, audio polish and mobile testing.

## Current limitations

The temporary chamber has no puzzle or shard. There is no save/resume in Phase 1: the SDK sandbox does not expose `localStorage`, IndexedDB, or a save bridge. Before puzzle progression is implemented, a host-side persistence strategy must be designed without weakening the wallet/ownership boundary. Real-wallet play and live mobile performance still need verification.
