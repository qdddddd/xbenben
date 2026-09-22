# Ledger parity and verification

Verification date: 2026-09-22. Chrome, 402×874; primary tabs also checked at 320 pixels. Private financial figures are intentionally omitted from this public report.

## Screens

The native React view is ported from the reference markup. The comparison uses identical fixture data and a fixed clock, hides only the prototype's painted iPhone hardware, and sets the app's test safe areas to the prototype's geometry. The actual app uses the device's `env(safe-area-inset-*)` values. The optional script writes ignored local screenshots and a gallery; no private screenshot is published.

| Screen | Verification and result |
| --- | --- |
| 01 Bankroll home | Passed: sample figures, currency isolation, recent order, empty state and resume state. Matched reference screenshot after safe-area normalization. |
| 02 Session log | Passed: All / Wins / Losses, totals, hours, row order and navigation. Matched reference screenshot. |
| 03 Session detail | Passed: signed result, hourly/big-blind rate, buy-ins, tips, duration, city and notes. Matched reference screenshot; delete now confirms. |
| 04 New session | Passed: exact numpad/presets layout, repeat/default presets, saved defaults and dynamic pickers. Matched reference screenshot. |
| 05 Live session | Passed: timer, invested sum, prescribed re-buy options, reload and close/reopen. Added a return-to-ledger control. |
| 06 Cash out | Passed: cash/tips selection, keyboard, result equation, booking and currency. Valid zero-chip booking now looks enabled. |
| 07 Stats | Passed: curve, stake groups and superlatives. Lifetime colour follows lifetime net; a one-session curve and peak now render correctly. |
| 08 Settings | Passed: defaults, all three tweaks, CSV, safe sample controls, currency note, backup/restore and storage status. Added controls extend the scrollable screen. |
| 09 Import: pick | Passed: real file input, errors, mapping copy and a synthetic sample. Monospace mapping text now uses Industry's Barlow body token. |
| 09 Import: map | Passed: date span, currencies, venues, fixed rate and skip switch. Filename uses Barlow. |
| 09 Import: review | Passed: per-row data, included totals, skipped rows, back navigation and commit. Same data produces the reference layout. |

All nine screens and all three import stages were captured in a real browser. Screenshot comparison uses Pixelmatch's 0.15 perceptual threshold; zero counted differences is not a claim of byte-identical images across browsers. A final local gallery records the percentages for the current build.

## Acceptance checks

| Check | Result and evidence |
| --- | --- |
| 1. USD sample | Passed in Chrome: six fictional sessions, all requested aggregates and four recent results. |
| 2. Supplied private import | Passed locally with the real file: expected date range, venues, fixed conversion choice, aggregate figures, parked USD records and repeated-import duplicates. The private fixture and its tests are excluded from Git/CI. Public regression tests use a new synthetic export. |
| 3. Bad XML | Passed: invalid XML, no cash sessions and unreadable dates retain step one and the specified messages. |
| 4. Live session | Passed: start, re-buy, simulated elapsed time, reload, close/reopen, currency change, cash/tips entry and booking; original timestamp and buy-ins survive. |
| 5. Visual parity | Passed with the documented deliberate differences. Reference screenshots, app screenshots and diff images were inspected locally. |
| 6. Clean build | Production build and the documented automated test command pass locally. Clean-checkout verification is recorded after the final source commit. |
| 7. Backup round trip | Passed in Chrome: two currencies, a live session with re-buy, theme, venues/stakes, preview without mutation, cancelled restore and exact confirmed replacement. Corrupt, unrelated and unsupported-version files are rejected. |
| 8. Publishing | Pages workflow prepared; subdirectory/offline checks and history/site privacy checks passed. GitHub authentication is verified; live deployment awaits the user-confirmed repository name and visibility. |
| 9. Physical iPhone | Not run on this machine. Installation, native share sheet, iCloud Drive/AirDrop and airplane-mode checks are specified in README. |

