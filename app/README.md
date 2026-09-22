# xbenben

[Open the live app](https://qdddddd.github.io/xbenben/) · [Source repository](https://github.com/qdddddd/xbenben)

An installable, offline cash-game session log. The nine screens follow the supplied Ledger design and Industry system. React renders native components; the design runtime and iPhone bezel are not shipped.

The app was renamed to **xbenben**. Existing saved sessions and backup files remain compatible: `ledger:data:v1` and the `ledger-backup` format are stable identifiers. New downloads use the `xbenben` filename prefix.

## Run

Use Node 22.12+ or Node 24 LTS and npm. Verified locally with Node 23 and Google Chrome.

```sh
cd app
npm ci
npm run dev
```

Open the printed localhost URL. First launch is empty. **Settings → Restore sample log** adds six fictional USD sessions without replacing personal data. **Use the sample export** imports a separate, entirely fictional three-session HKD example.

## Verify and build

On macOS, the tests use installed Google Chrome. Elsewhere, install Playwright Chromium first:

```sh
npx playwright install --with-deps chromium
```

Run these sequentially:

```sh
npm test
npm run test:pages
npm run build
npm run check:privacy
npm run preview
```

`npm test` runs the unit tests, builds production assets, starts a preview server, and runs browser tests at 402×874. It covers imports, multiple currencies, persistence, backup/restore, real downloads, offline caching, keyboard access and app updates. `test:pages` independently checks a repository subdirectory, manifest/icon URLs and offline imports. The tests use only synthetic data.

`PLAYWRIGHT_CHANNEL=chrome` selects Chrome explicitly; leave it unset on Linux to use bundled Chromium. Run `npm run test:unit` or `npm run test:e2e` for one layer. Failing browser tests leave screenshots and traces in ignored `test-results/`.

To repeat the visual comparison, serve the repository root on port 8765 and run the app on 5173, then run `npm run test:parity` from `app/`. The script uses the unmodified prototype, a fixed time and identical synthetic data; its ignored `evidence/index.html` contains reference, app and difference screenshots. It normalizes only the prototype's drawn hardware and safe-area geometry. The private export is not required. Private-fixture acceptance checks, when available locally, remain outside Git and CI.

## Backup and restore

In Settings, choose **Back up to iCloud / file**. After preparation, choose **Save to Files / share** on supported iPhones, then **Save to Files → iCloud Drive**. **Download backup** is always available as a fallback. Confirm that the file appears where you saved it. The app records when it created the backup file; it cannot observe completion of iCloud syncing. Cancelling the share sheet leaves the last-backup date unchanged.

**Restore backup** opens the Files picker. A preview lists the backup's date, currencies, session counts, running session and saved choices. **Replace ledger & restore** replaces the complete ledger after confirmation. It does not merge. The restored live clock continues from its original start time.

The JSON format has a version, a SHA-256 checksum and a complete snapshot: every currency, active buy-ins, settings, venues, stakes, draft inputs and last-backup metadata. Validation and the checksum reject damaged or unrelated files before changing any data. Files are not encrypted; keep them private. CSV is a separate, displayed-currency report, not a full backup.

There is no background iCloud access, account or synchronization. The app requests persistent browser storage when the API is available and displays the result. The browser may decline; retain file backups before clearing site data or removing the app.

## Publish on GitHub Pages

The app is published from the public `qdddddd/xbenben` repository using GitHub Actions. The repository name and public visibility were confirmed before creation. For another deployment, authenticate with `gh auth login -h github.com`; a public repository supports Pages on GitHub Free. See [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The `.github/workflows/pages.yml` workflow runs tests and privacy checks, builds the repository's correct base path, uploads only `app/dist`, and deploys through the `github-pages` environment. Pages is configured to use GitHub Actions. Push `main` or run the workflow manually to publish an update.

For a local build at a project URL:

```sh
XBENBEN_BASE=/xbenben/ npm run build
```

For an account root site, use `/`. The former `LEDGER_BASE` variable is also accepted. Keep the published origin and repository path stable across releases. The storage key remains `ledger:data:v1`; service-worker updates never erase it or automatically interrupt a running session. A visible reload action applies an available update.

The private prompt, original analytics export, uploads, private tests and screenshot evidence are ignored and excluded from history. `check:privacy` enforces private-path exclusion, checks locally available private session identifiers, and verifies that the deployed sample is synthetic. No analytics, external fonts or user-data service is included.

## Install and check on iPhone

These steps require a real iPhone; desktop browser automation cannot verify the native share sheet or iCloud Drive.

1. Open [xbenben](https://qdddddd.github.io/xbenben/) in Safari. Use **Share → Add to Home Screen**, keep the name **xbenben**, and open its icon. Check the status/home safe areas and keyboard layout.
2. Load the fictional sample or import your own XML through **Settings → Import from analytics7 → Choose .xml file**. In Files, select iCloud Drive or the folder where AirDrop saved the export.
3. Start a session, add a re-buy, close and reopen the installed app, and check the clock and invested amount.
4. Make a complete backup. In the share sheet choose **Save to Files → iCloud Drive**, then verify the saved JSON file in Files. If file sharing is unavailable, download it and move/save it using Files.
5. With a verified backup available, erase the test ledger, choose **Restore backup**, select that file from iCloud Drive, inspect the preview, and confirm replacement. Check settings, both currencies, custom choices and the original live-session clock.
6. After an online launch, enable airplane mode. Reopen xbenben, check the log and fonts, start or resume a session, add a re-buy and cash out. Reconnect before expecting a new file to sync to iCloud.
7. After a new release, check that the saved log remains present and apply the update using its reload button. A fresh home-screen installation may have a separate browser storage context; restore a backup there if needed.

## Code map

- `src/LedgerView.jsx`: native React translation of the reference markup.
- `src/Ledger.jsx`: navigation, actions and derived screen values.
- `src/domain.js`: money, fixed rates, XML import, duplicate detection and CSV.
- `src/storage.js` / `src/backup.js`: versioned local persistence and complete backup files.
- `src/Overlays.jsx`: pickers, safe confirmations and backup/restore dialogs.
- `src/industry.css` / `design-measures.css`: Industry tokens and exact dimensions from the prototype; fonts are bundled locally.

See `PARITY.md` for verification results and deliberate differences.
