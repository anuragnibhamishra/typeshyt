# Technical decisions and trade-offs

## Hidden textarea input

**Context:** A typing prompt needs text entry on desktop and touch devices without showing a second text cursor over the styled prompt.

**Decision:** The app uses a textarea as the input surface and renders the prompt separately. It blocks paste and cursor movement; Tab restarts while focused and Escape releases focus.

**Alternatives considered:** A visible textarea, per-key document listeners, or a custom keyboard.

**Consequences:** Native mobile keyboards and text composition are available through a familiar control, while prompt presentation remains custom. The keyboard shortcut means Tab is not available for inserting indentation; code users type leading spaces and Enter inserts a newline.

## Timer lifecycle

**Context:** Timed tests need a single start point, accurate elapsed values, and race-safe completion.

**Decision:** The timer starts on the first appended character. A single 100 ms interval reads elapsed time from `performance.now()` and the captured start time; it does not decrement a counter. Completion clamps timed runs to their configured duration, clears the interval, and only transitions a running session once. The hook catches up WPM sample seconds when ticks are delayed.

**Alternatives considered:** Decrementing a countdown by one on each interval, or using a timeout as the only source of time.

**Consequences:** Elapsed time does not accumulate interval drift, though display updates are sampled at roughly 100 ms and the browser may delay callbacks in background tabs. Idempotent status checks prevent duplicate results when typing and timeout completion race.

## Metrics

**Context:** One “accuracy” number can hide whether mistakes were corrected or remain in the final text.

**Decision:** Net WPM uses correct final characters; Raw WPM includes all typed keystrokes, including later-corrected characters; Accuracy is correct keystrokes divided by total keystrokes. Character accuracy is separately calculated and is not labeled Accuracy.

**Alternatives considered:** A single WPM formula or final-text-only accuracy.

**Consequences:** Results distinguish speed, final correctness, and mistakes made during the run. Formulas and edge cases are in [METRICS.md](METRICS.md).

## Local storage and schema

**Context:** The app should restore preferences, history, and aggregate key data without a server.

**Decision:** Validated data is stored in a namespaced localStorage key (`typeshyt:state:v2`), tagged with schema version 2; the history is capped at 200 results and old Phase 1 score keys are migrated where available.

**Alternatives considered:** In-memory-only state, IndexedDB, or a remote database.

**Consequences:** Data is local to one browser profile/device, can be cleared by the user or browser, has no sync, and shares the browser's limited storage quota (commonly around 5 MB, with browser-dependent limits). Storage failures and invalid records fall back safely, but there is no recovery across devices.

## Personal bests

**Context:** Maintaining a separate personal-best write path risks disagreement with saved history.

**Decision:** Personal best is derived from matching history entries by test mode, duration or word count, and punctuation/numbers settings.

**Alternatives considered:** A separately updated personal-best key.

**Consequences:** Clearing history also clears history-derived bests; no independent score can drift from the history.

## Weak-key data and privacy

**Context:** Targeted practice needs evidence of errors without retaining the user's typed text or a per-keystroke trace.

**Decision:** The app stores aggregate target-character attempts and errors, per result and across results; a key is surfaced only after at least 20 attempts. Practice favors words containing eligible keys. No typed prompt response or keystroke timestamps are saved.

**Alternatives considered:** Storing raw attempts, all wrong-key values, or analyzing every key after a single error.

**Consequences:** Aggregates reduce detail and storage, but do not eliminate the privacy implications of persisted performance data. Analysis treats a target character as a physical key and can be inaccurate across keyboard layouts and shifted symbols.

## Rendering and chart

**Context:** The typing prompt updates at each character, and its chart needs responsive display and a text alternative.

**Decision:** Prompt characters use memoized spans. The chart is a small responsive, accessible custom SVG; no Recharts or other chart dependency is present in the shipped package.

**Alternatives considered:** Re-rendering all character spans, adding Recharts, or omitting the graph.

**Consequences:** The SVG keeps the runtime dependency list smaller and satisfies this chart's limited needs, but chart axes and interaction remain hand-maintained. The measured local before/after profiling results and limitations are recorded in [PERFORMANCE.md](PERFORMANCE.md).

## No backend

**Context:** The product scope is a local typing test and portfolio project, without accounts or a shared leaderboard.

**Decision:** There is no backend, authentication, analytics, or remote score collection.

**Alternatives considered:** Accounts plus a server-side history, or a leaderboard service.

**Consequences:** Users retain control of local data, and hosting stays static/simple; progress does not synchronize between devices and cannot be recovered after local browser data is removed.
