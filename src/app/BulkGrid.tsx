import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, Copy, ImagePlus, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useStore } from './store'
import { conditions, deliveries, money, sku, type Product } from '../data/sample'

type Row = {
  id: number; title: string; price: string; stock: string; condition: string; delivery: string; photos: number
  description: string; sku: string; brand: string; tags: string; notes: string; cost: string
  touched: Record<string, boolean>
}
type Shared = { condition: string; delivery: string }
const FIELDS = ['title', 'price', 'stock', 'condition', 'delivery'] as const
type F = (typeof FIELDS)[number]
const NAMES: Record<F, string> = { title: 'title', price: 'price', stock: 'stock', condition: 'condition', delivery: 'delivery' }
let seq = 1
const blank = (): Row => ({ id: seq++, title: '', price: '', stock: '1', condition: '', delivery: '', photos: 0, description: '', sku: sku(), brand: '', tags: '', notes: '', cost: '', touched: {} })
const tones = ['#d9d3c3', '#c9d6cf', '#dccbc4', '#cfd3e0']

const isBlank = (r: Row) => !r.title && !r.price && !r.photos && !r.description
const eff = (r: Row, s: Shared, f: 'condition' | 'delivery') => r[f] || s[f]
function problems(r: Row, s: Shared): Partial<Record<F, string>> {
  const e: Partial<Record<F, string>> = {}
  if (r.title.trim().length < 3) e.title = r.title ? 'Use at least 3 characters' : 'Add a title'
  if (!(parseFloat(r.price) > 0)) e.price = 'Add a price above 0'
  if (!/^\d+$/.test(r.stock)) e.stock = 'Use a whole number'
  if (!eff(r, s, 'condition')) e.condition = 'Choose a condition'
  if (!eff(r, s, 'delivery')) e.delivery = 'Choose a delivery option'
  return e
}

