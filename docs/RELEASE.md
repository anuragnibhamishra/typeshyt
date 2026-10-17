# Release checklist

## Before tagging

- [ ] Review the README and documentation against the deployed app; replace all release-blocking `TODO(you):` placeholders.
- [ ] Confirm the CI workflow is green for the commit being released.
- [ ] Run `npm ci` and `npm run check` locally.
- [ ] Merge the verified release changes to `main`.
- [ ] Confirm the working tree is clean and `package.json` / `package-lock.json` report `1.0.0`.

## Tag and push

Run from the repository root after merging:

```bash
git switch main
git pull --ff-only origin main
git status --short
git tag -a v1.0.0 -m "TypeShyt v1.0.0"
git push origin v1.0.0
```

Do not create the tag until the deployment checks pass. These commands are instructions only; no tag or push was performed while preparing the project.

## GitHub Release

1. Open the repository's **Releases** page and choose **Draft a new release**.
2. Select tag `v1.0.0`, target `main`, and title it `TypeShyt v1.0.0`.
3. Copy the `1.0.0` section from [CHANGELOG.md](../CHANGELOG.md) into the release notes.
4. Publish the release after checking the attached tag and notes.

## Suggested GitHub repository settings

- **Description:** `A responsive typing speed test with history, WPM charts, code prompts, and weak-key practice.`
- **Topics:** `react`, `typescript`, `tailwindcss`, `vite`, `typing-test`, `typing-speed`, `vitest`, `accessibility`
- **Website:** `TODO(you): add deployed URL`
- **Pinned README screenshot:** add the final `docs/media/typing.png` after capturing it and confirming it contains no private data.
