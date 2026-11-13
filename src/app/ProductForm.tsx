import { useRef, useState, type ReactNode } from 'react'
import { AlertCircle, Check, ChevronDown, Circle, ImagePlus, Info, RotateCcw, Sparkles, Star, X } from 'lucide-react'
import { useStore } from './store'
import { conditions, deliveries, sku as newSku, type Product } from '../data/sample'
import { HelpTip } from '../ui'

type Photo = { id: number; url?: string; tone: string }
type Values = { title: string; description: string; condition: string; brand: string; price: string; stock: string; delivery: string; tags: string[]; notes: string; cost: string; short: string }
type Key = 'photos' | 'price' | 'delivery' | 'stock' | 'title' | 'description' | 'condition'
const ORDER: { key: Key; label: string }[] = [
  { key: 'photos', label: 'Photos' }, { key: 'price', label: 'Price' }, { key: 'delivery', label: 'Delivery' }, { key: 'stock', label: 'Stock quantity' },
  { key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }, { key: 'condition', label: 'Condition' },
]
// Clearly a canned response. No AI service is called by this prototype.
const SAMPLE_AI = { title: 'Nike Air Max 90, white and grey, EU 42', description: 'Nike Air Max 90 in white and wolf grey. Worn a handful of times, soles clean, no creasing on the toe box. Comes with the original box.', condition: 'Like New', brand: 'Nike' }
type AiKey = keyof typeof SAMPLE_AI
const AI_LABEL: Record<AiKey, string> = { title: 'Title', description: 'Description', condition: 'Condition', brand: 'Brand' }
const TONES = ['#e4c9c2', '#cfd8e3', '#dcd6c2', '#c8d9cc']
let pid = 1

