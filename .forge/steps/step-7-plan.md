# Step 7 Execution Plan: Guarded serial settings JSON application and Nominatim proxy

## Goal
Add a safe settings-JSON-to-serial-command conversion path, expose it in the Web Serial tool with preview and confirmation safeguards, and move naming wizard geocoding behind a local `/api/geocode` proxy.

## Current Code Observations
- `src/components/tools/SerialUsbTool.tsx` already owns Web Serial connection, manual send, canned command execution, confirmation prompts, and terminal logging.
- `src/lib/tools/serial-commands.ts` contains typed canned action/step contracts, including existing destructive confirmations for reboot, erase, GPS, power, and regions.
- `src/lib/meshcore-tools/config-export.ts` emits deterministic repeater/companion settings JSON with keys such as `name`, `node_type`, `role`, `repeat`, `radio_settings`, `regions`, `public_key_id`, `owner_info`, and `companion`.
- `src/components/NamingWizard.tsx` currently fetches `https://nominatim.openstreetmap.org/search` directly from the browser with a User-Agent header that browsers will not reliably send.
- `src/lib/rate-limit.ts` provides request IP extraction and in-memory rate-limit helpers usable from API routes.
- API routes use `NextResponse.json<ApiResponse<T>>`, `runtime = 'nodejs'`, and `dynamic = 'force-dynamic'` for server-side runtime behavior.
- Existing smoke tests exercise critical routes and browser-only dynamic behavior; no serial settings preview test exists yet.

## Files to Change
- `src/lib/meshcore-tools/serial-settings.ts` — add pure settings JSON validation and conversion into a guarded serial command plan.
- `src/lib/meshcore-tools/__tests__/serial-settings.test.ts` — cover valid repeater/companion conversion, malformed JSON, unsupported fields, safety metadata, and command injection rejection.
- `src/components/tools/SerialUsbTool.tsx` — add settings JSON paste/upload, preview, explicit confirmation, and run-plan support without weakening existing canned-command confirmations.
- `src/app/api/geocode/route.ts` — add server-side Nominatim proxy with input validation, country/limit constraints, rate limiting, caching, and safe normalized output.
- `src/components/NamingWizard.tsx` — replace direct Nominatim browser fetch with `/api/geocode` and update copy to describe server-proxied lookup.
- `src/lib/parity/manifest.ts` — mark guarded serial settings and geocoding proxy parity references.
- `tests/e2e/smoke.spec.ts` — add a stable unsupported-browser/settings-preview smoke assertion that does not require hardware.

## Ordered Implementation Checklist
1. Define serial settings input contracts and a `buildSerialSettingsPlan` pure function that accepts unknown JSON or text, validates allowed fields, rejects private-key-like fields and command-control characters, and returns a `SerialAction`-compatible plan plus warnings.
2. Map only locally verified write commands to safe commands: `name`, `radio_settings.frequency`, `radio_settings.bandwidth`/`spreading_factor`/`coding_rate`, and `radio_settings.tx_power`; leave `node_type`, `role`, `repeat`, `regions`, `owner_info`, companion metadata, and other unverified settings visible as unsupported/manual-review fields.
3. Add tests proving generated repeater and companion exports convert deterministically, malformed/private/unsupported settings fail safely, and mutating commands are marked as requiring confirmation.
4. Add `/api/geocode` with query validation, IP rate limiting, a small in-memory cache by normalized query, server-side Nominatim fetch with identification headers, US-only `countrycodes=us`, `limit=1`, normalized `{ lat, lon, displayName }`, no credential exposure, and failure responses through `ApiResponse`.
5. Update `NamingWizard` logic to call `/api/geocode?q=...`, then reuse existing nearest-airport distance logic; update text so users know the server contacts Nominatim only when they click lookup.
6. Add Serial USB tool settings JSON input/preview/run flow using the pure converter and existing `runStep` sending path; if broad layout/aesthetic work is required, delegate the visual/frontend integration to Opus UI.
7. Add Playwright smoke coverage for `/tools/serial-usb` showing Web Serial unsupported/secure-context messaging and settings JSON preview behavior without connecting hardware.
8. Update parity manifest refs and run verification.

## Interfaces and Data Contracts
- `parseSerialSettingsInput(input: string | unknown): SerialSettingsParseResult` accepts pasted JSON text or already-parsed values.
- `buildSerialSettingsPlan(input: string | unknown): SerialSettingsPlanResult` returns either `{ ok: true, action, warnings, unsupportedKeys }` or `{ ok: false, errors }`.
- The returned `action` conforms to `SerialAction` and always has `confirm: true` for settings application.
- `/api/geocode?q=<query>` returns `ApiResponse<{ lat: number; lon: number; displayName: string }>`.
- Browser code must not call `nominatim.openstreetmap.org` directly.

## Verification Plan
- Automated: `npm run lint`, `npm run typecheck`, `npm run test:unit`, targeted Playwright smoke for serial/geocode if added, `npm run build`.
- Manual: open `/tools/serial-usb` in the browser without hardware and verify unsupported/ready messaging, paste generated settings JSON, see command preview, and confirm the apply action remains disabled until connected. Run naming wizard lookup and verify `/api/geocode` is the browser request path.
- Regression: existing canned command confirmations remain present, config export tests continue passing, and critical page smoke remains green aside from the known out-of-scope `/map` axe issue.

## Stop Conditions
- If a supported settings key cannot be mapped to a known safe serial command, leave it unsupported with a warning rather than inventing a firmware command.
- If Web Serial apply flow needs significant visual redesign beyond adding a functional preview panel, pause and delegate that UI work to Opus UI.
- If Nominatim route tests would require live network access, keep route logic deterministic and validate with mocked fetch or manual browser/API checks instead.
