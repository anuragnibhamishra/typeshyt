# Accessibility checks

## Contrast

Ratios were calculated with the WCAG relative-luminance formula from the Tailwind 3.4 palette colors. Dark text surfaces use the slate-900 panel (`#0f172a`) over the slate-950 page (`#020617`); the translucent panel composes to approximately `#0c1426`. The incorrect-character highlight composes red-500 at 25% over that panel to approximately `#45202e`.

| Text or UI pair | Foreground | Background | Ratio | Requirement / result |
|---|---|---|---:|---|
| Untyped characters, slate-400 on panel | `#94a3b8` | `#0c1426` | 7.16:1 | AA normal text; pass |
| Correct characters, emerald-300 on panel | `#6ee7b7` | `#0c1426` | 12.05:1 | AA normal text; pass |
| Incorrect characters, red-300 on error highlight | `#fca5a5` | `#45202e` | 7.38:1 | AA normal text; pass |
| Muted labels after fix, slate-400 on panel | `#94a3b8` | `#0c1426` | 7.16:1 | AA normal text; pass |
| Button text, slate-950 on brand emerald-500 | `#020617` | `#10b981` | 7.95:1 | AA normal text; pass |
| Current character, slate-950 on emerald-400 | `#020617` | `#34d399` | 10.49:1 | AA normal text; pass |
| Focus ring, emerald-400 on panel | `#34d399` | `#0c1426` | 9.55:1 | 3:1 UI-component contrast; pass |

The previous slate-500 muted text on the panel measured 3.86:1, and the slate-600 footer measured 2.66:1 against slate-950. Both were changed to slate-400. Incorrect characters also use an underline and tinted background, not color alone. The chart includes an accessible text summary.

## Semantics and keyboard behavior

- The page has header, navigation, main, and footer landmarks; the visible page title is the level-one heading. Test-result and history views have level-two headings.
- Pickers expose pressed states, toggles have labels, and every action is a button. The typing input's accessible name includes the Tab restart and Escape release instructions; its description includes the prompt and input restrictions.
- When a test completes, focus moves to the results heading. The typing field can be released with Escape; Tab while it is focused restarts as documented.
- The current character remains visible in the typing viewport; incorrect characters are underlined. `prefers-reduced-motion` reduces transitions and disables animation.

Vitest/React Testing Library tests verify these semantics and keyboard paths. `jest-axe` was not added and no axe or Lighthouse run was performed, so this is not a claim of a full automated accessibility audit.

## Manual keyboard and screen-reader checklist

1. Starting from page load, use Tab and Shift+Tab to visit navigation, mode/duration buttons, setting toggles, the typing field, and actions; confirm visible focus.
2. In the typing field, type a character, press Tab to restart, then press Escape and confirm focus is released and the next Tab can reach another control.
3. Complete a short test and confirm focus moves to the results heading; activate Try again with the keyboard.
4. Open History, change the filter, start and cancel the clear confirmation, then confirm clearing. Visit Weak keys and activate Reset key stats.
5. With a screen reader, verify the prompt is announced as the typing field's description, the restart/release shortcuts are named, results are announced at completion, and the chart summary is available. Confirm timer ticks and individual keystrokes are not announced.
6. Enable the operating system's reduced-motion preference and check that transitions do not animate.
