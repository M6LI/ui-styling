# Offline development

The repository is self-contained for the supplied template's npm dependencies, fonts, icons, source evidence and reference screenshots. Node.js 18+, npm, Python 3.9+ and a modern browser must already be installed. Runtime installers and optional browser-automation tooling are not included.

## First build

Run from the skill root:

```bash
python scripts/bootstrap.py --target /absolute/path/to/research-app --serve
```

The destination must be empty. The script verifies the dependency archive's SHA-256, extracts a local npm cache into the destination's `.offline-npm-cache`, copies the template and runs `npm ci --offline --ignore-scripts`, typechecking, build and domain tests. `--target` leaves the original skill untouched, including when it is read-only. Use `--cache-dir /writable/path` to override the cache location. The server binds to `127.0.0.1:4173`. Use `python3`/`py` and platform-appropriate paths where needed.

The dependency cache holds 45 package tarballs matching `assets/template/package-lock.json`. `esbuild-wasm` avoids downloading a platform-specific build binary. Cache metadata may contain registry URLs as cache keys; `--offline` prevents network retrieval. Never run an ordinary online install as a repair step in an offline environment.

Subsequent edits:

```bash
cd /absolute/path/to/research-app
npm run typecheck
npm test
npm run build
npm run serve
```

`dist/` is a static bundle with local fonts. Serve over HTTP; do not rely on `file://`. The simple server is for local inspection. Your application's server can serve the same bundle or integrate the components into its existing build.

## Existing applications

Inspect framework, routing, dependency versions and styling first. Do not overwrite a user's package.json or lockfile.

| Existing stack | Integration choice |
|---|---|
| React 17 / MUI 4 | Reuse the components, theme, CSS and local assets directly; reconcile build/routing imports |
| React 18+ / newer MUI | Port the exact tokens and CSS onto existing primitives, or isolate the reference app; do not force incompatible legacy dependencies into the app |
| Vue, Svelte, plain HTML | Translate component structure and interactions from source; preserve tokens, fonts, dimensions and screenshot checks |
| Python-served dashboard | Serve the static app from the backend and add a JSON adapter, or apply tokens to existing controls where the framework allows |

The React/MUI generations were selected for Aim fidelity, not as a recommendation to migrate an existing application backwards. If the target stack cannot reproduce a source interaction exactly, document the adaptation and verify the result visually. No new dependency is available offline unless already present or explicitly supplied.

## Files to keep

Keep `src/`, `public/`, package files, build/serve scripts and tests in a generated app. Keep licenses with redistributed assets and dependencies. When handing an AI the skill, transfer **the whole repository**, not SKILL.md alone. The relative links depend on the adjacent assets, references and scripts.

The original Aim frontend archive is reference-only; its full dependency tree and Python server are not vendored. Extract locally to inspect an upstream component, but build the supplied standalone template for the verified offline workflow.

## Troubleshooting

- Missing npm executable: install Node/npm before entering the disconnected environment.
- `ENOTCACHED`: check that the lockfile was not changed and the dependency archive checksum matches. Delete only the generated app's `.offline-npm-cache` directory, then run `npm ci --offline --cache /path/to/a/verified/cache`, or bootstrap into a fresh empty destination to reconstruct the cache from the archive.
- Missing glyphs: ensure public fonts were copied, fonts.css is loaded, and paths are served from the correct base. Never replace glyphs with emoji or unrelated icons.
- Blank page: open developer console, confirm app.js/app.css return 200 and rebuild after source changes.
- Busy port: `PORT=4174 npm run serve` on Unix, or set PORT in the shell on Windows.
- Screenshot differences: use the same viewport, browser, loaded font state, route and deterministic fixture. Browser anti-aliasing can vary.

## Optional browser verification

If Playwright and Chromium are already installed, start the template server and run `node scripts/browser-check.cjs` from the skill root. Set `CHROMIUM_EXECUTABLE` if needed. The check blocks external HTTP requests, exercises UI paths, and writes screenshots. Do not install this optional tooling over the internet in the receiving environment.
