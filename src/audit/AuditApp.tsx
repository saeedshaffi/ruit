import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Compass, FlaskConical, List, MousePointerClick, RotateCcw, X } from 'lucide-react'
import { areas, EVIDENCE, issues, type Issue } from './issues'
import { ChangeRing, Spotlight } from './Spotlight'
import { LegacyApp } from '../legacy/Legacy'
import { AppShell } from '../app/AppShell'
import { StoreProvider } from '../app/store'
import { useDismiss } from '../ui'

type Loc = { mode: 'intro' } | { mode: 'explore' } | { mode: 'issue'; n: number; view: 'original' | 'improved' }
const parse = (): Loc => {
  // Plain hash names only (#issue-5-improved), so links survive hosts that drop #/paths.
  const h = location.hash.slice(1)
  if (h === 'explore') return { mode: 'explore' }
  const m = h.match(/^issue-(\d+)(-improved)?$/)
  if (m) return { mode: 'issue', n: Math.min(issues.length, Math.max(1, parseInt(m[1]))), view: m[2] ? 'improved' : 'original' }
  return { mode: 'intro' }
}
const href = (l: Loc) => (l.mode === 'issue' ? `#issue-${l.n}${l.view === 'improved' ? '-improved' : ''}` : `#${l.mode}`)
const FRAME_W = 1280

export function AuditApp() {
  const [loc, setLoc] = useState<Loc>(parse)
  useEffect(() => { const on = () => setLoc(parse()); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on) }, [])
  const go = useCallback((l: Loc) => { location.hash = href(l) }, [])

  // Left and Right step through issues, unless the user is typing or working inside the prototype.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (loc.mode !== 'issue' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest('.frame, input, textarea, select, [role="dialog"]')) return
      if (e.key === 'ArrowRight' && loc.n < issues.length) go({ mode: 'issue', n: loc.n + 1, view: 'original' })
      if (e.key === 'ArrowLeft' && loc.n > 1) go({ mode: 'issue', n: loc.n - 1, view: 'original' })
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [loc, go])

  if (loc.mode === 'intro') return <Intro go={go} />
  if (loc.mode === 'explore') return <Explore go={go} />
  return <Review loc={loc} go={go} />
}

function useStageScale(minWidth: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: minWidth, h: 700, scale: 1 })
  useEffect(() => {
    const el = ref.current!
    const ro = new ResizeObserver(() => { const w = el.clientWidth, h = el.clientHeight; const scale = Math.min(1, w / minWidth); setSize({ w: w / scale, h: h / scale, scale }) })
    ro.observe(el); return () => ro.disconnect()
  }, [minWidth])
  return { ref, size }
}