export function ProductForm() {
  const { dispatch } = useStore()
  const [v, setV] = useState<Values>({ title: '', description: '', condition: '', brand: '', price: '', stock: '1', delivery: '', tags: [], notes: '', cost: '', short: '' })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({})
  const [stockEdited, setStockEdited] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [ai, setAi] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success')
  const [picks, setPicks] = useState<Record<AiKey, boolean>>({ title: true, description: true, condition: true, brand: true })
  const [suggested, setSuggested] = useState<Partial<Record<AiKey, boolean>>>({})
  const [tagDraft, setTagDraft] = useState('')
  const sku = useRef(newSku())
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLButtonElement>(null)
  const timer = useRef<number>(0)
  const [flash, setFlash] = useState(false)

  const set = <K extends keyof Values>(k: K, val: Values[K]) => { setV((x) => ({ ...x, [k]: val })); if (k in suggested) setSuggested((s) => ({ ...s, [k]: false })) }
  const errors: Partial<Record<Key, string>> = {}
  if (!photos.length) errors.photos = 'Add at least one photo'
  if (!(parseFloat(v.price) > 0)) errors.price = 'Add a price above 0'
  if (!v.delivery) errors.delivery = 'Choose how you deliver it'
  if (!/^\d+$/.test(v.stock)) errors.stock = 'Use a whole number, 0 or more'
  if (v.title.trim().length < 3) errors.title = v.title ? 'Use at least 3 characters' : 'Add a title'
  if (v.description.trim().length < 10) errors.description = v.description ? 'Use at least 10 characters' : 'Add a description'
  if (!v.condition) errors.condition = 'Choose a condition'
  const show = (k: Key) => (attempted || touched[k]) && errors[k]
  const left = ORDER.filter((o) => errors[o.key]).length
  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }))
  const err = (k: Key) => show(k) ? <span className="error" id={`e-${k}`}><AlertCircle aria-hidden="true" />{errors[k]}</span> : null
  const a11y = (k: Key) => ({ 'aria-invalid': show(k) ? true : undefined, 'aria-describedby': show(k) ? `e-${k}` : undefined, onBlur: blur(k) })

  const addSample = () => setPhotos((p) => [...p, { id: pid++, tone: TONES[p.length % 4] }].slice(0, 20))
  const addFiles = (files: FileList | null) => { if (files) setPhotos((p) => [...p, ...[...files].map((f, i) => ({ id: pid++, url: URL.createObjectURL(f), tone: TONES[(p.length + i) % 4] }))].slice(0, 20)) }
  const runAi = () => {
    if (!photos.length) { dropRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); dropRef.current?.focus({ preventScroll: true }); setFlash(true); setTimeout(() => setFlash(false), 1600); return }
    setAi('loading')
    timer.current = window.setTimeout(() => {
      if (outcome === 'failure') return setAi('error')
      // Fields the user already filled start unticked, so nothing is replaced without a choice.
      setPicks({ title: !v.title, description: !v.description, condition: !v.condition, brand: !v.brand }); setAi('ready')
    }, 1500)
  }
  const applyAi = () => {
    const keys = (Object.keys(picks) as AiKey[]).filter((k) => picks[k])
    setV((x) => ({ ...x, ...Object.fromEntries(keys.map((k) => [k, SAMPLE_AI[k]])) }))
    setSuggested(Object.fromEntries(keys.map((k) => [k, true]))); setAi('idle')
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setAttempted(true)
    const first = ORDER.find((o) => errors[o.key])
    if (first) { const el = document.getElementById(`f-${first.key}`); el?.scrollIntoView({ block: 'center', behavior: 'smooth' }); el?.focus({ preventScroll: true }); return }
    const item: Product = { id: `new-${Date.now()}`, title: v.title.trim(), price: parseFloat(v.price), stock: parseInt(v.stock), condition: v.condition, delivery: v.delivery, sku: sku.current, status: 'Ready to list', tone: photos[0].tone, links: [], isNew: true }
    dispatch({ type: 'addProducts', items: [item], toast: `“${item.title}” added to your inventory.` })
  }
  const tag = (k: AiKey): ReactNode => suggested[k] ? <span className="pill pill-violet">Suggested, check it</span> : null
  const addTag = () => { const t = tagDraft.trim().replace(/,$/, ''); if (t && !v.tags.includes(t)) set('tags', [...v.tags, t]); setTagDraft('') }

  return (
    <form className="pform" onSubmit={submit} noValidate>
      <div className="pform-main">
        <section className="card pad" aria-labelledby="h-photos">
          <div className="sec-head"><h2 id="h-photos">Photos <span className="req">*</span></h2><span className="hint num">{photos.length} of 20</span></div>
          <p className="hint">The first photo is the cover. Wallapop and Etsy publish the first 10.</p>
          {photos.length > 0 && (
            <ul className="photos" aria-label="Added photos">
              {photos.map((p, i) => (
                <li key={p.id} style={{ background: p.tone }}>
                  {p.url ? <img src={p.url} alt={`Photo ${i + 1}`} /> : <span className="photo-sample">Sample photo {i + 1}</span>}
                  {i === 0 ? <span className="pill photo-cover"><Star />Cover</span>
                    : <button type="button" className="photo-act cover" onClick={() => setPhotos((ps) => [p, ...ps.filter((x) => x.id !== p.id)])}>Make cover</button>}
                  <button type="button" className="photo-act remove" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}><X /></button>
                </li>
              ))}
            </ul>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          <button ref={dropRef} id="f-photos" type="button" className={`drop${flash ? ' is-flash' : ''}${show('photos') ? ' is-bad' : ''}`} aria-describedby={show('photos') ? 'e-photos' : undefined}
            onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}>
            <ImagePlus aria-hidden="true" /><b>{photos.length ? 'Add more photos' : 'Choose photos or drop them here'}</b><span className="hint">JPG or PNG. Up to 20.</span>
          </button>
          <div className="drop-foot">{err('photos')}<button type="button" className="link-btn" onClick={addSample}>Use a sample photo</button><span className="hint">For this prototype, so you do not need a file.</span></div>

          <div className={`ai ai-${ai}`} data-spot="ai" aria-live="polite">
            <Sparkles className="ai-icon" aria-hidden="true" />
            {ai === 'idle' && <>
              <div className="ai-text"><h3>Fill the details from your photos</h3>
                <p>{photos.length ? 'AI can suggest a title, description, condition and brand. You review everything before it is applied.' : 'Add at least one photo first. AI reads the photo to suggest a title, description, condition and brand.'}</p></div>
              <button type="button" className={photos.length ? 'btn btn-primary' : 'btn'} onClick={runAi}>{photos.length ? 'Suggest details' : 'Add a photo first'}</button>
            </>}
            {ai === 'loading' && <>
              <div className="ai-text"><h3>Reading {photos.length} {photos.length === 1 ? 'photo' : 'photos'}…</h3><p>This usually takes a few seconds. You can keep filling in the form.</p><span className="ai-bar"><i /></span></div>
              <button type="button" className="btn" onClick={() => { clearTimeout(timer.current); setAi('idle') }}>Cancel</button>
            </>}
            {ai === 'error' && <>
              <div className="ai-text"><h3>We could not read the photos</h3><p>Nothing in your form was changed. Try again, or fill in the fields yourself.</p></div>
              <button type="button" className="btn" onClick={runAi}><RotateCcw />Try again</button>
            </>}
            {ai === 'ready' && (
              <div className="ai-review">
                <h3>Review the suggestions</h3>
                <p className="ai-sample"><Info aria-hidden="true" />Sample response for this prototype. No AI service was called.</p>
                <ul>
                  {(Object.keys(SAMPLE_AI) as AiKey[]).map((k) => (
                    <li key={k}><label>
                      <input type="checkbox" checked={picks[k]} onChange={(e) => setPicks({ ...picks, [k]: e.target.checked })} />
                      <span><b>{AI_LABEL[k]}</b><span className="ai-value">{SAMPLE_AI[k]}</span>
                        {v[k] && <span className="ai-keep">You already wrote: “{v[k]}”. Tick the box to replace it.</span>}</span>
                    </label></li>
                  ))}
                </ul>
                <div className="form-actions"><button type="button" className="btn" onClick={() => setAi('idle')}>Discard</button><button type="button" className="btn btn-primary" disabled={!Object.values(picks).some(Boolean)} onClick={applyAi}>Apply selected</button></div>
              </div>
            )}
          </div>
          <p className="proto-control">Prototype control: AI result
            <span className="seg sm" role="group" aria-label="Simulated AI result">
              <button type="button" aria-pressed={outcome === 'success'} onClick={() => setOutcome('success')}>Success</button>
              <button type="button" aria-pressed={outcome === 'failure'} onClick={() => setOutcome('failure')}>Failure</button>
            </span>
          </p>
        </section>

        <section className="card pad" aria-labelledby="h-price">
          <h2 id="h-price">Price and delivery</h2>
          <div className="two">
            <div className="field"><div className="label-row"><label htmlFor="f-price">Price <span className="req">*</span></label><HelpTip label="Price">The price buyers see, before any discount.</HelpTip></div>
              <span className="affix"><input id="f-price" className="input num" inputMode="decimal" placeholder="0.00" value={v.price} onChange={(e) => set('price', e.target.value)} {...a11y('price')} /><span>€</span></span>{err('price')}</div>
            <div className="field"><label htmlFor="f-stock">Stock quantity <span className="req">*</span></label>
              <input id="f-stock" className="input num" inputMode="numeric" value={v.stock} onChange={(e) => { set('stock', e.target.value); setStockEdited(true) }} {...a11y('stock')} />
              {err('stock') ?? <span className="hint">Starts at 1. Change it if you have more.</span>}</div>
          </div>
          <div className="field" data-spot="help">
            <label htmlFor="f-delivery">How you deliver it <span className="req">*</span></label>
            <select id="f-delivery" className="select" value={v.delivery} onChange={(e) => set('delivery', e.target.value)} {...a11y('delivery')}><option value="">Choose an option</option>{deliveries.map((d) => <option key={d}>{d}</option>)}</select>
            {err('delivery')}
            <details className="explain">
              <summary><ChevronDown aria-hidden="true" />How each marketplace uses this</summary>
              <dl>
                <div><dt>Wallapop</dt><dd>Uses this setting. In person turns shipping off.</dd></div>
                <div><dt>Todocolección</dt><dd>Uses your shipping settings instead.</dd></div>
                <div><dt>Vinted, eBay, Etsy and your shops</dt><dd>Ask for delivery in their own form when you publish.</dd></div>
              </dl>
            </details>
          </div>
        </section>

        <section className="card pad" aria-labelledby="h-info">
          <h2 id="h-info">Information</h2>
          <div className="field"><label htmlFor="f-title">Title <span className="req">*</span>{tag('title')}</label>
            <input id="f-title" className="input" maxLength={50} placeholder="e.g. Nike Air Max 90" value={v.title} onChange={(e) => set('title', e.target.value)} {...a11y('title')} />
            <span className="field-foot">{err('title') ?? <span />}<span className="hint num">{v.title.length} of 50</span></span></div>
          <div className="field"><label htmlFor="f-description">Description <span className="req">*</span>{tag('description')}</label>
            <textarea id="f-description" className="textarea" maxLength={640} value={v.description} onChange={(e) => set('description', e.target.value)} {...a11y('description')} />
            <span className="field-foot">{err('description') ?? <span />}<span className="hint num">{v.description.length} of 640</span></span></div>
          <div className="two">
            <div className="field"><label htmlFor="f-condition">Condition <span className="req">*</span>{tag('condition')}</label>
              <select id="f-condition" className="select" value={v.condition} onChange={(e) => set('condition', e.target.value)} {...a11y('condition')}><option value="">Choose an option</option>{conditions.map((c) => <option key={c}>{c}</option>)}</select>{err('condition')}</div>
            <div className="field"><label htmlFor="f-brand">Brand <span className="opt">optional</span>{tag('brand')}</label><input id="f-brand" className="input" value={v.brand} onChange={(e) => set('brand', e.target.value)} /></div>
          </div>
        </section>

        <details className="card more" data-spot="more" open>
          <summary><span><b>More options</b><span className="hint">Tags, notes and purchase cost. Only you see these.</span></span><ChevronDown aria-hidden="true" /></summary>
          <div className="more-body">
            <div className="field">
              <div className="label-row"><label htmlFor="f-tags">Tags <span className="opt">optional</span></label><HelpTip label="Tags">Tags help you find products in Ruit. Buyers never see them.</HelpTip></div>
              <div className="tags">
                {v.tags.map((t) => <span key={t} className="tag"><span>{t}</span><button type="button" aria-label={`Remove tag ${t}`} onClick={() => set('tags', v.tags.filter((x) => x !== t))}><X /></button></span>)}
                <input id="f-tags" value={tagDraft} placeholder={v.tags.length ? '' : 'Type a tag and press Enter'} onChange={(e) => setTagDraft(e.target.value)} onBlur={addTag}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } if (e.key === 'Backspace' && !tagDraft) set('tags', v.tags.slice(0, -1)) }} />
              </div>
            </div>
            <div className="field"><label htmlFor="f-notes">Internal notes <span className="opt">optional</span></label><textarea id="f-notes" className="textarea" value={v.notes} onChange={(e) => set('notes', e.target.value)} /></div>
            <div className="two">
              <div className="field"><div className="label-row"><label htmlFor="f-cost">Purchase cost <span className="opt">optional</span></label><HelpTip label="Purchase cost">What you paid for the item. Ruit uses it to work out your profit.</HelpTip></div>
                <span className="affix"><input id="f-cost" className="input num" inputMode="decimal" value={v.cost} onChange={(e) => set('cost', e.target.value)} /><span>€</span></span></div>
              <div className="field"><label htmlFor="f-sku">SKU</label><input id="f-sku" className="input" defaultValue={sku.current} /><span className="hint">Made for you. Change it if you use your own.</span></div>
            </div>
            <button type="button" className="link-btn proto-fill" onClick={() => { set('tags', ['vintage', 'collector grade, boxed, with original receipt and spare parts', 'spring-summer-clearance-2026-warehouse-b']); setV((x) => ({ ...x, notes: 'Bought at the Sunday market from the stall near the east gate. Seller mentioned a second pair may come in next month, so keep the listing open and ask again.', cost: '1234567.89' })) }}>Prototype control: fill with long values</button>
          </div>
        </details>
      </div>

      <aside className="card pad summary" aria-labelledby="h-sum" data-spot="summary">
        <h2 id="h-sum">Summary</h2>
        <ul>
          {ORDER.map(({ key, label }) => {
            const bad = attempted && errors[key]
            const isDefault = key === 'stock' && !stockEdited && !errors.stock
            const done = !errors[key] && !isDefault
            return (
              <li key={key} className={bad ? 'is-bad' : done ? 'is-done' : isDefault ? 'is-default' : 'is-todo'} data-spot={key === 'stock' ? 'sum-stock' : undefined}>
                {bad ? <AlertCircle aria-hidden="true" /> : done ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
                <button type="button" onClick={() => { const el = document.getElementById(`f-${key}`); el?.scrollIntoView({ block: 'center', behavior: 'smooth' }); el?.focus({ preventScroll: true }) }}>{label}</button>
                <span className="sum-state">{bad ? 'Missing' : done ? 'Done' : isDefault ? 'Default: 1' : 'To do'}</span>
              </li>
            )
          })}
        </ul>
        <p className={`sum-count${attempted && left ? ' is-bad' : ''}`} role="status" data-spot="sum-count">
          {left === 0 ? 'Everything required is filled in.' : attempted ? `Fill in ${left} more ${left === 1 ? 'field' : 'fields'} to add this product.` : `${left} required ${left === 1 ? 'field' : 'fields'} left`}
        </p>
        <button type="submit" className="btn btn-primary">Add product</button>
        <button type="button" className="btn btn-quiet" onClick={() => dispatch({ type: 'go', route: { name: 'products' } })}>Cancel</button>
      </aside>
    </form>
  )
}
