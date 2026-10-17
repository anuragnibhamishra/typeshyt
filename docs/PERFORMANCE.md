# Rendering performance

## Method

Profiled the longest timed prompt (250 generated words) in the integrated VS Code browser at 1280 × 850. The app ran through Vite in development mode with React `StrictMode` enabled, on a Lenovo 82K1 with an 11th Gen Intel Core i5-11320H and 8 GB RAM; no CPU throttling was applied. For each run, 30 characters were typed continuously with a 4 ms Playwright keyboard delay.

The integrated browser did not expose a React DevTools Profiler renderer. Instead, temporary `React.Profiler` wrappers recorded `actualDuration` for the App tree and named component subtrees, while input events were timestamped with `performance.now()`. Temporary instrumentation was removed after both runs. The durations below are render durations per input-associated Profiler commit, not isolated browser paint or GPU timings. Profiler wrappers and development mode add overhead, and React `StrictMode` intentionally invokes component render functions extra times.

| Measurement | Before | After |
|---|---:|---:|
| Prompt length | 1,299 characters | 1,312 characters |
| Characters entered | 30 | 30 |
| Median App-tree `actualDuration` | 14.6 ms | 5.5 ms |
| 95th percentile App-tree `actualDuration` | 52.4 ms | 8.3 ms |
| Maximum observed App-tree `actualDuration` | 102.7 ms | 8.7 ms |
| Named Profiler subtrees per measured commit | 10 | 10 |
| Character render-function calls per keystroke | Not directly counted | 4 |

The generated prompt lengths differed slightly because the original run used the unseeded production prompt generator; consequently these are comparable procedure/results, not a byte-for-byte identical prompt benchmark. The baseline profiler did not directly count component function invocations; its 10 named subtree commits are not a component render count. After the change, a direct `Character` render counter observed 120 calls across 30 key events (four calls per key in development `StrictMode`, corresponding to two adjacent character positions being updated and StrictMode's extra invocation). Input-associated commits are interleaved with timer commits, so their raw commit counts are not compared.

## Change and result

The original typing view recreated every character span on every keystroke. The view now memoizes each character using primitive character/current/typed props and memoizes the prompt's character array. This keeps the visual update limited to the previous and current character while avoiding a redesign or speculative memoization elsewhere. The 95th percentile measured render duration fell from 52.4 ms to 8.3 ms in this run; the median fell from 14.6 ms to 5.5 ms.

The App and its other named subtrees still render during a typing update. No broader render optimization was made because the post-change measurements were below one 60 Hz frame budget in this environment. These results are a local development-mode sample, not a production or cross-device performance guarantee.
