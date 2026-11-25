# Weather Explorer

Weather Explorer is a frontend-only weather dashboard built with React, TypeScript, and Vite. Search for a city to see its current weather; forecast and climate views are planned.

Unit preferences use Zustand for shared state and are saved in the browser's local storage.
The selected city is stored in the URL, so you can share a link or return to it later.

## Running locally

Requires Node.js 24.15 or newer. The project uses pnpm through Corepack:

```sh
corepack pnpm install
corepack pnpm dev
```

## Checks

```sh
corepack pnpm test
corepack pnpm run test:coverage
corepack pnpm run lint
corepack pnpm run format:check
corepack pnpm run typecheck
corepack pnpm run build
```

## Attribution

Weather data by [Open-Meteo.com](https://open-meteo.com/).
