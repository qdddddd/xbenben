import { Fragment } from "react";
import FittedValue from "./FittedValue.jsx";
import { Sheet, BackupControls, ConversionNote, BigBlindStats } from "./Overlays.jsx";

// Native React markup ported from the read-only Ledger design. No template runtime.
export default function LedgerView(v) {
return (<div className="ledger-app" style={{"height": "100%", "display": "flex", "flexDirection": "column", "overflow": "hidden", "background": "var(--color-bg)", "fontFamily": "var(--font-body)", "color": "var(--color-text)"}}>
{v.isHome && <>

<div aria-label="home" style={{"flex": "1", "overflowY": "auto", "padding": "calc(var(--safe-top) + var(--size-16)) var(--size-20) var(--size-12)"}} data-screen={"home"}>
<div style={{"display": "flex", "alignItems": "flex-start", "justifyContent": "space-between"}}>
<div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{v.dateLine}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "letterSpacing": ".02em", "marginTop": "var(--size-1)"}}>{"xbenben"}</div>
</div>
<div style={{"textAlign": "right", "fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)", "fontFamily": "var(--font-heading)", "letterSpacing": ".1em", "textTransform": "uppercase", "paddingTop": "var(--size-4)"}}>{(v.sessionCount) + " sessions"}<br />{(v.hoursText) + " h logged"}</div>
</div>
<ConversionNote v={v} />
<div style={{"marginTop": "var(--size-20)", "padding": "var(--size-16) var(--size-16) 0"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"display": "flex", "alignItems": "baseline", "justifyContent": "space-between"}}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Bankroll · " + (v.currency)}</div>
<div style={{"fontSize": "var(--text-caption)", "fontFamily": "var(--font-heading)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": v.monthColor}}>{(v.monthText) + " this month"}</div>
</div>
<FittedValue data-testid="bankroll" style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-hero)", "lineHeight": "1", "letterSpacing": "-.01em", "fontVariantNumeric": "tabular-nums", "marginTop": "var(--size-6)"}}>{v.bankrollText}</FittedValue>
<div style={{"margin": "var(--size-12) calc(-1 * var(--size-16)) 0", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
<svg aria-hidden="true" focusable="false" viewBox={"0 0 370 72"} width={"100%"} height={"72"} style={{"display": "block"}} preserveAspectRatio={"none"}>
<polygon points={v.sparkArea} fill={"var(--color-accent)"} opacity={"0.14"}></polygon>
<polyline points={v.sparkLine} fill={"none"} stroke={"var(--color-accent)"} strokeWidth={"1.5"}></polyline>
<line x1={"0"} x2={"370"} y1={v.sparkZero} y2={v.sparkZero} stroke={"var(--color-text)"} strokeOpacity={".25"} strokeWidth={"1"} strokeDasharray={"3 4"}></line>
</svg>
</div>
<div style={{"display": "grid", "gridTemplateColumns": "repeat(3, minmax(0, 1fr))", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
<div style={{"padding": "var(--size-10) 0 var(--size-12)"}}>
<div className="stat-label">{"Per hour"}</div>
<FittedValue style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-stat)", "fontVariantNumeric": "tabular-nums", "color": v.hourlyColor}}>{v.hourlyText}</FittedValue>
</div>
<div style={{"padding": "var(--size-10) 0 var(--size-12) var(--size-14)", "borderLeft": "var(--size-1) solid var(--color-divider)"}}>
<div className="stat-label">{"Win rate"}</div>
<FittedValue style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-stat)", "fontVariantNumeric": "tabular-nums"}}>{v.winRateText}</FittedValue>
</div>
<div style={{"padding": "var(--size-10) 0 var(--size-12) var(--size-14)", "borderLeft": "var(--size-1) solid var(--color-divider)"}}>
<div className="stat-label">{"Avg"}</div>
<FittedValue style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-stat)", "fontVariantNumeric": "tabular-nums", "color": v.avgColor}}>{v.avgText}</FittedValue>
</div>
</div>
</div>
{v.hasActive && <>

<button type="button" onClick={v.goActive} style={{"width": "100%", "marginTop": "var(--size-26)", "padding": "var(--size-13) var(--size-14)", "background": "var(--color-accent)", "color": "var(--color-bg)", "borderColor": "var(--color-accent)", "display": "flex", "alignItems": "center", "gap": "var(--size-10)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".12em", "textTransform": "uppercase"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<span style={{"width": "var(--size-8)", "height": "var(--size-8)", "background": "var(--color-bg)", "animation": "lg-blink 1.2s infinite"}}></span>
<span style={{"flex": "1", "textAlign": "left"}}>{"Session running · " + (v.timerText)}</span>
<span style={{"fontSize": "var(--text-label)"}}>{"RESUME →"}</span>
</button>

</>}
{v.noActive && <>

<button type="button" onClick={v.goNew} style={{"width": "100%", "marginTop": "var(--size-26)", "padding": "var(--size-15) var(--size-14)", "background": "var(--color-accent)", "color": "var(--color-bg)", "borderColor": "var(--color-accent)", "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "var(--size-8)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".14em", "textTransform": "uppercase"}} className="blueprint interaction-0"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<svg aria-hidden="true" focusable="false" width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"}><path d={"M12 5v14M5 12h14"}></path></svg>{"\nStart session\n"}</button>

</>}
<div style={{"display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "marginTop": "var(--size-28)"}}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Recent"}</div>
<button type="button" onClick={v.goLog} style={{"background": "transparent", "border": "0", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)", "padding": "0"}}>{"All " + (v.sessionCount) + " →"}</button>
</div>
{v.noSessions && <>

<div style={{"marginTop": "var(--size-12)", "padding": "var(--size-22) var(--size-16)", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "var(--size-8)", "textAlign": "center"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<svg aria-hidden="true" focusable="false" width={"26"} height={"26"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-accent)"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"}><path d={"M4 5h16v14H4zM4 10h16M9 5V3M15 5V3"}></path></svg>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".08em", "textTransform": "uppercase"}}>{v.emptyTitle}</div>
<div style={{"fontSize": "var(--text-label)", "lineHeight": "1.45", "color": "var(--color-neutral-700)", "maxWidth": "var(--size-238)"}}>{v.emptyLine}</div>
<button type="button" onClick={v.openImport} style={{"marginTop": "var(--size-4)", "fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "padding": "var(--size-9) var(--size-14)"}} className="btn btn-secondary">{"Import from analytics7"}</button>
</div>

</>}
<div style={{"marginTop": "var(--size-6)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.recent.map((r, index) => <Fragment key={r.id ?? index}>

<button type="button" onClick={r.onClick} style={{"width": "100%", "display": "flex", "alignItems": "center", "gap": "var(--size-12)", "textAlign": "left", "background": "transparent", "border": "0", "borderBottom": "var(--size-1) solid var(--color-divider)", "padding": "var(--size-11) var(--size-2)", "cursor": "pointer", "fontFamily": "var(--font-body)"}} className="interaction-1">
<span style={{"width": "var(--size-40)", "height": "var(--size-40)", "flex": "none", "border": "var(--size-1) solid var(--color-divider)", "display": "grid", "placeItems": "center", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".02em", "color": "var(--color-accent-700)"}}>{r.stakes}</span>
<span style={{"flex": "1", "minWidth": "0"}}>
<span style={{"display": "block", "fontSize": "var(--text-body)", "fontWeight": "500", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>{r.venue}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)", "fontFamily": "var(--font-heading)", "letterSpacing": ".08em", "textTransform": "uppercase", "marginTop": "var(--size-1)"}}>{r.meta}</span>
</span>
<span style={{"textAlign": "right"}}>
<span style={{"display": "block", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-number)", "fontVariantNumeric": "tabular-nums", "color": r.color}}>{r.pnl}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "fontFamily": "var(--font-heading)", "letterSpacing": ".08em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{(r.rate) + "/h"}</span>
</span>
</button>

</Fragment>)}
</div>
</div>

</>}
{v.isLog && <>

<div aria-label="log" style={{"flex": "1", "overflowY": "auto", "padding": "calc(var(--safe-top) + var(--size-16)) var(--size-20) var(--size-12)"}} data-screen={"log"}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "letterSpacing": ".02em"}}>{"SESSIONS"}</div>
<ConversionNote v={v} />
<p className="screen-help">Original session amounts · summary in {v.currency}</p>
<div style={{"display": "flex", "marginTop": "var(--size-14)", "border": "var(--size-1) solid var(--color-divider)"}}>
{v.filters.map((f, index) => <Fragment key={f.id ?? index}>

<button type="button" onClick={f.onClick} style={{"flex": "1", "padding": "var(--size-9) 0", "background": f.bg, "color": f.fg, "border": "0", "borderLeft": "var(--size-1) solid var(--color-divider)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>{f.label}</button>

</Fragment>)}
</div>
<div style={{"marginTop": "var(--size-16)", "display": "grid", "gridTemplateColumns": "repeat(3, minmax(0, 1fr))"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"padding": "var(--size-10) var(--size-12)"}}>
<div className="stat-label">{"Shown"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-stat)", "fontVariantNumeric": "tabular-nums"}}>{v.logCount}</div>
</div>
<div style={{"padding": "var(--size-10) var(--size-12)", "borderLeft": "var(--size-1) solid var(--color-divider)"}}>
<div className="stat-label">{"Net"}</div>
<FittedValue style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-stat)", "fontVariantNumeric": "tabular-nums", "color": v.logNetColor}}>{v.logNet}</FittedValue>
</div>
<div style={{"padding": "var(--size-10) var(--size-12)", "borderLeft": "var(--size-1) solid var(--color-divider)"}}>
<div className="stat-label">{"Hours"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-stat)", "fontVariantNumeric": "tabular-nums"}}>{v.logHours}</div>
</div>
</div>
{v.noLogRows && <>

<div style={{"marginTop": "var(--size-16)", "padding": "var(--size-22) var(--size-16)", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "var(--size-8)", "textAlign": "center"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".08em", "textTransform": "uppercase"}}>{v.logEmptyTitle}</div>
<div style={{"fontSize": "var(--text-label)", "lineHeight": "1.45", "color": "var(--color-neutral-700)", "maxWidth": "var(--size-238)"}}>{v.logEmptyLine}</div>
</div>

</>}
<div style={{"marginTop": "var(--size-18)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.logRows.map((r, index) => <Fragment key={r.id ?? index}>

<button type="button" onClick={r.onClick} style={{"width": "100%", "display": "flex", "alignItems": "center", "gap": "var(--size-12)", "textAlign": "left", "background": "transparent", "border": "0", "borderBottom": "var(--size-1) solid var(--color-divider)", "padding": "var(--size-11) var(--size-2)", "cursor": "pointer", "fontFamily": "var(--font-body)"}} className="interaction-2">
<span style={{"width": "var(--size-40)", "height": "var(--size-40)", "flex": "none", "border": "var(--size-1) solid var(--color-divider)", "display": "grid", "placeItems": "center", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "color": "var(--color-accent-700)"}}>{r.stakes}</span>
<span style={{"flex": "1", "minWidth": "0"}}>
<span style={{"display": "block", "fontSize": "var(--text-body)", "fontWeight": "500", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>{r.venue}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)", "fontFamily": "var(--font-heading)", "letterSpacing": ".08em", "textTransform": "uppercase", "marginTop": "var(--size-1)"}}>{r.meta}</span>
</span>
<span style={{"textAlign": "right"}}>
<span style={{"display": "block", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-number)", "fontVariantNumeric": "tabular-nums", "color": r.color}}>{r.pnl}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "fontFamily": "var(--font-heading)", "letterSpacing": ".08em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{(r.rate) + "/h"}</span>
</span>
</button>

</Fragment>)}
</div>
</div>

</>}
{v.isStats && <>

<div aria-label="stats" style={{"flex": "1", "overflowY": "auto", "padding": "calc(var(--safe-top) + var(--size-16)) var(--size-20) var(--size-12)"}} data-screen={"stats"}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "letterSpacing": ".02em"}}>{"STATS"}</div>
<BigBlindStats v={v} />
<ConversionNote v={v} />
{v.noSessions && <>

<div style={{"marginTop": "var(--size-16)", "padding": "var(--size-24) var(--size-16)", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "var(--size-8)", "textAlign": "center"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<svg aria-hidden="true" focusable="false" width={"26"} height={"26"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-accent)"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"}><path d={"M4 20h16M7 17V9M12 17V5M17 17v-6"}></path></svg>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".08em", "textTransform": "uppercase"}}>{"No " + (v.currency) + " data yet"}</div>
<div style={{"fontSize": "var(--text-label)", "lineHeight": "1.45", "color": "var(--color-neutral-700)", "maxWidth": "var(--size-238)"}}>{v.emptyLine}</div>
<button type="button" onClick={v.openImport} style={{"marginTop": "var(--size-4)", "fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "padding": "var(--size-9) var(--size-14)"}} className="btn btn-secondary">{"Import from analytics7"}</button>
</div>

</>}
{v.hasSessions && <>

<div style={{"marginTop": "var(--size-16)", "padding": "var(--size-14) var(--size-14) 0"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"display": "flex", "alignItems": "baseline", "justifyContent": "space-between"}}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Lifetime curve · " + v.currency}</div>
<div style={{"fontSize": "var(--text-caption)", "fontFamily": "var(--font-heading)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{v.curveSpan}</div>
</div>
<FittedValue data-testid="bankroll" style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-display)", "lineHeight": "1.1", "fontVariantNumeric": "tabular-nums", "color": v.avgColor}}>{v.bankrollText}</FittedValue>
<div style={{"margin": "var(--size-6) calc(-1 * var(--size-14)) 0"}}>
<svg aria-hidden="true" focusable="false" viewBox={"0 0 342 150"} width={"100%"} height={"150"} style={{"display": "block"}} preserveAspectRatio={"none"}>
<line x1={"0"} x2={"342"} y1={"37.5"} y2={"37.5"} stroke={"var(--color-text)"} strokeOpacity={".08"}></line>
<line x1={"0"} x2={"342"} y1={"112.5"} y2={"112.5"} stroke={"var(--color-text)"} strokeOpacity={".08"}></line>
<polygon points={v.curveArea} fill={"var(--color-accent)"} opacity={"0.14"}></polygon>
<polyline points={v.curveLine} fill={"none"} stroke={"var(--color-accent)"} strokeWidth={"1.5"}></polyline>
<line x1={"0"} x2={"342"} y1={v.curveZero} y2={v.curveZero} stroke={"var(--color-text)"} strokeOpacity={".3"} strokeDasharray={"3 4"}></line>
</svg>
</div>
<div style={{"display": "flex", "justifyContent": "space-between", "borderTop": "var(--size-1) solid var(--color-divider)", "padding": "var(--size-7) 0 var(--size-9)", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".12em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>
<span>{v.curveFirst}</span><span>{(v.curvePeak) + " peak"}</span><span>{v.curveLast}</span>
</div>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-24)"}}>{"By stake"}</div>
<div className="table-scroll" role="region" aria-label="Results by stake" tabIndex={0}>
<table style={{"marginTop": "var(--size-4)"}} className="table">
<thead><tr><th>{"Stake"}</th><th style={{"textAlign": "right"}}>{"Sess"}</th><th style={{"textAlign": "right"}}>{"Hours"}</th><th style={{"textAlign": "right"}}>{"Net · " + v.currency}</th><th style={{"textAlign": "right"}}>{"Per hour"}</th></tr></thead>
<tbody>
{v.byStake.map((b, index) => <Fragment key={b.id ?? index}>

<tr>
<td style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)"}}>{b.label}</td>
<td style={{"textAlign": "right", "fontVariantNumeric": "tabular-nums"}}>{b.n}</td>
<td style={{"textAlign": "right", "fontVariantNumeric": "tabular-nums"}}>{b.hours}</td>
<td style={{"textAlign": "right", "fontVariantNumeric": "tabular-nums", "color": b.color}}>{b.net}</td>
<td style={{"textAlign": "right", "fontVariantNumeric": "tabular-nums", "color": b.color}}>{b.rate}</td>
</tr>

</Fragment>)}
</tbody>
</table>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-24)"}}>{"Superlatives"}</div>
<div style={{"marginTop": "var(--size-6)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.supers.map((s, index) => <Fragment key={s.id ?? index}>

<div style={{"display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "var(--size-10)", "padding": "var(--size-10) var(--size-2)", "borderBottom": "var(--size-1) solid var(--color-divider)"}}>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".12em", "textTransform": "uppercase", "color": "var(--color-neutral-700)", "flex": "none"}}>{s.label}</span>
<span style={{"flex": "1", "textAlign": "right", "fontSize": "var(--text-label)"}}>{s.value}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "fontVariantNumeric": "tabular-nums", "flex": "none", "color": s.color}}>{s.figure}</span>
</div>

</Fragment>)}
</div>

</>}
</div>

</>}
{v.isSettings && <>

<div aria-label="settings" style={{"flex": "1", "overflowY": "auto", "padding": "calc(var(--safe-top) + var(--size-16)) var(--size-20) var(--size-12)"}} data-screen={"settings"}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "letterSpacing": ".02em"}}>{"SETTINGS"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-22)"}}>{"Defaults"}</div>
<div style={{"marginTop": "var(--size-6)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.setRows.map((s, index) => <Fragment key={s.id ?? index}>

<button type="button" onClick={s.onClick} style={{"width": "100%", "display": "flex", "alignItems": "center", "gap": "var(--size-10)", "textAlign": "left", "background": "transparent", "border": "0", "borderBottom": "var(--size-1) solid var(--color-divider)", "padding": "var(--size-13) var(--size-2)", "cursor": "pointer", "fontFamily": "var(--font-body)", "fontSize": "var(--text-body)", "color": "var(--color-text)"}} className="interaction-3">
<span style={{"flex": "1"}}>{s.label}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "color": "var(--color-accent-700)"}}>{s.value}</span>
<svg aria-hidden="true" focusable="false" width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-neutral-500)"} strokeWidth={"1.5"}><path d={"M9 6l6 6-6 6"}></path></svg>
</button>

</Fragment>)}
</div>
<section className="reporting-info" aria-label="Display currency information">
<p>Home and Stats combine sessions in {v.currency}. The log and session details keep their original amounts.</p>
{v.rateNotes.map(note => <p key={note}>{note}</p>)}
{v.missingRateNote && <p role="status">{v.missingRateNote}</p>}
<p>New sessions repeat your last setup. Defaults apply before your first session or through the Default quick-start.</p>
</section>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-24)"}}>{"Transfer"}</div>
<button type="button" onClick={v.openImport} style={{"width": "100%", "marginTop": "var(--size-8)", "padding": "var(--size-12) var(--size-14)", "display": "flex", "alignItems": "center", "gap": "var(--size-12)", "textAlign": "left", "background": "transparent", "cursor": "pointer", "fontFamily": "var(--font-body)"}} className="blueprint interaction-4"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<svg aria-hidden="true" focusable="false" width={"20"} height={"20"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-accent-700)"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"}><path d={"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"}></path></svg>
<span style={{"flex": "1"}}>
<span style={{"display": "block", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".04em"}}>{"Import from analytics7"}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)"}}>{"Model .xml export · cash sessions"}</span>
</span>
<svg aria-hidden="true" focusable="false" width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-neutral-500)"} strokeWidth={"1.5"}><path d={"M9 6l6 6-6 6"}></path></svg>
</button>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-24)"}}>{"Data"}</div>
<div style={{"marginTop": "var(--size-8)", "display": "flex", "flexDirection": "column", "gap": "var(--size-8)"}}>
<button type="button" onClick={v.onExport} style={{"fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "padding": "var(--size-12)"}} className="btn btn-secondary btn-block">{"Export CSV"}</button>
<button type="button" onClick={v.onSeed} style={{"fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "padding": "var(--size-12)"}} className="btn btn-secondary btn-block">{"Restore sample log"}</button>
{v.hasSamples && <button className="btn btn-secondary btn-block data-button" onClick={v.removeSamples}>Remove sample log</button>}
<button type="button" onClick={v.onReset} style={{"fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "padding": "var(--size-12)", "color": "var(--color-neutral-900)"}} className="btn btn-secondary btn-block">{"Erase all sessions"}</button>
</div>
<BackupControls controller={v.controller} />
<div style={{"fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)", "marginTop": "var(--size-14)", "fontFamily": "var(--font-heading)", "letterSpacing": ".1em", "textTransform": "uppercase"}}>{"xbenben 1.0 · sheet 01 · " + (v.sessionCount) + " records"}</div>
</div>

</>}
{v.isDetail && <>

<div aria-label="detail" style={{"flex": "1", "overflowY": "auto", "padding": "calc(var(--safe-top) + var(--size-10)) var(--size-20) var(--size-20)"}} data-screen={"detail"}>
<button type="button" onClick={v.goBack} style={{"display": "flex", "alignItems": "center", "gap": "var(--size-5)", "background": "transparent", "border": "0", "padding": "var(--size-6) 0", "cursor": "pointer", "color": "var(--color-accent-700)", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>
<svg aria-hidden="true" focusable="false" width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"}><path d={"M15 6l-6 6 6 6"}></path></svg>{"Back"}</button>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-metric)", "letterSpacing": ".01em", "marginTop": "var(--size-8)"}}>{v.d.venue}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".14em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{(v.d.when) + " · " + (v.d.cur) + " · " + (v.d.game) + " " + (v.d.stakes) + " · " + (v.d.seats) + "-max"}</div>
<button type="button" className="play-type-row" onClick={v.d.editPlayType}><span>Play type</span><span>{v.d.playType} · Edit</span></button>
<div style={{"marginTop": "var(--size-18)", "padding": "var(--size-14) var(--size-16)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Result"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-amount)", "lineHeight": "1", "fontVariantNumeric": "tabular-nums", "color": v.d.color, "marginTop": "var(--size-4)"}}>{v.d.pnl}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)", "marginTop": "var(--size-4)"}}>{(v.d.rate) + " / hour · " + (v.d.bbRate) + " bb/h"}</div>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-22)"}}>{"Breakdown"}</div>
<div style={{"marginTop": "var(--size-6)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.d.lines.map((l, index) => <Fragment key={l.id ?? index}>

<div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline", "padding": "var(--size-9) var(--size-2)", "borderBottom": "var(--size-1) solid var(--color-divider)"}}>
<span style={{"fontSize": "var(--text-label)", "color": "var(--color-neutral-800)"}}>{l.label}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-number)", "fontVariantNumeric": "tabular-nums", "color": l.color}}>{l.value}</span>
</div>

</Fragment>)}
</div>
<div style={{"display": "grid", "gridTemplateColumns": "repeat(2, minmax(0, 1fr))", "gap": "var(--size-10)", "marginTop": "var(--size-18)"}}>
{v.d.tiles.map((t, index) => <Fragment key={t.id ?? index}>

<div style={{"padding": "var(--size-10) var(--size-12)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div className="stat-label">{t.label}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-stat)", "fontVariantNumeric": "tabular-nums"}}>{t.value}</div>
</div>

</Fragment>)}
</div>
{v.d.hasNotes && <>

<div style={{"marginTop": "var(--size-18)", "padding": "var(--size-12) var(--size-14)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".14em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Notes"}</div>
<div style={{"fontSize": "var(--text-label)", "lineHeight": "1.5", "marginTop": "var(--size-3)"}}>{v.d.notes}</div>
</div>

</>}
<button type="button" onClick={v.onDelete} style={{"marginTop": "var(--size-20)", "fontSize": "var(--text-label)", "letterSpacing": ".14em", "textTransform": "uppercase", "padding": "var(--size-12)"}} className="btn btn-secondary btn-block">{"Delete session"}</button>
</div>

</>}
{v.isNew && <>

<div aria-label="new" style={{"flex": "1", "display": "flex", "flexDirection": "column", "minHeight": "0"}} data-screen={"new"}>
<div style={{"padding": "calc(var(--safe-top) + var(--size-10)) var(--size-20) 0", "display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
<button type="button" onClick={v.onCancelNew} style={{"background": "transparent", "border": "0", "padding": "var(--size-6) 0", "cursor": "pointer", "color": "var(--color-accent-700)", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>{"Cancel"}</button>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".18em", "textTransform": "uppercase"}}>{"New session"}</div>
<div style={{"width": "var(--size-48)"}}></div>
</div>
<div style={{"flex": "1", "overflowY": "auto", "padding": "0 var(--size-20)"}}>
{v.showQuick && <>

<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-12)"}}>{"One tap · starts immediately"}</div>
<div style={{"display": "flex", "gap": "var(--size-8)", "marginTop": "var(--size-6)"}}>
{v.presets.map((p, index) => <Fragment key={p.id ?? index}>

<button type="button" onClick={p.onClick} style={{"flex": "1", "padding": "var(--size-9) var(--size-10)", "textAlign": "left", "background": "transparent", "cursor": "pointer", "fontFamily": "var(--font-body)"}} className="blueprint interaction-5"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<span style={{"display": "block", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "color": "var(--color-accent-700)"}}>{p.label}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>{p.sub}</span>
</button>

</Fragment>)}
</div>

</>}
<div style={{"display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "marginTop": "var(--size-18)", "borderBottom": "var(--size-1) solid var(--color-text)", "paddingBottom": "var(--size-6)"}}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "paddingBottom": "var(--size-6)"}}>{"Buy-in"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-amount)", "lineHeight": "1", "fontVariantNumeric": "tabular-nums"}}><output aria-label="Buy-in amount">{v.buyInText}</output></div>
</div>
<p className="screen-help">{v.draftHelp}</p>
<div style={{"borderTop": "var(--size-1) solid var(--color-divider)", "marginTop": "var(--size-14)"}}>
{v.draftRows.map((s, index) => <Fragment key={s.id ?? index}>

<button type="button" onClick={s.onClick} style={{"width": "100%", "display": "flex", "alignItems": "center", "gap": "var(--size-10)", "textAlign": "left", "background": "transparent", "border": "0", "borderBottom": "var(--size-1) solid var(--color-divider)", "padding": "var(--size-11) var(--size-2)", "cursor": "pointer", "fontFamily": "var(--font-body)", "fontSize": "var(--text-body)", "color": "var(--color-text)"}} className="interaction-6">
<span style={{"flex": "1"}}>{s.label}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "color": "var(--color-accent-700)"}}>{s.value}</span>
<svg aria-hidden="true" focusable="false" width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-neutral-500)"} strokeWidth={"1.5"}><path d={"M9 6l6 6-6 6"}></path></svg>
</button>

</Fragment>)}
</div>
<button type="button" onClick={v.onStart} disabled={v.startDisabled} style={{"width": "100%", "margin": "var(--size-16) 0 var(--size-14)", "padding": "var(--size-14)", "background": "var(--color-accent)", "color": "var(--color-bg)", "borderColor": "var(--color-accent)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".14em", "textTransform": "uppercase", "opacity": v.startOpacity}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>{"Start · clock runs"}</button>
</div>
<div style={{"background": "var(--color-surface)", "borderTop": "var(--size-1) solid var(--color-divider)", "padding": "var(--size-8) var(--size-6) max(var(--size-8), var(--safe-bottom))", "flex": "none"}}>
<div style={{"display": "grid", "gridTemplateColumns": "repeat(3,1fr)", "gap": "var(--size-1)"}}>
{v.padKeys.map((k, index) => <Fragment key={k.id ?? index}>

<button aria-label={k.label === "⌫" ? "Delete digit" : k.label} type="button" onClick={k.onClick} style={{"height": "var(--size-48)", "background": "var(--color-bg)", "border": "var(--size-1) solid var(--color-divider)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "color": "var(--color-text)"}} className="interaction-7 interaction-8">{k.label}</button>

</Fragment>)}
</div>
</div>
</div>

</>}
{v.isActive && <>

<div aria-label="active" style={{"flex": "1", "overflowY": "auto", "padding": "calc(var(--safe-top) + var(--size-10)) var(--size-20) var(--size-20)"}} data-screen={"active"}>
<div style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
<div style={{"display": "flex", "alignItems": "center", "gap": "var(--size-7)"}}>
<span style={{"width": "var(--size-8)", "height": "var(--size-8)", "background": "var(--color-accent)", "animation": "lg-blink 1.2s infinite"}}></span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".18em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"In progress"}</span>
</div>
<button type="button" onClick={v.onAbandon} style={{"background": "transparent", "border": "0", "padding": "var(--size-6) 0", "cursor": "pointer", "color": "var(--color-neutral-700)", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>{"Discard"}</button>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "letterSpacing": ".01em", "marginTop": "var(--size-10)"}}>{v.a.venue}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".14em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{(v.a.playType) + " · " + (v.a.cur) + " · " + (v.a.game) + " " + (v.a.stakes) + " · " + (v.a.seats) + "-max · started " + (v.a.startedAt)}</div>
<div style={{"marginTop": "var(--size-18)", "padding": "var(--size-16)", "textAlign": "center"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".18em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Elapsed"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-timer)", "lineHeight": "1", "fontVariantNumeric": "tabular-nums", "letterSpacing": ".01em"}}><span data-testid="timer">{v.timerText}</span></div>
</div>
<div style={{"display": "grid", "gridTemplateColumns": "repeat(2, minmax(0, 1fr))", "gap": "var(--size-10)", "marginTop": "var(--size-12)"}}>
<div style={{"padding": "var(--size-10) var(--size-12)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div className="stat-label">{"Invested"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "fontVariantNumeric": "tabular-nums"}}>{v.a.invested}</div>
</div>
<div style={{"padding": "var(--size-10) var(--size-12)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div className="stat-label">{"In big blinds"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "fontVariantNumeric": "tabular-nums"}}>{(v.a.bbs) + " bb"}</div>
</div>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-22)"}}>{"Buy-ins"}</div>
<div style={{"marginTop": "var(--size-6)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.a.buyIns.map((b, index) => <Fragment key={b.id ?? index}>

<div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline", "padding": "var(--size-9) var(--size-2)", "borderBottom": "var(--size-1) solid var(--color-divider)"}}>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".12em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{(b.label) + " · " + (b.at)}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-number)", "fontVariantNumeric": "tabular-nums"}}>{b.amount}</span>
</div>

</Fragment>)}
</div>
<div style={{"display": "flex", "gap": "var(--size-10)", "marginTop": "var(--size-18)"}}>
<button type="button" onClick={v.onOpenRebuy} style={{"flex": "1", "padding": "var(--size-14)", "background": "transparent", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-body)", "letterSpacing": ".12em", "textTransform": "uppercase", "color": "var(--color-text)"}} className="blueprint interaction-9"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>{"+ Re-buy"}</button>
<button type="button" onClick={v.goCashOut} style={{"flex": "1.2", "padding": "var(--size-14)", "background": "var(--color-accent)", "color": "var(--color-bg)", "borderColor": "var(--color-accent)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-body)", "letterSpacing": ".12em", "textTransform": "uppercase"}} className="blueprint interaction-10"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>{"Cash out"}</button>
</div>
<button className="btn btn-ghost ledger-return" onClick={v.backHome}>← Back to xbenben</button>
</div>

</>}
{v.isCashOut && <>

<div aria-label="cashout" style={{"flex": "1", "display": "flex", "flexDirection": "column", "minHeight": "0"}} data-screen={"cashout"}>
<div style={{"padding": "calc(var(--safe-top) + var(--size-10)) var(--size-20) 0", "display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
<button type="button" onClick={v.goActive} style={{"background": "transparent", "border": "0", "padding": "var(--size-6) 0", "cursor": "pointer", "color": "var(--color-accent-700)", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>{"Back"}</button>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".18em", "textTransform": "uppercase"}}>{"Cash out"}</div>
<div style={{"width": "var(--size-38)"}}></div>
</div>
<div style={{"flex": "1", "overflowY": "auto", "padding": "0 var(--size-20)"}}>
<button aria-pressed={v.cashFocused} type="button" onClick={v.focusCash} style={{"width": "100%", "display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "background": "transparent", "border": "0", "borderBottom": "var(--size-2) solid " + (v.cashBorder), "padding": "var(--size-14) 0 var(--size-6)", "cursor": "pointer", "textAlign": "left"}}>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "paddingBottom": "var(--size-6)"}}>{"Chips off table"}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-amount)", "lineHeight": "1", "fontVariantNumeric": "tabular-nums"}}><output aria-label="Chips off table amount">{v.cashText}</output></span>
</button>
<button aria-pressed={!v.cashFocused} type="button" onClick={v.focusTips} style={{"width": "100%", "display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "background": "transparent", "border": "0", "borderBottom": "var(--size-2) solid " + (v.tipsBorder), "padding": "var(--size-14) 0 var(--size-6)", "cursor": "pointer", "textAlign": "left"}}>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "paddingBottom": "var(--size-6)"}}>{"Tips & rake paid"}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-metric)", "lineHeight": "1", "fontVariantNumeric": "tabular-nums"}}><output aria-label="Tips amount">{v.tipsText}</output></span>
</button>
<div style={{"marginTop": "var(--size-18)", "padding": "var(--size-12) var(--size-14)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline"}}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Net result"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{(v.outDur) + " · " + (v.outRate) + "/h"}</div>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-amount)", "lineHeight": "1.05", "fontVariantNumeric": "tabular-nums", "color": v.outColor}}>{v.outNet}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)", "marginTop": "var(--size-2)"}}>{v.outMath}</div>
</div>
<button type="button" onClick={v.onConfirm} style={{"width": "100%", "margin": "var(--size-16) 0 var(--size-14)", "padding": "var(--size-14)", "background": "var(--color-accent)", "color": "var(--color-bg)", "borderColor": "var(--color-accent)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".14em", "textTransform": "uppercase", "opacity": v.confirmOpacity}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>{"Book session"}</button>
</div>
<div style={{"background": "var(--color-surface)", "borderTop": "var(--size-1) solid var(--color-divider)", "padding": "var(--size-8) var(--size-6) max(var(--size-8), var(--safe-bottom))", "flex": "none"}}>
<div style={{"display": "grid", "gridTemplateColumns": "repeat(3,1fr)", "gap": "var(--size-1)"}}>
{v.padKeys.map((k, index) => <Fragment key={k.id ?? index}>

<button aria-label={k.label === "⌫" ? "Delete digit" : k.label} type="button" onClick={k.onClick} style={{"height": "var(--size-48)", "background": "var(--color-bg)", "border": "var(--size-1) solid var(--color-divider)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-title)", "color": "var(--color-text)"}} className="interaction-11 interaction-12">{k.label}</button>

</Fragment>)}
</div>
</div>
</div>

</>}
{v.showTabs && <>

<div style={{"flex": "none", "display": "flex", "alignItems": "center", "borderTop": "var(--size-1) solid var(--color-divider)", "background": "var(--color-bg)", "padding": "var(--size-7) var(--size-12) max(var(--size-7), calc(var(--safe-bottom) - var(--size-4)))"}}>
{v.tabs.map((t, index) => <Fragment key={t.id ?? index}>

<button aria-current={t.active ? "page" : undefined} aria-label={t.label === "Set" ? "Settings" : t.label} type="button" onClick={t.onClick} style={{"flex": "1", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "var(--size-3)", "background": "transparent", "border": "0", "padding": "var(--size-4) 0", "cursor": "pointer", "color": t.color}}>
<svg aria-hidden="true" focusable="false" width={"21"} height={"21"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"}><path d={t.path}></path></svg>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>{t.label}</span>
</button>

</Fragment>)}
<button type="button" onClick={v.onPlus} style={{"flex": "1", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "var(--size-3)", "background": "transparent", "border": "0", "padding": "var(--size-4) 0", "cursor": "pointer", "color": "var(--color-accent-700)"}}>
<span style={{"width": "var(--size-40)", "height": "var(--size-34)", "display": "grid", "placeItems": "center", "background": "var(--color-accent)", "borderColor": "var(--color-accent)", "color": "var(--color-bg)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<svg aria-hidden="true" focusable="false" width={"18"} height={"18"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"}><path d={v.plusPath}></path></svg>
</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>{v.plusLabel}</span>
</button>
</div>

</>}
{v.isImport && <>

<div aria-label="import" style={{"flex": "1", "display": "flex", "flexDirection": "column", "minHeight": "0"}} data-screen={"import"}>
<div style={{"padding": "calc(var(--safe-top) + var(--size-10)) var(--size-20) 0", "display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
<button type="button" onClick={v.impCancel} style={{"background": "transparent", "border": "0", "padding": "var(--size-6) 0", "cursor": "pointer", "color": "var(--color-accent-700)", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".14em", "textTransform": "uppercase"}}>{"Cancel"}</button>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".18em", "textTransform": "uppercase"}}>{"Import · step " + (v.impStep) + "/3"}</div>
<div style={{"width": "var(--size-48)"}}></div>
</div>
<div style={{"flex": "1", "overflowY": "auto", "padding": "0 var(--size-20) var(--size-24)"}}>
{v.impPick && <>

<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-metric)", "letterSpacing": ".01em", "marginTop": "var(--size-14)"}}>{"ANALYTICS7"}</div>
<div style={{"fontSize": "var(--text-label)", "lineHeight": "1.5", "color": "var(--color-neutral-800)", "marginTop": "var(--size-2)"}}>{"Export the model file from analytics7, then pick it here. Cash sessions, venues, buy-ins, chip counts and tips come across; hand histories are ignored."}</div>
<label style={{"display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "var(--size-8)", "marginTop": "var(--size-20)", "padding": "var(--size-30) var(--size-20)", "cursor": "pointer", "textAlign": "center"}} className="blueprint interaction-13"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<svg aria-hidden="true" focusable="false" width={"30"} height={"30"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-accent)"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"}><path d={"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"}></path></svg>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".1em", "textTransform": "uppercase"}}>{"Choose .xml file"}</span>
<span style={{"fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)", "fontFamily": "var(--font-heading)", "letterSpacing": ".1em", "textTransform": "uppercase"}}>{"Files · iCloud · AirDrop"}</span>
<input aria-label="Choose .xml file" className="file-input" type={"file"} accept={".xml,text/xml,application/xml"} onChange={v.onPickFile} />
</label>
{v.impHasError && <>

<div role="alert" style={{"marginTop": "var(--size-12)", "borderLeft": "var(--size-2) solid var(--color-neutral-900)", "padding": "var(--size-8) var(--size-12)", "fontSize": "var(--text-label)", "background": "var(--color-neutral-200)"}}>{v.impError}</div>

</>}
<button type="button" onClick={v.onUseSample} style={{"marginTop": "var(--size-14)", "fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "padding": "var(--size-12)"}} className="btn btn-secondary btn-block">{"Use the sample export"}</button>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-26)"}}>{"What is read"}</div>
<div style={{"marginTop": "var(--size-6)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.impMapRows.map((m, index) => <Fragment key={m.id ?? index}>

<div style={{"display": "flex", "alignItems": "baseline", "gap": "var(--size-8)", "padding": "var(--size-7) var(--size-2)", "borderBottom": "var(--size-1) solid var(--color-divider)"}}>
<span style={{"flex": "1", "fontSize": "var(--text-label)", "fontFamily": "var(--font-body)", "color": "var(--color-neutral-800)"}}>{m.from}</span>
<svg aria-hidden="true" focusable="false" width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"var(--color-neutral-500)"} strokeWidth={"1.5"} style={{"flex": "none"}}><path d={"M5 12h14M13 6l6 6-6 6"}></path></svg>
<span style={{"flex": "1", "textAlign": "right", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-body)", "letterSpacing": ".04em", "color": m.color}}>{m.to}</span>
</div>

</Fragment>)}
</div>

</>}
{v.impMap && <>

<div style={{"marginTop": "var(--size-16)", "padding": "var(--size-14) var(--size-16)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"File read"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-display)", "lineHeight": "1", "fontVariantNumeric": "tabular-nums", "marginTop": "var(--size-4)"}}>{v.impCount}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{"cash sessions · " + (v.impSpan)}</div>
<div style={{"fontSize": "var(--text-label)", "fontFamily": "var(--font-body)", "color": "var(--color-neutral-700)", "marginTop": "var(--size-8)", "wordBreak": "break-all"}}>{v.impName}</div>
</div>
<div style={{"display": "grid", "gridTemplateColumns": "repeat(2, minmax(0, 1fr))", "gap": "var(--size-10)", "marginTop": "var(--size-10)"}}>
<div style={{"padding": "var(--size-10) var(--size-12)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div className="stat-label">{"Bankroll"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-number)"}}>{v.impBank}</div>
</div>
<div style={{"padding": "var(--size-10) var(--size-12)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div className="stat-label">{"Venues"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-number)"}}>{v.impVenues}</div>
</div>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-22)"}}>{"Amounts arrive in " + (v.impCode)}</div>
<div style={{"display": "flex", "flexDirection": "column", "gap": "var(--size-8)", "marginTop": "var(--size-8)"}}>
{v.impModes.map((m, index) => <Fragment key={m.id ?? index}>

<button type="button" onClick={m.onClick} style={{"width": "100%", "padding": "var(--size-11) var(--size-13)", "display": "flex", "alignItems": "center", "gap": "var(--size-11)", "textAlign": "left", "cursor": "pointer", "background": m.bg, "fontFamily": "var(--font-body)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<span style={{"width": "var(--size-13)", "height": "var(--size-13)", "flex": "none", "border": "var(--size-1) solid var(--color-accent)", "background": m.dot}}></span>
<span style={{"flex": "1"}}>
<span style={{"display": "block", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".04em"}}>{m.label}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)"}}>{m.sub}</span>
</span>
</button>

</Fragment>)}
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)", "marginTop": "var(--size-22)"}}>{"Duplicates"}</div>
<div style={{"marginTop": "var(--size-6)", "borderTop": "var(--size-1) solid var(--color-divider)", "display": "flex", "alignItems": "center", "gap": "var(--size-10)", "padding": "var(--size-11) var(--size-2)", "borderBottom": "var(--size-1) solid var(--color-divider)"}}>
<span style={{"flex": "1", "fontSize": "var(--text-label)"}}>{v.impDupeLine}</span>
<button type="button" onClick={v.impToggleSkip} style={{"background": v.skipBg, "color": v.skipFg, "border": "var(--size-1) solid var(--color-accent)", "padding": "var(--size-5) var(--size-10)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".12em", "textTransform": "uppercase"}}>{v.skipLabel}</button>
</div>
<button type="button" onClick={v.impToReview} style={{"width": "100%", "marginTop": "var(--size-18)", "padding": "var(--size-14)", "background": "var(--color-accent)", "color": "var(--color-bg)", "borderColor": "var(--color-accent)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".14em", "textTransform": "uppercase"}} className="blueprint interaction-14"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>{"Review " + (v.impCount) + " rows"}</button>

</>}
{v.impReview && <>

<div style={{"marginTop": "var(--size-16)", "padding": "var(--size-14) var(--size-16)"}} className="blueprint"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>
<div style={{"display": "flex", "alignItems": "baseline", "justifyContent": "space-between"}}>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".16em", "textTransform": "uppercase", "color": "var(--color-accent-700)"}}>{"Net of the import"}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)"}}>{(v.impHours) + " h"}</div>
</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-display)", "lineHeight": "1", "fontVariantNumeric": "tabular-nums", "color": v.impNetColor, "marginTop": "var(--size-2)"}}>{v.impNet}</div>
<div style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".1em", "textTransform": "uppercase", "color": "var(--color-neutral-700)", "marginTop": "var(--size-3)"}}>{v.impAddLine}</div>
</div>
<div style={{"marginTop": "var(--size-18)", "borderTop": "var(--size-1) solid var(--color-divider)"}}>
{v.impRows.map((r, index) => <Fragment key={r.id ?? index}>

<div style={{"display": "flex", "alignItems": "center", "gap": "var(--size-10)", "padding": "var(--size-9) var(--size-2)", "borderBottom": "var(--size-1) solid var(--color-divider)", "opacity": r.opacity}}>
<span style={{"width": "var(--size-38)", "height": "var(--size-34)", "flex": "none", "border": "var(--size-1) solid var(--color-divider)", "display": "grid", "placeItems": "center", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "color": "var(--color-accent-700)"}}>{r.stakes}</span>
<span style={{"flex": "1", "minWidth": "0"}}>
<span style={{"display": "block", "fontSize": "var(--text-label)", "fontWeight": "500", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>{r.venue}</span>
<span style={{"display": "block", "fontSize": "var(--text-caption)", "color": "var(--color-neutral-700)", "fontFamily": "var(--font-heading)", "letterSpacing": ".1em", "textTransform": "uppercase"}}>{r.meta}</span>
</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-caption)", "letterSpacing": ".12em", "textTransform": "uppercase", "color": r.tagColor, "flex": "none"}}>{r.tag}</span>
<span style={{"fontFamily": "var(--font-heading)", "fontSize": "var(--text-number)", "fontVariantNumeric": "tabular-nums", "color": r.color, "flex": "none", "minWidth": "var(--size-74)", "textAlign": "right"}}>{r.net}</span>
</div>

</Fragment>)}
</div>
<button disabled={v.impAdd === 0} type="button" onClick={v.impCommit} style={{"width": "100%", "marginTop": "var(--size-18)", "padding": "var(--size-14)", "background": "var(--color-accent)", "color": "var(--color-bg)", "borderColor": "var(--color-accent)", "cursor": "pointer", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-control)", "letterSpacing": ".14em", "textTransform": "uppercase"}} className="blueprint interaction-15"><i aria-hidden="true" className="corner tl"></i><i aria-hidden="true" className="corner tr"></i><i aria-hidden="true" className="corner bl"></i><i aria-hidden="true" className="corner br"></i>{v.impCommitLabel}</button>
<button type="button" onClick={v.impBack} style={{"marginTop": "var(--size-8)", "fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "padding": "var(--size-12)"}} className="btn btn-secondary btn-block">{"Back to mapping"}</button>

</>}
</div>
</div>

</>}
<Sheet v={v} />
{v.toastOpen && <>

<div role="status" aria-live="polite" style={{"position": "absolute", "left": "var(--size-20)", "right": "var(--size-20)", "bottom": "var(--size-104)", "zIndex": "90", "background": "var(--color-accent-900)", "color": "var(--color-bg)", "padding": "var(--size-11) var(--size-14)", "fontFamily": "var(--font-heading)", "fontSize": "var(--text-label)", "letterSpacing": ".12em", "textTransform": "uppercase", "animation": "lg-fade .15s ease-out"}}>{v.toast}</div>

</>}
</div>);
}
