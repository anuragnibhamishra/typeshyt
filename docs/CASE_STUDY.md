# TypeShyt case study

*Portfolio draft written in first person. Replace the listed TODOs with original media and project-history details before publishing.*

## Overview

I built TypeShyt as a browser-based typing test with several practice modes and locally saved progress. The project combines a React interface with a typed session hook and pure TypeScript utilities for metrics, completion rules, prompt generation, and storage validation.

**Live demo:** TODO(you): add deployed URL  
**Screenshot:** TODO(you): add a screenshot  
**Project history:** TODO(you): add the verified project timeline; Git history was not available in this workspace.

## Problem

Typing speed is often summarized by one number, even though speed, errors during typing, and errors left in the final text describe different things. I wanted the app to distinguish those measures and let a person compare later runs without sending their typing data to a server.

## Goals and constraints

- Keep the application client-side with no accounts, backend, analytics, or runtime dependencies beyond React.
- Support timed, word-count, code, and weak-key practice.
- Persist results safely in the current browser, with invalid or unavailable storage handled without crashing the app.
- Keep the metric formulas and non-UI logic in reusable TypeScript functions.
- Make the input usable with a software keyboard and keyboard shortcuts.

## Design process

I separated the active test session from the page's persisted application data. The typing area uses a textarea for input and a separately rendered prompt, while the application presents mode selection, live stats, results, history, and weak-key analysis as distinct components.

The repository does not contain the referenced `typeshyt.md` roadmap or Git history in this workspace. TODO(you): add any verified design iterations or decisions from your original project notes; I have not inferred a commit timeline.

## Architecture

`src/App.tsx` composes the UI and coordinates persisted application data. `src/hooks/useTypingTest.ts` owns the active session, interval, and per-second sample accumulation. Pure utilities under `src/utils/` implement metrics, completion, text generation, result creation, weak-key calculations, and schema-validated localStorage. Components render the prompt, results/chart, history, and weak-key panel.

The storage schema is version 2 and caps history at 200 results. Personal bests are calculated from matching history, including the selected mode/size and text settings. Full data flow is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Challenges

The timer had to avoid multiple starts and duplicate completion when the duration boundary and final input happen close together. The session now starts on its first appended character, derives elapsed time from a monotonic clock, and guards completion by session status.

The metrics also needed precise separation. Backspace changes the final typed string but does not undo earlier keystrokes, so one accuracy number cannot stand in for both typing history and final-text correctness.

During Phase 3 hardening, tests exposed a shallow copy of per-result weak-key counters and a misplaced nested test suite that prevented chart and weak-key component tests from being registered. The counters are now copied independently, the tests run at top level, and indexed collection access is checked with `noUncheckedIndexedAccess`.

## Solutions and trade-offs

I use Net WPM for correct final characters, Raw WPM for all typed characters including later-corrected mistakes, and keystroke accuracy for errors made over the whole run. The formulas are centralized in `src/utils/stats.ts` and documented in [METRICS.md](METRICS.md).

I chose browser localStorage rather than a backend. The app validates parsed records and falls back safely, but saved data is per browser/device and does not sync. Weak-key analysis stores aggregate target-character attempts and errors, not typed text or keystroke timestamps; it requires at least 20 attempts before listing a key. This interpretation can differ across keyboard layouts and shifted symbols.

The chart is a custom SVG rather than Recharts. That keeps this small chart free of a separate charting runtime dependency, at the cost of maintaining its axes and rendering code directly.

## Validation

`npm run check` passed: typecheck, lint, 40 tests across five files, and production build. `npm run test:coverage` reported 94.71% overall line coverage; utilities reached 96.55%, hooks 95.13%, and components 94.52%.

The local development profiling results already recorded in [PERFORMANCE.md](PERFORMANCE.md) were median App-tree render duration 14.6 ms before and 5.5 ms after, with p95 52.4 ms before and 8.3 ms after. The prompt lengths differed slightly and the test ran in development mode, so these are local comparative measurements, not a production benchmark.

Contrast measurements and keyboard checks are documented in [ACCESSIBILITY.md](ACCESSIBILITY.md). No axe, Lighthouse, real-phone, or screen-reader test is claimed here. TODO(you): add real-device validation results if performed.

## Outcome

The repository contains the application, deterministic unit/hook/component/integration tests, a CI workflow, and engineering documentation for metrics, architecture, performance, and accessibility. A Vercel configuration and launch instructions are prepared, but no deployment has been performed.

TODO(you): add the deployed URL, captured screenshots, and any verified feedback or usage data. No adoption, user feedback, or user improvement percentage is currently available.

## Future work

Deploy and verify the static site, then capture the demo and screenshots. Any later work on accounts, cross-device synchronization, leaderboards, or additional modes should be scoped separately; none is included in the current app.

## Portfolio-card summary (150 words)

I built TypeShyt, a browser-based typing test, with React, TypeScript, Vite, and Tailwind CSS. It offers timed, word-count, code-snippet, and weak-key practice, with statistics and a WPM chart. I separated Net WPM, Raw WPM, and keystroke accuracy so the results describe different aspects of a run instead of collapsing them into one score. A typed session hook owns the timer and input state; pure utilities handle metrics, completion, text generation, result creation, and storage validation. Results and preferences persist in localStorage, while personal bests are derived from matching history. Weak-key practice stores aggregated target-character attempts and errors rather than typed text or timestamped keystrokes. I added deterministic tests for utilities, the hook, components, and app flows, plus linting, type checking, and GitHub Actions CI. The repository also documents measured rendering performance, accessibility contrast, product metrics, and deployment steps. The deployment, portfolio screenshots, and user research remain for me to complete.

## What I would highlight in an interview

- I made timer completion idempotent and based elapsed time on a monotonic clock rather than assuming interval callbacks are exact.
- I chose explicit WPM and accuracy definitions, then reused the same pure calculations across live stats and saved results.
- I added runtime storage validation and aggregate-only weak-key records to keep browser persistence resilient and limit retained typing data.
