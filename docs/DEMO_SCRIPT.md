# Demo storyboard and capture plan

Target edit: approximately 55 seconds. Record screen segments separately and cut between them; a full timed test takes longer than its final edited shot. Keep the pointer movements deliberate, hide unrelated browser UI, and do not expose personal history or browser data.

## 55-second storyboard

| Shot | Time | What to click/type | Caption or overlay |
|---|---:|---|---|
| 1. Establish the app | 4 sec | Load the deployed home page and pause on the idle test screen. | “TypeShyt — typing speed, with useful context.” |
| 2. Choose a duration | 5 sec | Click **Time**, then choose **15s**. Show the full countdown before typing. | “Choose a focused 15-second test.” |
| 3. Type with live stats | 10 sec | Focus the prompt and type continuously; capture countdown, Net WPM, Raw WPM, and Accuracy changing. | “Live pace and keystroke accuracy.” |
| 4. Show results and chart | 8 sec | Complete the test (record the end separately if needed), then frame the result headline and chart. | “Net WPM, Raw WPM, accuracy, and pace over time.” |
| 5. History and personal best | 8 sec | Click **History**; point to the saved run and its best/average summaries. | “Results and personal bests stay in this browser.” |
| 6. Weak-key panel | 8 sec | Click **Weak keys**. Show eligible keys if real accumulated data is available; otherwise frame the stated minimum-sample/fallback message. | “Practice targets keys only after enough attempts.” |
| 7. Word-count mode | 8 sec | Return to **Test**, choose **Words → 10**, type the prompt, and show elapsed time. | “Word-count tests finish at the last character.” |
| 8. End card | 4 sec | Hold on the app or a clean title card with the final demo URL. | “Try TypeShyt — TODO(you): add deployed URL.” |

Total: 55 seconds. Do not speed up or fabricate typing-performance numbers; use a cut or short timelapse only where it is visually clear.

## Screenshot shot list

| Filename | Viewport | State |
|---|---:|---|
| `docs/media/typing.png` | 1280×900 | Idle test screen with the mode selector and prompt visible. |
| `docs/media/results.png` | 1280×900 | Completed run with result metrics, chart, and Try again button visible. |
| `docs/media/history.png` | 1280×900 | History panel with actual saved results and summary statistics. |
| Optional `docs/media/mobile.png` | 360×800 | Idle or active prompt on a narrow viewport; confirm no horizontal overflow. |

## Capture tools

- Windows: use **Snipping Tool** screen recording (`Win+Shift+R`) or Xbox Game Bar (`Win+Alt+R`) for a short capture.
- For GIF conversion, use ScreenToGif's editor/export dialog, or `ffmpeg` if already installed. Crop to the app content, remove pauses, reduce frame rate and width, and target a GIF under 5 MB.
- Capture static PNGs with Snipping Tool or the browser's screenshot tool.
- No screenshot automation or Playwright script is included; Playwright was not added as a dependency.

Add the expected media files described in [docs/media/README.md](media/README.md).
