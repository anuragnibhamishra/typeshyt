# Changelog

All notable changes to this project are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and release versions follow [Semantic Versioning](https://semver.org/).

## [1.0.0] - TODO(you): set publication date

### Added

- Timed, word-count, code-snippet, and weak-key practice modes.
- Live and completed-test Net WPM, Raw WPM, and keystroke accuracy, with a per-second WPM chart.
- Local history, history-derived personal bests, settings persistence, and aggregate weak-key statistics.
- Keyboard restart/release shortcuts, responsive dark UI, and reduced-motion support.
- Unit, hook, component, and integration coverage; linting, type checking, and GitHub Actions CI.
- Engineering documentation for metrics, architecture, performance, and accessibility.

### Fixed

- Timer start, completion, restart, duration-change, and cleanup edge cases.
- Metric confusion between keystroke-based and final-character-based accuracy.
- Storage parsing and validation failures that could otherwise break app startup.
- Weak-key result counter snapshots and indexed-access safety found during test hardening.

### Changed

- Personal bests are derived from matching history rather than a separate update path.
- Typing prompt characters are memoized based on measured local rendering results.
