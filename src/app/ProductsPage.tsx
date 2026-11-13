import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Eye, ImageIcon, Link2, MoreVertical, Pencil, Plus, Search, Send, Trash2 } from 'lucide-react'
import { PageHead } from './AppShell'
import { useStore } from './store'
import { mk, money, type Account, type Product, type ProductLink } from '../data/sample'
import { SampleNote, Tile, useDismiss } from '../ui'

export const linkLabel: Record<ProductLink['state'], string> = { listed: 'Listed', linked: 'Linked, not listed', attention: 'Needs attention' }
const linkTone: Record<ProductLink['state'], string> = { listed: 'pill-green', linked: '', attention: 'pill-amber' }

export function ProductsPage() {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const rows = state.products.filter((p) => (p.title + p.sku).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHead crumbs={[{ label: 'Inventory' }, { label: 'Products' }]} />
      <section className="card table-card">
        <div className="toolbar">
          <div className="search">
            <Search aria-hidden="true" />
            <input className="input" type="search" placeholder="Search by title or SKU" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="btn out" aria-disabled="true" title="Outside this review">Filters</span>
          <span className="btn out" aria-disabled="true" title="Outside this review">Customize table</span>
          <SampleNote />
          <button type="button" className="btn btn-primary toolbar-add" data-spot="add-btn" aria-haspopup="dialog" onClick={() => dispatch({ type: 'patch', patch: { addMenu: true } })}>
            <Plus />Add products
          </button>
        </div>
        <div className="table-scroll" data-spot="table" tabIndex={-1}>
          <table className="ptable">
            <colgroup><col className="c-prod" /><col className="c-price" /><col className="c-stock" /><col className="c-cond" /><col className="c-acct" /><col className="c-status" /><col className="c-act" /></colgroup>
            <thead>
              <tr><th scope="col">Product</th><th scope="col" className="r">Price</th><th scope="col" className="r">Stock</th><th scope="col">Condition</th><th scope="col">Linked accounts</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {rows.map((p) => <Row key={p.id} p={p} accounts={state.accounts} />)}
              {rows.length === 0 && <tr><td colSpan={7} className="empty">No products match “{q}”. Check the spelling or clear the search.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="table-foot"><span className="num">{rows.length} of {state.products.length} products</span></footer>
      </section>
    </>
  )
}

function Row({ p, accounts }: { p: Product; accounts: Account[] }) {
  const { dispatch } = useStore()
  const openLinks = () => dispatch({ type: 'patch', patch: { linkFor: p.id } })
  return (
    <tr className={p.isNew ? 'is-new' : undefined}>
      <th scope="row"><div className="cell-prod">
        <span className="thumb" style={{ background: p.tone }} aria-hidden="true">{!p.title && <ImageIcon />}</span>
        <EditText value={p.title} label="product name" empty="Untitled draft" onSave={(v) => dispatch({ type: 'editProduct', id: p.id, patch: { title: v } })} spot={p.id === 'p1' ? 'edit-name' : undefined} />
      </div></th>
      <td className="r"><EditText num value={p.price == null ? '' : p.price.toFixed(2)} display={money(p.price)} label="price" empty="Not set" onSave={(v) => dispatch({ type: 'editProduct', id: p.id, patch: { price: v === '' || isNaN(+v) ? null : +v } })} /></td>
      <td className="r"><EditText num value={String(p.stock)} label="stock" empty="0" onSave={(v) => dispatch({ type: 'editProduct', id: p.id, patch: { stock: Math.max(0, parseInt(v) || 0) } })} /></td>
      <td>{p.condition || <span className="muted">Not set</span>}</td>
      <td><AccountsCell p={p} accounts={accounts} onManage={openLinks} /></td>
      <td><span className={`pill ${p.status === 'Listed' ? 'pill-green' : ''}`}>{p.status}</span></td>
      <td className="cell-act">
        <button type="button" className="icon-btn" aria-label={`Link accounts for ${p.title || 'untitled draft'}`} title="Link accounts" onClick={openLinks} data-spot={p.id === 'p3' ? 'row-link' : undefined}><Link2 /></button>
        <RowMenu onLinks={openLinks} name={p.title || 'untitled draft'} />
      </td>
    </tr>
  )
}

/** Text with the edit button right next to it. Enter or click edits, Enter saves, Escape cancels. */
function EditText({ value, display, label, empty, onSave, num, spot }: { value: string; display?: string; label: string; empty: string; onSave: (v: string) => void; num?: boolean; spot?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const btn = useRef<HTMLButtonElement>(null)
  const done = useRef(false)
  const finish = (save: boolean) => {
    if (done.current) return
    done.current = true
    if (save && draft !== value) onSave(draft.trim())
    setEditing(false)
    requestAnimationFrame(() => btn.current?.focus())
  }
  if (editing) {
    return (
      <span className={`edit is-editing${num ? ' num' : ''}`}>
        <input className="input edit-input" autoFocus aria-label={`Edit ${label}`} inputMode={num ? 'decimal' : undefined} value={draft}
          onChange={(e) => setDraft(e.target.value)} onFocus={(e) => e.target.select()}
          onKeyDown={(e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') { e.stopPropagation(); finish(false) } }}
          onBlur={() => finish(true)} />
      </span>
    )
  }
  const shown = display ?? value
  return (
    <span className={`edit${num ? ' num' : ''}`} data-spot={spot}>
      <span className={`edit-text${shown ? '' : ' muted'}`} title={shown || undefined}>{shown || empty}</span>
      <button ref={btn} type="button" className="edit-btn" aria-label={`Edit ${label}${shown ? `: ${shown}` : ''}`} onClick={() => { done.current = false; setDraft(value); setEditing(true) }}><Pencil /></button>
    </span>
  )
}

function AccountsCell({ p, accounts, onManage }: { p: Product; accounts: Account[]; onManage: () => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const trig = useRef<HTMLButtonElement>(null)
  useDismiss(box, open, () => setOpen(false), trig)
  const links = p.links.map((l) => ({ ...l, account: accounts.find((a) => a.id === l.accountId)! }))
  if (!links.length) {
    return <span className="acct-none"><span className="muted">Not linked</span><button type="button" className="link-btn" onClick={onManage}>Link accounts</button></span>
  }
  const attention = links.some((l) => l.state === 'attention')
  return (
    <div className="acct" ref={box} data-spot={p.id === 'p1' ? 'acct-cell' : undefined}>
      <div className="acct-cq"><button ref={trig} type="button" className="acct-trigger" aria-expanded={open} aria-haspopup="dialog"
        aria-label={`${links.length} linked ${links.length === 1 ? 'account' : 'accounts'}: ${links.map((l) => l.account.name).join(', ')}. Show details`} onClick={() => setOpen((o) => !o)}>
        {links.map((l, i) => (
          <span key={l.accountId} className={`acct-chip n${i}`}><Tile marketplaceId={l.account.marketplaceId} /><span className="acct-name">{l.account.name}</span><i className={`state s-${l.state}`} /></span>
        ))}
        {links.length > 1 && <span className="acct-more more-1 num">+{links.length - 1}</span>}
        {links.length > 2 && <span className="acct-more more-2 num">+{links.length - 2}</span>}
        {attention && <AlertTriangle className="acct-warn" aria-hidden="true" />}
      </button></div>
      {open && (
        <div className="pop acct-pop" role="dialog" aria-label={`Accounts linked to ${p.title || 'this product'}`}>
          <p className="pop-title">Linked accounts</p>
          <ul>
            {links.map((l) => (
              <li key={l.accountId} className="acct-line">
                <Tile marketplaceId={l.account.marketplaceId} />
                <span className="acct-line-main"><b>{l.account.name}</b><span className="hint">{mk(l.account.marketplaceId).name} · {l.account.handle}</span>{l.note && <span className="hint warn">{l.note}</span>}</span>
                <span className={`pill ${linkTone[l.state]}`}>{linkLabel[l.state]}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-sm pop-action" onClick={() => { setOpen(false); onManage() }}><Link2 />Manage links</button>
        </div>
      )}
    </div>
  )
}

function RowMenu({ onLinks, name }: { onLinks: () => void; name: string }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const trig = useRef<HTMLButtonElement>(null)
  useDismiss(box, open, () => setOpen(false), trig)
  useEffect(() => { if (open) box.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled])')?.focus() }, [open])
  const out = (Icon: typeof Eye, label: string) => <span className="menu-item" role="menuitem" aria-disabled="true"><Icon />{label}<span className="out-tag">Outside this review</span></span>
  return (
    <div className="rowmenu" ref={box}>
      <button ref={trig} type="button" className="icon-btn" aria-label={`More actions for ${name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}><MoreVertical /></button>
      {open && (
        <div className="pop rowmenu-pop" role="menu">
          <button type="button" className="menu-item" role="menuitem" onClick={() => { setOpen(false); onLinks() }}><Link2 />Link accounts</button>
          {out(Send, 'Publish')}{out(Eye, 'View details')}{out(Trash2, 'Delete')}
        </div>
      )}
    </div>
  )
}
