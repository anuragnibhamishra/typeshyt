# TypeShyt

**A focused typing test for measuring speed, accuracy, and progress.**

Live demo: **TODO(you): add deployed URL** · [![CI](https://github.com/anuragnibhamishra/typeshyt/actions/workflows/ci.yml/badge.svg)](https://github.com/anuragnibhamishra/typeshyt/actions/workflows/ci.yml) · [![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## Demo

![TypeShyt typing test demo](docs/media/demo.gif)

Screenshots: [typing screen](docs/media/typing.png) · [results](docs/media/results.png) · [history](docs/media/history.png)

These media files are TODOs until recorded and added. See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

## Features

- Timed tests with preset or custom durations, optional custom text, 10/25/50-word tests, timed code snippets that cycle as you finish them, and weak-key practice.
- Live Net WPM, Raw WPM, keystroke accuracy, and elapsed/countdown time.
- Results with a per-second WPM chart and history-derived personal bests.
- Local test history, settings, and aggregate weak-key statistics.
- Installable, offline-capable PWA with self-hosted fonts and prompt-based updates.
- Share result cards as landscape or portrait PNGs by download, native file share, or clipboard when the browser supports them.
- Keyboard shortcuts, paste/cursor-movement blocking, and reduced-motion support.

The share card contains only the aggregate result (WPM, Raw WPM, accuracy, mode, date, test settings, and saved WPM samples). It contains no personal data, per-key statistics, or typed text.

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
- In Time mode, apply custom text to practice your own passage; it cycles until the timer ends. Leave it blank to use generated prompts. Choose a preset or enter a duration from 1 to 3,600 seconds.
- **Tab** while the typing input is focused restarts the test.
- **Escape** releases focus from the typing input.
- Backspace removes the last typed character but is not counted as a keystroke. Paste and cursor movement are blocked.
- For timed code snippets, choose a duration and keep typing; a new snippet appears after each completion until time runs out. Type leading spaces as shown; Enter inserts a newline. Tab remains the restart shortcut.

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

## PWA & sharing

Install TypeShyt from the browser's install control when offered. On iOS Safari, use **Share → Add to Home Screen**. After the first production visit, the app shell, fonts, icons, and history functionality are available offline; saved results remain in that browser's local storage. A new version waits for the user to choose **Reload**, and that action is disabled while a typing test is running.

Result sharing offers a PNG download everywhere the browser provides blob downloads; native file sharing and image clipboard actions appear only when their APIs report support. Browser/device behavior has not been verified here: **TODO(you): verify install, offline use, download, native sharing, and clipboard on target devices.**

See [docs/PWA.md](docs/PWA.md) for the caching and update flows, local preview/DevTools steps, and manual device checklist.

The self-hosted Manrope and JetBrains Mono font files are licensed under the SIL Open Font License 1.1; the license texts are included alongside the font assets in `src/assets/fonts/`.

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
