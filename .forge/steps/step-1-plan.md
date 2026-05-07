# Step 1 Execution Plan: Test, validation, and parity-manifest foundation

## Goal
Add the tooling and machine-readable parity foundation that later Forge steps can use to prove upstream utility/live-map coverage and enforce quality checks.

## Current Code Observations
- `package.json` currently has `dev`, `build`, `start`, `lint`, and `typecheck` scripts, but no test, Playwright, Lighthouse, or accessibility scripts.
- Existing dependencies include Next 16, React 19, TypeScript, Leaflet, MQTT, and `tsx`, but no Vitest, Playwright, axe, Lighthouse CI, Zod, or AJV.
- `.github/workflows/ci.yml` currently runs npm ci, lint, typecheck, and build plus a Docker build smoke in a separate job.
- `.github/workflows/security.yml` runs `npm audit --audit-level=high`.
- `.dockerignore` already excludes `.forge`, `.claude`, `.next`, node_modules, env files, logs, and common build artifacts, but not `.forge.bak.*`, Playwright/Lighthouse reports, or test result folders.
- `tsconfig.json` supports `resolveJsonModule`, so JSON fixtures can be imported directly if needed.
- Upstream fixture sources are available at `/tmp/meshcore-utilities-site/static/data/*` and `/tmp/meshcore-utilities-site/serial_commands.schema.json`.

## Files to Change
- `package.json` — add scripts and dev dependencies for unit/browser/a11y/Lighthouse validation.
- `package-lock.json` — update after installing dependencies.
- `vitest.config.ts` — configure unit tests for TS path aliases and Node/jsdom environment as needed.
- `playwright.config.ts` — configure Chromium smoke/a11y tests against a local Next server.
- `.lighthouserc.json` — configure blocking Lighthouse CI budgets for critical pages.
- `.dockerignore` — exclude archived Forge folders and generated test/report artifacts from Docker builds.
- `src/lib/parity/manifest.ts` — add typed upstream parity manifest.
- `src/lib/parity/report.ts` — add report helper for maintainer-facing parity summaries.
- `src/lib/parity/fixtures/*` — add minimal adapted upstream fixture files and provenance metadata.
- `src/lib/parity/__tests__/manifest.test.ts` — validate manifest and fixture loadability.
- `tests/e2e/smoke.spec.ts` — add initial Playwright smoke/a11y test scaffold for critical pages.

## Ordered Implementation Checklist
1. Install targeted dev/test dependencies and update npm scripts.
2. Create Vitest config and a first parity manifest test that runs in Node without browser dependencies.
3. Create Playwright config with a local web server and Chromium-only defaults for now.
4. Create Lighthouse CI config with stable local URLs and initial budgets that can run locally/CI.
5. Add parity manifest types/data covering utilities, repeater config, serial USB, PrefixMatrix, live-map API/UI, Docker, and CI.
6. Add minimal upstream-derived fixtures plus provenance metadata for recommended settings, regions, serial commands/schema, and live-map node payloads.
7. Add maintainer report helper that produces a markdown/text summary from the manifest without exposing it as public UI.
8. Update `.dockerignore` for `.forge.bak.*`, Playwright reports, Lighthouse output, coverage, and test-results.
9. Run lint, typecheck, unit tests, and build; fix Step 1 issues before staging.

## Interfaces and Data Contracts
- `PARITY_MANIFEST` exports a typed list of parity items with `id`, `domain`, `upstream`, `local`, `status`, `coverage`, and `notes` fields.
- `buildParityReport()` returns a maintainer-facing markdown string from the manifest.
- `npm run test:unit` runs Vitest.
- `npm run test:e2e` runs Playwright Chromium smoke tests.
- `npm run test:a11y` runs the same Playwright suite with axe assertions or an a11y-focused project.
- `npm run test:lighthouse` runs Lighthouse CI against local URLs.

## Verification Plan
- Automated: `npm run lint`
- Automated: `npm run typecheck`
- Automated: `npm run test:unit`
- Automated: `npm run build`
- Optional smoke if install completes cleanly: `npx playwright install --with-deps chromium` is CI-oriented and should not be required for unit-only Step 1 verification.
- Regression: verify `.dockerignore` excludes `.forge.bak.*` and generated reports.

## Stop Conditions
- Stop and ask before adding broad visual UI changes; this step is foundation only.
- Stop if dependency installation reveals major version incompatibilities with Next 16/React 19 that would require changing the stack.
- Stop if Lighthouse/Playwright setup cannot run locally due to platform dependencies; record the limitation and keep configs ready for CI.