export function BulkGrid({ onCount }: { onCount: (n: number) => void }) {
  const { dispatch } = useStore()
  const [rows, setRows] = useState<Row[]>(() => [blank(), blank(), blank()])
  const [shared, setShared] = useState<Shared>({ condition: '', delivery: '' })
  const [attempted, setAttempted] = useState(false)
  const [phase, setPhase] = useState<'edit' | 'review'>('edit')
  const [detail, setDetail] = useState<number | null>(null)
  const [banner, setBanner] = useState('')
  const grid = useRef<HTMLTableElement>(null)
  const focusRow = useRef<number | null>(null)

  const filled = rows.filter((r) => !isBlank(r))
  useEffect(() => onCount(filled.length), [filled.length, onCount])
  useEffect(() => {
    if (focusRow.current == null) return
    grid.current?.querySelector<HTMLElement>(`[data-row="${focusRow.current}"] input`)?.focus()
    focusRow.current = null
  })

  const set = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const touch = (r: Row, f: F) => set(r.id, { touched: { ...r.touched, [f]: true } })
  const addRow = () => { const r = blank(); focusRow.current = r.id; setRows((rs) => [...rs, r]) }
  const remove = (id: number) => { setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : [blank()])); if (detail === id) setDetail(null) }
  const duplicate = (r: Row) => { const c = { ...r, id: seq++, sku: sku(), touched: {} }; focusRow.current = c.id; setRows((rs) => rs.flatMap((x) => (x.id === r.id ? [x, c] : [x]))) }

  // Pasting several lines into a title cell fills one row per line.
  const pasteTitles = (e: React.ClipboardEvent, r: Row) => {
    const lines = e.clipboardData.getData('text').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return
    e.preventDefault()
    setRows((rs) => {
      const i = rs.findIndex((x) => x.id === r.id)
      const next = [...rs]
      lines.forEach((t, k) => {
        const at = next[i + k]
        if (at && (k === 0 || isBlank(at))) next[i + k] = { ...at, title: t }
        else next.splice(i + k, 0, { ...blank(), title: t })
      })
      return next
    })
  }

  const review = () => {
    setAttempted(true)
    if (!filled.length) { setBanner('Add at least one product before reviewing.'); return }
    const bad = filled.filter((r) => Object.keys(problems(r, shared)).length)
    if (bad.length) {
      setBanner(`${bad.length} ${bad.length === 1 ? 'product needs' : 'products need'} a fix. Everything you typed is still here.`)
      const first = bad[0]; const f = FIELDS.find((k) => problems(first, shared)[k])!
      grid.current?.querySelector<HTMLElement>(`[data-row="${first.id}"] [data-f="${f}"]`)?.focus()
      return
    }
    setBanner(''); setDetail(null); setPhase('review')
  }
  const commit = () => {
    const items: Product[] = filled.map((r, i) => ({ id: `new-${Date.now()}-${i}`, title: r.title.trim(), price: parseFloat(r.price), stock: parseInt(r.stock), condition: eff(r, shared, 'condition'), delivery: eff(r, shared, 'delivery'), sku: r.sku, status: 'Ready to list', tone: tones[i % 4], links: [], isNew: true }))
    dispatch({ type: 'addProducts', items, toast: `${items.length} ${items.length === 1 ? 'product' : 'products'} added to your inventory.` })
  }

  if (phase === 'review') {
    return (
      <section className="card pad bulk-review" data-spot="bulk-review">
        <h2>Review {filled.length} {filled.length === 1 ? 'product' : 'products'}</h2>
        <p className="hint">Check the details. Nothing is added until you confirm.</p>
        <table className="review-table">
          <thead><tr><th scope="col">Product</th><th scope="col" className="r">Price</th><th scope="col" className="r">Stock</th><th scope="col">Condition</th><th scope="col">Delivery</th><th scope="col">Photos</th></tr></thead>
          <tbody>
            {filled.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.title}{r.description && <span className="hint clamp">{r.description}</span>}</th>
                <td className="r num">{money(parseFloat(r.price))}</td><td className="r num">{r.stock}</td>
                <td>{eff(r, shared, 'condition')}{!r.condition && <span className="pill">Shared</span>}</td>
                <td>{eff(r, shared, 'delivery')}{!r.delivery && <span className="pill">Shared</span>}</td>
                <td>{r.photos ? `${r.photos} sample` : <span className="muted">None yet</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => setPhase('edit')}><ArrowLeft />Back to editing</button>
          <button type="button" className="btn btn-primary" onClick={commit}>Add {filled.length} {filled.length === 1 ? 'product' : 'products'}</button>
        </div>
      </section>
    )
  }

  const dRow = rows.find((r) => r.id === detail)
  return (
    <div className={`bulk${dRow ? ' has-detail' : ''}`}>
      <section className="card bulk-main">
        <fieldset className="shared" data-spot="bulk-shared">
          <legend>Shared values</legend>
          <p className="hint">Used by every row, unless you choose something else in that row.</p>
          <div className="field"><label htmlFor="sh-c">Condition</label>
            <select id="sh-c" className="select" value={shared.condition} onChange={(e) => setShared({ ...shared, condition: e.target.value })}><option value="">Not set</option>{conditions.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label htmlFor="sh-d">Delivery</label>
            <select id="sh-d" className="select" value={shared.delivery} onChange={(e) => setShared({ ...shared, delivery: e.target.value })}><option value="">Not set</option>{deliveries.map((c) => <option key={c}>{c}</option>)}</select></div>
        </fieldset>

        {banner && <p className="bulk-banner" role="alert"><AlertCircle aria-hidden="true" />{banner}</p>}

        <div className="table-scroll">
          <table className="bulk-table" ref={grid} data-spot="bulk-grid">
            <thead><tr>
              <th scope="col" className="c-n">#</th><th scope="col" className="c-ph">Photos</th><th scope="col">Title <span className="req">*</span></th>
              <th scope="col" className="c-pr">Price <span className="req">*</span></th><th scope="col" className="c-st">Stock <span className="req">*</span></th>
              <th scope="col" className="c-sel">Condition <span className="req">*</span></th><th scope="col" className="c-sel">Delivery <span className="req">*</span></th>
              <th scope="col" className="c-state">Row status</th><th scope="col" className="c-ops"><span className="sr-only">Row actions</span></th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const blankRow = isBlank(r)
                const errs = blankRow ? {} : problems(r, shared)
                const show = (f: F) => !!errs[f] && (attempted || r.touched[f])
                const missing = FIELDS.filter((f) => errs[f])
                const shownErrs = FIELDS.filter(show)
                const inv = (f: F) => ({ 'aria-invalid': show(f) || undefined, 'aria-describedby': show(f) ? `st-${r.id}` : undefined, 'data-f': f, onBlur: () => !blankRow && touch(r, f) })
                const n = i + 1
                return (
                  <tr key={r.id} data-row={r.id} className={detail === r.id ? 'is-detail' : undefined}>
                    <td className="c-n num">{n}</td>
                    <td className="c-ph">
                      <button type="button" className="ph-btn" aria-label={`Row ${n} photos: ${r.photos} added. Add a sample photo`} onClick={() => set(r.id, { photos: Math.min(20, r.photos + 1) })}>
                        <ImagePlus />{r.photos > 0 && <span className="num">{r.photos}</span>}
                      </button>
                    </td>
                    <td><input className="input" aria-label={`Row ${n} title`} placeholder="e.g. Nike Air Max 90" value={r.title} {...inv('title')}
                      onChange={(e) => set(r.id, { title: e.target.value })} onPaste={(e) => pasteTitles(e, r)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && i === rows.length - 1) addRow() }} /></td>
                    <td><span className="affix"><input className="input num" inputMode="decimal" aria-label={`Row ${n} price in euros`} placeholder="0.00" value={r.price} {...inv('price')} onChange={(e) => set(r.id, { price: e.target.value })} /><span>€</span></span></td>
                    <td><input className="input num" inputMode="numeric" aria-label={`Row ${n} stock`} value={r.stock} {...inv('stock')} onChange={(e) => set(r.id, { stock: e.target.value })} /></td>
                    {(['condition', 'delivery'] as const).map((f) => (
                      <td key={f}>
                        <select className={`select${r[f] ? ' is-own' : ''}`} aria-label={`Row ${n} ${f}`} value={r[f]} {...inv(f)} onChange={(e) => set(r.id, { [f]: e.target.value })}>
                          <option value="">{shared[f] ? `Shared: ${shared[f]}` : 'Choose'}</option>
                          {(f === 'condition' ? conditions : deliveries).map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                    ))}
                    <td className="c-state" id={`st-${r.id}`}>
                      {blankRow ? <span className="muted">Empty</span>
                        : !missing.length ? <span className="state-ok"><Check />Ready</span>
                        : shownErrs.length ? <span className="state-bad"><AlertCircle />{shownErrs.map((f) => errs[f]).join('. ')}</span>
                        : <span className="muted">{missing.length} to fill</span>}
                    </td>
                    <td className="c-ops">
                      <button type="button" className="icon-btn" aria-label={`More details for row ${n}`} aria-expanded={detail === r.id} title="More details" onClick={() => setDetail(detail === r.id ? null : r.id)}><SlidersHorizontal /></button>
                      <button type="button" className="icon-btn" aria-label={`Duplicate row ${n}`} title="Duplicate" onClick={() => duplicate(r)}><Copy /></button>
                      <button type="button" className="icon-btn" aria-label={`Remove row ${n}`} title="Remove" onClick={() => remove(r.id)}><Trash2 /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="bulk-foot">
          <button type="button" className="btn btn-sm" onClick={addRow}><Plus />Add row</button>
          <span className="hint">Press Enter in the last row to add another. Paste a list of titles to fill several rows.</span>
          <span className="bulk-foot-right">
            <span className="hint num" aria-live="polite">{filled.length} {filled.length === 1 ? 'product' : 'products'} started</span>
            <button type="button" className="btn btn-primary" onClick={review}>Review {filled.length > 0 ? `${filled.length} ${filled.length === 1 ? 'product' : 'products'}` : 'products'}</button>
          </span>
        </div>
      </section>

      {dRow && (
        <aside className="card pad detail" aria-label={`More details for row ${rows.indexOf(dRow) + 1}`} data-spot="bulk-detail">
          <header><div><h2>More details</h2><p className="hint">Row {rows.indexOf(dRow) + 1}{dRow.title && ` · ${dRow.title}`}</p></div><button type="button" className="icon-btn" aria-label="Close details" onClick={() => setDetail(null)}><X /></button></header>
          <div className="field"><label htmlFor="d-desc">Description <span className="opt">optional</span></label><textarea id="d-desc" className="textarea" value={dRow.description} onChange={(e) => set(dRow.id, { description: e.target.value })} /></div>
          <div className="two"><div className="field"><label htmlFor="d-brand">Brand <span className="opt">optional</span></label><input id="d-brand" className="input" value={dRow.brand} onChange={(e) => set(dRow.id, { brand: e.target.value })} /></div>
            <div className="field"><label htmlFor="d-sku">SKU</label><input id="d-sku" className="input" value={dRow.sku} onChange={(e) => set(dRow.id, { sku: e.target.value })} /><span className="hint">Made for you. Change it if you use your own.</span></div></div>
          <div className="field"><label htmlFor="d-tags">Tags <span className="opt">optional</span></label><input id="d-tags" className="input" placeholder="Separate with commas" value={dRow.tags} onChange={(e) => set(dRow.id, { tags: e.target.value })} /></div>
          <div className="field"><label htmlFor="d-notes">Internal notes <span className="opt">optional</span></label><textarea id="d-notes" className="textarea" value={dRow.notes} onChange={(e) => set(dRow.id, { notes: e.target.value })} /></div>
          <div className="field"><label htmlFor="d-cost">Purchase cost <span className="opt">optional</span></label><span className="affix"><input id="d-cost" className="input num" inputMode="decimal" value={dRow.cost} onChange={(e) => set(dRow.id, { cost: e.target.value })} /><span>€</span></span></div>
        </aside>
      )}
    </div>
  )
}