function Review({ loc, go }: { loc: Extract<Loc, { mode: 'issue' }>; go: (l: Loc) => void }) {
  const issue = issues[loc.n - 1]
  const improved = loc.view === 'improved'
  const { ref, size } = useStageScale(FRAME_W)
  const [index, setIndex] = useState(false)
  const set = (view: 'original' | 'improved') => go({ mode: 'issue', n: loc.n, view })
  const step = (d: number) => go({ mode: 'issue', n: loc.n + d, view: 'original' })
  const key = `${issue.id}:${loc.view}`
  // On the improved screen, bring the changed area into view if it starts below the fold.
  useEffect(() => {
    if (!improved || !issue.improvedSpot) return
    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>(issue.improvedSpot![0]); const page = el?.closest<HTMLElement>('.app-page')
      if (!el || !page) return
      const scale = page.getBoundingClientRect().width / page.offsetWidth || 1
      const top = (el.getBoundingClientRect().top - page.getBoundingClientRect().top) / scale
      if (top > page.clientHeight - 260) page.scrollTop += top - 120
    }, 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return (
    <div className="review chrome">
      <header className="bar">
        <a className="bar-brand" href="#intro">Ruit UX review</a>
        <IssueIndex open={index} setOpen={setIndex} current={loc.n} go={go} />
        <p className="bar-where" aria-live="polite"><span className="num">{loc.n} of {issues.length}</span><span className="bar-area">{issue.area}</span></p>
        <div className="seg dark" role="group" aria-label="Version shown">
          <button type="button" aria-pressed={!improved} onClick={() => set('original')}>Current</button>
          <button type="button" aria-pressed={improved} onClick={() => set('improved')}>Improved</button>
        </div>
        <div className="bar-nav">
          <button type="button" className="cbtn" disabled={loc.n === 1} onClick={() => step(-1)}><ArrowLeft />Previous</button>
          <button type="button" className="cbtn" disabled={loc.n === issues.length} onClick={() => step(1)}>Next<ArrowRight /></button>
        </div>
        <a className="cbtn ghost" href="#explore"><Compass />Explore freely</a>
      </header>
      <div className="review-body">
        <div className="stage" ref={ref}>
          <div className={`frame${improved ? '' : ' is-original'}`} style={{ width: size.w, height: size.h, transform: `scale(${size.scale})` }}>
            {improved
              ? <StoreProvider key={key} preset={issue.improved}><AppShell /></StoreProvider>
              : <LegacyApp key={key} view={issue.legacy} />}
          </div>
          {improved
            ? issue.improvedSpot && <ChangeRing stage={ref} selectors={issue.improvedSpot} id={key} />
            : <Spotlight stage={ref} selectors={issue.spot} note={issue.note} side={issue.side} id={key} />}
          <span className={`stage-tag${improved ? ' is-new' : ''}`}>{improved ? 'Proposed design · working prototype' : 'Current design · rebuilt from the live platform'}</span>
        </div>
        <IssuePanel issue={issue} improved={improved} set={set} n={loc.n} step={step} />
      </div>
    </div>
  )
}

function IssuePanel({ issue, improved, set, n, step }: { issue: Issue; improved: boolean; set: (v: 'original' | 'improved') => void; n: number; step: (d: number) => void }) {
  const ev = EVIDENCE[issue.evidence]
  return (
    <aside className="panel" aria-label="Issue details" key={issue.id + improved}>
      <p className="panel-area">{issue.area}</p>
      <h1>{issue.title}</h1>
      <div className="tags-row">
        <span className={`ev ev-${issue.evidence}`} title={ev.help}>{ev.label}</span>
        {issue.sample && <span className="ev ev-sample" title="The improved screen uses invented records, because the review account holds one product and one eBay account."><FlaskConical />Improved view uses sample data</span>}
      </div>
      {!improved ? (
        <>
          <h2>The problem</h2><p>{issue.problem}</p>
          {issue.seen && <p className="panel-seen">{issue.seen}</p>}
          <h2>Why it matters</h2><p>{issue.effect}</p>
          <button type="button" className="cta" onClick={() => set('improved')}>See improvement<ArrowRight /></button>
        </>
      ) : (
        <>
          <h2>What changed</h2>
          <ul className="changes">{issue.changes.map((c) => <li key={c}><Check aria-hidden="true" />{c}</li>)}</ul>
          {issue.tryIt && <p className="try"><MousePointerClick aria-hidden="true" /><span><b>Try it.</b> {issue.tryIt}</span></p>}
          {issue.assumption && <p className="panel-seen"><b>Our reasoning.</b> {issue.assumption}</p>}
          <div className="panel-actions">
            <button type="button" className="cbtn" onClick={() => set('original')}><ArrowLeft />Back to the problem</button>
            {n < issues.length && <button type="button" className="cta small" onClick={() => step(1)}>Next issue<ArrowRight /></button>}
          </div>
        </>
      )}
    </aside>
  )
}

function IssueIndex({ open, setOpen, current, go }: { open: boolean; setOpen: (o: boolean) => void; current: number; go: (l: Loc) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const trig = useRef<HTMLButtonElement>(null)
  useDismiss(box, open, () => setOpen(false), trig)
  return (
    <div className="index" ref={box}>
      <button ref={trig} type="button" className="cbtn" aria-expanded={open} aria-controls="issue-index" onClick={() => setOpen(!open)}><List />All issues</button>
      {open && (
        <nav id="issue-index" className="index-pop" aria-label="All issues">
          <header><b>All {issues.length} issues</b><button type="button" className="cbtn icon" aria-label="Close" onClick={() => setOpen(false)}><X /></button></header>
          {areas.map((a) => (
            <section key={a}>
              <h2>{a}</h2>
              <ol>{issues.map((it, i) => it.area === a && (
                <li key={it.id}><button type="button" aria-current={i + 1 === current ? 'true' : undefined} onClick={() => { setOpen(false); go({ mode: 'issue', n: i + 1, view: 'original' }) }}><span className="num">{i + 1}</span>{it.title}</button></li>
              ))}</ol>
            </section>
          ))}
        </nav>
      )}
    </div>
  )
}

function Explore({ go }: { go: (l: Loc) => void }) {
  const { ref, size } = useStageScale(1024)
  const [run, setRun] = useState(0)
  return (
    <div className="review chrome">
      <header className="bar">
        <a className="bar-brand" href="#intro">Ruit UX review</a>
        <p className="bar-where"><span>Exploring the improved flows</span><span className="bar-area">No audit notes. Sample data only. Nothing is saved.</span></p>
        <button type="button" className="cbtn" onClick={() => setRun(run + 1)}><RotateCcw />Reset sample data</button>
        <button type="button" className="cbtn solid" onClick={() => go({ mode: 'issue', n: 1, view: 'original' })}><ArrowLeft />Back to the review</button>
      </header>
      <div className="review-body">
        <div className="stage full" ref={ref}>
          <div className="frame" style={{ width: size.w, height: size.h, transform: `scale(${size.scale})` }}>
            <StoreProvider key={run}><AppShell /></StoreProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

function Intro({ go }: { go: (l: Loc) => void }) {
  return (
    <main className="intro chrome">
      <div className="intro-inner">
        <h1>Ruit UX review</h1>
        <p className="intro-lede">A walk through {issues.length} issues in the sidebar, the Products table, adding products, the product form and linked accounts. Each one comes with a working fix you can try.</p>
        <div className="intro-actions">
          <button type="button" className="cta" onClick={() => go({ mode: 'issue', n: 1, view: 'original' })}>Start the review<ArrowRight /></button>
          <button type="button" className="cbtn" onClick={() => go({ mode: 'explore' })}><Compass />Explore the improved flows</button>
        </div>
        <dl className="intro-grid">
          <div><dt>What it covers</dt><dd>{areas.join(', ')}. Publishing appears only where it explains account linking. Everything else is greyed and marked “Outside this review”.</dd></div>
          <div><dt>How to move around</dt><dd>Use Previous and Next in the top bar, or the left and right arrow keys. “All issues” lists every issue by area. The counter shows where you are.</dd></div>
          <div><dt>Current and improved</dt><dd>Each issue opens on the current design, with the problem kept sharp and the rest dimmed. Press “See improvement” to open the fix for that same issue. The switch in the top bar takes you back.</dd></div>
          <div><dt>What works</dt><dd>The improved screens are a working prototype. Buttons, forms, menus and keyboard controls respond. The current screens are rebuilt from the live platform to show each problem, with only the behaviour under review wired up.</dd></div>
          <div><dt>Sample data</dt><dd>The review account holds one product and one eBay account. Scenes that need more, such as two eBay accounts, use invented records and say so. AI suggestions are a fixed sample. Nothing here touches your live data.</dd></div>
          <div><dt>How sure we are</dt><dd><ul className="intro-ev">{Object.entries(EVIDENCE).map(([k, e]) => <li key={k}><span className={`ev ev-${k}`}>{e.label}</span>{e.help}</li>)}</ul></dd></div>
        </dl>
      </div>
    </main>
  )
}