The standard suite currently has 9 unit tests and 18 Chrome browser tests. It checks a real CSV/JSON download, offline fonts/sample/icons, storage-denial/corruption handling, keyboard focus, simulated share cancellation and a genuine service-worker script update. The update test verifies that a reload is offered and the stored ledger is retained. The share test mocks the OS API; it does not claim to verify iCloud delivery.

## Deliberate changes

- Real safe areas replace the design sheet, bezel, status bar and home indicator. Desktop width is capped; small viewports scroll within screens.
- First launch is empty. Sample restoration is confirmed, tagged and idempotent, preserves personal records, switches to USD and offers separate sample removal.
- The shipped XML sample is entirely fictional. The user's export is accepted through the file picker but never included in public assets, tests or screenshots.
- Accent and P&L colour settings are added; quick-start toggles immediately. Other accent presets change the related ramp as well as the base accent.
- Venue/stake pickers include the log, imported and user-added choices. These choices persist independently of log deletion. Saved defaults affect new-session setup.
- Active-session amounts retain their original currency; booking returns to that currency. A second new-session action resumes the existing session.
- Delete, discard and erase require a separate confirmation. Zero-chip cash-out is valid and visually enabled.
- Stats uses lifetime net's sign and draws a correct single-session curve/peak. Zero big blinds do not produce infinite rates.
- Imports use the owning result where supplied, validate dates/amounts, reject mixed-currency exports and omit unsupported conversion pairs. The displayed fixed rate is the one applied. Kept amounts are not rounded again.
- Duplicate recognition keeps the original venue / under-two-minutes rule, also checks earlier rows in the same import, and gives imported copies distinct internal IDs. Importing zero included rows is disabled.
- XML errors preserve the requested messages; extra validation has specific messages. File input selection resets so the same file can be picked again. XML files are limited to 10 MB; backups to 20 MB.
- CSV exports actual displayed-currency records, with exact numeric values, quoted fields and protection against spreadsheet formula injection. The numpad consistently limits manual amounts to nine digits.
- New modal controls manage focus and Escape; numpads support physical digits/backspace; file pickers stay keyboard accessible. Barlow replaces the prototype's out-of-system monospace text. Buttons use square corners consistently.
- Storage is versioned, changes survive reload, and storage errors are visible. Corrupt saved data is preserved with a recovery download. Persistent storage is requested but browser approval is not assumed.
- Backup/restore controls use Industry styles. Restore replaces the entire ledger after preview and confirmation. SHA-256 detects damaged payloads; a file version supports future migrations. A share cancellation does not advance last-backup time.
- Fonts, icons and synthetic sample data are cached with the app. Updates are offered through an explicit reload; the saved data key does not change.

## Owned decisions

| Decision | Reason |
| --- | --- |
| Empty first launch | Personal results must not be confused with demo records. |
| Bankroll remains lifetime net | Preserves the prototype's model; imported starting balances are not session profit. |
| Keep an explicit sample-log action | Supports learning and parity checks while preserving personal data and allowing separate demo removal. |
| Publish a synthetic XML sample | Makes the importer demonstrable without exposing the user's financial history. |
| Full replacement on restore | Produces a faithful snapshot round trip without ambiguous cross-currency merges or duplicated live sessions. |
| File-based iCloud workflow | Web apps cannot silently access or synchronize iCloud Drive; the user chooses the Files destination. |

## Failures resolved and remaining limits

During development, browser checks found a button line-height mismatch and a modal Tab-focus escape; both were corrected. A test locator incorrectly searched Recent for an older venue and was corrected to use the full log. No unresolved functional failure is known in the passing standard suite.

Native iPhone installation, Files/iCloud behavior and the OS share sheet remain manual checks. GitHub authentication is verified; publishing waits for repository name and visibility approval. There is no account, server sync, tournament support, hand-history import or live exchange-rate service.
