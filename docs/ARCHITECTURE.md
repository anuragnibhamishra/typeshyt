# Architecture

## Folder map

- `src/App.tsx` composes the page, owns persisted application data and view selection, and coordinates completed results.
- `src/components/` contains the typing area, controls, result/chart, history, and weak-key views.
- `src/hooks/useTypingTest.ts` owns one in-progress test session and its timer lifecycle.
- `src/utils/` contains metrics, completion predicates, prompt generation, result creation, weak-key calculations, and versioned storage.
- `test/` contains deterministic utility, hook, component, and App integration tests.
- `docs/` contains metric, architecture, performance, and accessibility records.

There is no `features/` or top-level `types/` directory: the current feature logic is small and has a single clear owner in the hook or utility modules, while the related types are colocated with those modules. Creating wrapper directories or moving files would add indirection without clarifying ownership. The referenced `typeshyt.md` roadmap was not present in this checkout.

## Keystroke-to-history data flow

1. `TypingArea` reports the textarea's updated value to `useTypingTest`; paste and cursor navigation are blocked at the input boundary.
2. The hook compares the new value against its session's typed string, counts newly appended target-character attempts, updates the single session snapshot, and renders the live metrics. Deleting text changes the visible string but does not subtract earlier keystrokes.
3. The first accepted character changes the session from `idle` to `running` and starts one interval. Each tick updates elapsed time and appends any due one-second Net-WPM samples. Completion clears the interval and is idempotent.
4. When the hook reports `finished`, `App` calculates final metrics with `calcStats`, creates a typed result with `createTestResult`, and persists it with `saveResult`. The same result instance is then added to in-memory history; personal bests are derived from that history.
5. Storage validates data at the boundary and stores preferences, up to 200 results, aggregate weak-key counters, and archived legacy scores. The history and weak-key panels consume those persisted aggregates without storing typed text or keystroke timestamps.

## State ownership and side effects

- `App` owns persisted `AppData`, current view selection, current result presentation, and storage-availability feedback.
- `useTypingTest` owns the active session in one canonical ref-backed snapshot. A separate render-version state only requests React renders; it is not a second copy of session values. The interval handle and WPM sample accumulator are refs because they are not UI state.
- `HistoryPanel` owns only its filter and clear-confirmation UI state.
- Effects are limited to real side effects: resetting the test when its configuration changes, starting/clearing the timer, focusing the input/results heading, scrolling the current character into view, and persisting a completed result.

Metrics, completion predicates, text generation, result construction, and weak-key calculations import no React or DOM modules. Randomness and the typing clock are injectable at the hook and utility boundaries.
