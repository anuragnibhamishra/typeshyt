# Typing metrics

All rates use elapsed test time in minutes. WPM values are rounded to the nearest whole number; percentages are rounded to one decimal place.

- **Total keystrokes**: printable characters entered during the test. Backspace is not counted. A character remains in this count if it is later removed.
- **Correct keystrokes**: entered characters that matched the expected character at their position when typed. A mistake remains an incorrect keystroke even if it is later corrected.
- **Correct characters**: characters in the final typed text that match the prompt at the same position.
- **Incorrect characters**: characters in the final typed text that do not match the prompt at the same position.
- **Raw WPM** = (total characters typed / 5) / elapsed minutes. It includes characters later corrected with Backspace.
- **Net WPM** = (correct characters / 5) / elapsed minutes. Incorrect characters are excluded as the error penalty.
- **Accuracy** = (correct keystrokes / total keystrokes) × 100. The UI's Accuracy is always keystroke-based.
- **Character accuracy** = (correct characters / characters in final typed text) × 100. It is computed separately and is not presented as “Accuracy” in the UI.

For empty input, both accuracy measures are 0%; when there are no elapsed seconds, WPM values are 0. These conventions avoid undefined values and keep reset stats at zero.

## Phase 2 statistics

- **Chart average WPM** is the arithmetic mean of the one-second Net WPM samples, rounded to the nearest whole number. **Peak WPM** is the largest sample. Tests with fewer than two samples show a chart empty state.
- **Progress trend** compares the five most recent completed results with the five immediately before them. It is “improving” at a 5% or greater increase in the group averages, “declining” at a 5% or greater decrease, and “steady” otherwise. Fewer than ten results are reported as insufficient for a trend.
- **Weak-key error rate** is errors / target-character attempts for that character. Only keys with at least 20 attempts are ranked. Per-key improvement compares the last five result aggregates with the preceding five and is shown only when both groups contain at least 20 attempts for that key. A decrease of at least 5% is “improving,” an increase of at least 5% is “declining,” and smaller changes are “steady.”

Samples and result-level weak-key aggregates store no typed text or per-keystroke timestamps. This keeps the chart reproducible while limiting saved typing data to aggregate statistics.
