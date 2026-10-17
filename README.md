# TypeShyt

**A focused typing test for measuring speed, accuracy, and progress.**

Live demo: **TODO(you): add deployed URL** · [![CI](https://github.com/anuragnibhamishra/typeshyt/actions/workflows/ci.yml/badge.svg)](https://github.com/anuragnibhamishra/typeshyt/actions/workflows/ci.yml) · [![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## Demo

![TypeShyt typing test demo](docs/media/demo.gif)

Screenshots: [typing screen](docs/media/typing.png) · [results](docs/media/results.png) · [history](docs/media/history.png)

These media files are TODOs until recorded and added. See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

## Features

- Timed tests (15, 30, 60, or 120 seconds), 10/25/50-word tests, code snippets, and weak-key practice.
- Live Net WPM, Raw WPM, keystroke accuracy, and elapsed/countdown time.
- Results with a per-second WPM chart and history-derived personal bests.
- Local test history, settings, and aggregate weak-key statistics.
- Keyboard shortcuts, paste/cursor-movement blocking, and reduced-motion support.

## Tech stack

- **React 18** — component-based interface and state.
- **TypeScript** — typed app and domain logic.
- **Vite** — development server and production build.
- **Tailwind CSS 3** — utility-based responsive styling.
- **Vitest and React Testing Library** — deterministic unit, component, hook, and integration tests.
- **Custom SVG chart** — small responsive chart without an additional charting runtime.

## Getting started

Requirement: Node.js 22 (the CI workflow's configured version) and npm.

```bash
npm ci
npm run dev
npm run build
npm run preview
npm test
npm run check
```

Vite prints the local development and preview URLs in the terminal.

## Keyboard shortcuts and use

- Select a mode and settings while idle, then type in the prompt to start.
- **Tab** while the typing input is focused restarts the test.
- **Escape** releases focus from the typing input.
- Backspace removes the last typed character but is not counted as a keystroke. Paste and cursor movement are blocked.
- For code snippets, type leading spaces as shown; Enter inserts a newline. Tab remains the restart shortcut.

## Metrics

**Net WPM** counts correct characters; **Raw WPM** counts all typed characters, including mistakes later corrected. **Accuracy** is correct keystrokes divided by total keystrokes. See [docs/METRICS.md](docs/METRICS.md) for the full definitions and edge cases.

## Project structure

```text
src/
  App.tsx
  components/   UI panels and controls
  hooks/         useTypingTest session and timer
  utils/         metrics, storage, text, completion, and result logic
test/            unit, hook, component, and integration tests
docs/            product and engineering documentation
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data flow and state ownership.

## Testing, quality, accessibility, and performance

- CI runs typecheck, lint, tests with coverage, and build: [workflow](.github/workflows/ci.yml).
- Accessibility: contrast measurements and keyboard checklist in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md). No axe or Lighthouse audit is claimed.
- Performance: local development profiling method and measurements are in [docs/PERFORMANCE.md](docs/PERFORMANCE.md); results are environment-specific.

## Technical decisions

- Hidden textarea input, first-keystroke timer start, and separate Net/Raw/Accuracy definitions.
- Versioned localStorage with validated results and history-derived bests.
- Aggregate-only weak-key statistics and an SVG chart instead of a chart-library dependency.
- No backend: progress is local to this browser.

Details and trade-offs: [docs/DECISIONS.md](docs/DECISIONS.md).

## Known limitations and roadmap

- Saved history and preferences are per browser/device and can be cleared; there is no account or sync.
- Key analysis can differ by keyboard layout and shifted symbols.
- No server-side leaderboard, account system, new typing modes, light theme, deployment automation, or user research is included.
- Next: deploy and verify the static site, record portfolio media, then complete the release checklist.

## License and author

MIT; see [LICENSE](LICENSE). Author: **TODO(you): add your name and portfolio/GitHub links**.
