# xbenben parity and verification

Initial verification: 2026-09-22. Rename, session-currency, big-blind stats and typography/favicon verification: 2026-09-23. Chrome, 402×874; primary tabs also checked at 320 pixels. Private financial figures are intentionally omitted from this public report.

## Screens

The native React view is ported from the reference markup. The comparison uses identical fixture data and a fixed clock, hides only the prototype's painted iPhone hardware, and sets the app's test safe areas to the prototype's geometry. The actual app uses the device's `env(safe-area-inset-*)` values. The optional script writes ignored local screenshots and a gallery; no private screenshot is published.

| Screen | Verification and result |
| --- | --- |
| 01 Bankroll home | Passed: sample figures, combined-currency totals, converted recent results, empty state and resume state. The xbenben wordmark and conversion note are deliberate additions. |
| 02 Session log | Passed: All / Wins / Losses, every original-currency row, converted summary, hours and navigation. Currency labels clarify the amounts. |
| 03 Session detail | Passed: signed result, hourly/big-blind rate, buy-ins, tips, duration, city and notes. Live/online play type can be corrected. Amounts stay in the session currency; delete confirms. |
| 04 New session | Passed: venue/stakes presets, session-currency and live/online pickers, remembered last-created setup, explicit buy-in entry, repeat/default shortcuts and custom choices. Added controls keep the Industry layout. |
| 05 Live session | Passed: timer, invested sum, prescribed re-buy options, reload and close/reopen. Added a return-to-home control. The status now says In progress, distinguishing the running clock from live/online play type. |
| 06 Cash out | Passed: cash/tips selection, keyboard, result equation, booking and currency. Valid zero-chip booking now looks enabled. |
| 07 Stats | Passed: weighted average bb/hour and estimated bb/100, converted curve, native-currency stake groups and converted superlatives. Lifetime colour follows lifetime net; single-session curves and peaks render correctly. |
| 08 Settings | Passed: defaults, validated live/online hands/hour estimates, all three tweaks, CSV, safe sample controls, display currency, fixed-rate notes, backup/restore and storage status. Added controls extend the scrollable screen. |
| 09 Import: pick | Passed: real file input, errors, mapping copy and a synthetic sample. Monospace mapping text now uses Industry's Barlow body token. |
| 09 Import: map | Passed: date span, currencies, venues, fixed rate and skip switch. Filename uses Barlow. |
| 09 Import: review | Passed: per-row data, included totals, skipped rows, back navigation and commit. Same data produces the reference layout. |

The baseline nine screens and all three import stages were captured in a real browser. The updated new-session, Home, Stats, log and Settings screens were inspected at 402×874; new-session and multi-currency Stats layouts were also checked at 320px without horizontal overflow. Screenshot comparison uses Pixelmatch's 0.15 perceptual threshold; zero counted differences is not a claim of byte-identical images across browsers. The baseline gallery records its comparison percentages; newer requirements deliberately change currency behavior and add the controls described here.

## Acceptance checks

| Check | Result and evidence |
| --- | --- |
| 1. USD sample | Passed in Chrome: six fictional sessions, all requested aggregates and four recent results. |
| 2. Supplied private import | The baseline private-file import passed locally for parsing, venues, fixed conversion, figures and duplicates. The later user requirement supersedes currency isolation and parked-session totals: all supported currencies now contribute to reports. The private fixture and its tests are excluded from Git/CI. Public regression tests use a new synthetic export. |
| 3. Bad XML | Passed: invalid XML, no cash sessions and unreadable dates retain step one and the specified messages. |
| 4. Live session | Passed: start, re-buy, simulated elapsed time, reload, close/reopen, currency change, cash/tips entry and booking; original timestamp and buy-ins survive. |
| 5. Visual parity | Passed with the documented deliberate differences. Reference screenshots, app screenshots and diff images were inspected locally. |
| 6. Clean build | Passed from a fresh local clone of source commit `06a2681`; the renamed app also passed in a fresh GitHub Actions Ubuntu checkout at `bf85ef4`. Both installed dependencies, ran all 9 unit and 18 browser tests, built production assets and passed the privacy audit. The local `/xbenben/` subdirectory/offline check also passed. |
| 7. Backup round trip | Passed in Chrome: two currencies, a live session with re-buy, theme, venues/stakes, preview without mutation, cancelled restore and exact confirmed replacement. Corrupt, unrelated and unsupported-version files are rejected. |
| 8. Publishing | Passed: [HTTPS app](https://qdddddd.github.io/xbenben/) and [public source](https://github.com/qdddddd/xbenben), with a successful Actions deployment. Live Chrome checks verified the name/icons, manifest scope, two-currency synthetic imports, backup download, offline reload with a running session and local fonts. Private-file URLs return 404; the Git history/site privacy audit passes. |
| 9. Physical iPhone | Not run on this machine. Installation, native share sheet, iCloud Drive/AirDrop and airplane-mode checks are specified in README. |

The current suite passes 15 unit tests and 26 Chrome browser tests. It checks a real CSV/JSON download, offline fonts/sample/icons, storage-denial/corruption handling, keyboard focus, simulated share cancellation and a genuine service-worker script update. The update test verifies that a reload is offered and the stored ledger is retained. The share test mocks the OS API; it does not claim to verify iCloud delivery.

The updated reference's Barlow Semi Condensed 600 headings, Barlow 500 body, lighter Home metadata and Barlow Log metadata are implemented. The nine-screen comparison and all import stages were recaptured against the supplied font update. Home, Log, Stats and Settings were also reviewed at 402px and 320px. The tighter stat labels retain a single line and ellipsis; Home now says Avg. Long HKD summaries exposed overflow after the font change, so amounts now shrink only when their available width requires it. A browser regression checks the full values against their card widths while resizing down and back up.

Direction 1C's smallest chip variant is used only for the favicon, following the user's latest scope. SVG plus 16/32 px PNG fallbacks were inspected at small sizes on light and dark backgrounds. Installed/PWA icons are unchanged. Browser checks verify the fixed accent, absence of the artwork from app content, and offline loading of the new heading/body fonts and all three favicon files. The fonts' original OFL notices ship with the app.

Single-blind import regression: a synthetic export with a single 25 blind and a separate 5 ante imports as 12.5/25, retaining its two buy-ins, cash-out and tips. Its +250 native net over two hours produces +5.0 bb/hour and estimated +16.7 bb/100; reload and duplicate checks pass. Invalid numbers, negative amounts and missing results are still rejected without changing existing records. The reported private export was also checked locally; its contents and evidence remain excluded from Git and the site.

Big-blind verification combines a two-hour live session winning 20 bb and a one-hour online session winning 15 bb. The starting 30/75 hands/hour estimates produce +25.9 bb/100 and +11.7 bb/hour. Changing the estimates to 20/100 yields +25.0 bb/100 with the hourly rate unchanged; correcting the live session to online yields +11.7 bb/100. Tests cover display-currency independence, unknown currencies, negative and zero results, zero-duration/zero-blind exclusions, running-session exclusion, invalid estimates, cancel/save/reload, legacy storage/backups and full backups containing online sessions and custom estimates. The six USD examples display +59.2 bb/100 and +17.8 bb/hour. Stats, New session and the estimate dialog were inspected at 402px and 320px; the smaller setup screen scrolls to its remaining controls. The Pages subdirectory/offline check also passes.

The new reporting check combines six USD demos with the three fictional HKD records: nine sessions, 42.7 hours, +$3,456 displayed in USD or +HK$27,003 displayed in HKD. Tests also verify that a new HKD session books in HKD while reporting in USD/EUR, the last-created setup survives reload/discard/later imports, native stakes stay separate, unsupported rates are visible, CSV includes both currencies, and legacy saved records/backups migrate safely.

A real Pages update from `bf85ef4` to `15bedf3` was also verified in a retained Chrome profile after [successful deployment](https://github.com/qdddddd/xbenben/actions/runs/35763684641). Nine synthetic sessions in two currencies, a running session with a re-buy, settings and backup metadata survived closing/reopening the browser, the visible update prompt, explicit reload into the new release and an offline restart. Every persisted field matched the original snapshot.

## Deliberate changes

- User-requested rename: xbenben replaces Ledger in the app name, wordmark, install metadata, messages and download filenames; the blueprint icon now uses an X. The reference files, stored-data key and backup format remain compatible.
- The updated design defaults are shipped without its typeface/heavier exploration controls. The new chip artwork is confined to the favicon; the broader install-icon replacement in the earlier design brief was superseded by the user's latest instruction.
- Real safe areas replace the design sheet, bezel, status bar and home indicator. Desktop width is capped; small viewports scroll within screens.
- First launch is empty. Sample restoration is confirmed, tagged and idempotent, preserves personal records, switches to USD and offers separate sample removal.
- The shipped XML sample is entirely fictional. The user's export is accepted through the file picker but never included in public assets, tests or screenshots.
- Accent and P&L colour settings are added; quick-start toggles immediately. Other accent presets change the related ramp as well as the base accent.
- Venue/stake pickers include the log, imported and user-added choices. Defaults include Macau table, Home game and Las Vegas venues, with stakes from 0.5/1 to 500/1000. Choices persist independently of log deletion. New setup prefers the last session created; before one exists, it uses the latest logged session or saved defaults. Buy-in entry stays explicit.
- Each session has its own currency. Starting, booking and importing leave the global display currency unchanged; active amounts and details retain the session currency. A second new-session action resumes the existing session.
- Home and Stats convert original session net at the fixed pair rate, summing without per-session rounding. Only formatted values are rounded. Rate notes explain conversion; unavailable rates are explicitly excluded from totals while entries remain accessible. The log shows original values and a converted summary, and stake groups include their native currency.
- Last-created setup and draft currency persist and are included in backups. Older saved data and version-1 backups gain these optional defaults without changing sessions or live timestamps.
- Stats adds average bb/hour and estimated bb/100 in Industry blueprint cards. Each result is divided by its native big blind, then totals are weighted by hours or estimated hands. Currency conversion does not apply. Sessions lacking positive duration or blinds are excluded with an explanation; no eligible data shows a dash.
- Hands/hour settings start at 30 live and 75 online, accept whole numbers from 1 to 10,000, and recalculate historical estimates. Online estimates include all tables. Live/online play type is chosen at setup, remembered, and editable on completed sessions; older untagged records and analytics7 imports count as live. Settings and play type are backed up, and CSV appends a `play_type` column.
- Delete, discard and erase require a separate confirmation. Zero-chip cash-out is valid and visually enabled.
- Stats uses lifetime net's sign and draws a correct single-session curve/peak. Zero big blinds do not produce infinite rates.
- Imports use the owning result where supplied, validate dates/amounts, reject mixed-currency exports and omit unsupported conversion pairs. The displayed fixed rate is the one applied. Kept amounts are not rounded again.
- Imports also accept a single numeric blind as the big blind, defaulting the small blind to half that value independently of the ante. This follows the user's clarified rule while preserving explicit small/big pairs and all money amounts.
- Duplicate recognition keeps the original venue / under-two-minutes rule, also checks earlier rows in the same import, and gives imported copies distinct internal IDs. Importing zero included rows is disabled.
- XML errors preserve the requested messages; extra validation has specific messages. File input selection resets so the same file can be picked again. XML files are limited to 10 MB; backups to 20 MB.
- CSV exports all sessions in their original currencies, with exact numeric values, quoted fields and protection against spreadsheet formula injection. The numpad consistently limits manual amounts to nine digits.
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

Native iPhone installation, Files/iCloud behavior and the OS share sheet remain manual checks. The published app passes desktop Chrome verification. There is no account, server sync, tournament support, hand-history import or live exchange-rate service.
