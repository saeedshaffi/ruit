import { useState } from 'react'
import { PageHead } from './AppShell'
import { useStore } from './store'
import { importable, marketplaces, money, sku, type Product } from '../data/sample'
import { SampleNote, Tile } from '../ui'

const tones = ['#d9d3c3', '#c9d6cf', '#dccbc4', '#cfd3e0']

export function ImportPage() {
  const { state, dispatch } = useStore()
  const [accts, setAccts] = useState<string[]>(['ebay-uk'])
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const found = accts.flatMap((id) => (importable[id] ?? []).map((l, i) => ({ ...l, key: `${id}:${i}`, accountId: id })))
  const chosen = found.filter((f) => picked.has(f.key))
  const toggleAcct = (id: string) => setAccts((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))
  const togglePick = (k: string) => setPicked((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n })
  const allOn = found.length > 0 && chosen.length === found.length
  const run = () => {
    const items: Product[] = chosen.map((c, i) => ({ id: `imp-${Date.now()}-${i}`, title: c.title, price: c.price, stock: c.stock, condition: c.condition, sku: sku(), status: 'Listed', tone: tones[i % 4], isNew: true, links: [{ accountId: c.accountId, state: 'listed' }] }))
    dispatch({ type: 'addProducts', items, toast: `${items.length} ${items.length === 1 ? 'listing' : 'listings'} imported and linked to the account ${items.length === 1 ? 'it' : 'they'} came from.` })
  }
  return (
    <>
      <PageHead back={{ name: 'products' }} crumbs={[{ label: 'Inventory' }, { label: 'Products', route: { name: 'products' } }, { label: 'Import listings' }]} />
      <div className="import">
        <section className="card pad">
          <h2>1. Choose accounts</h2>
          <p className="hint">Pick one or more. Two accounts on the same marketplace are fine.</p>
          <div className="import-accts">
            {marketplaces.map((m) => state.accounts.filter((a) => a.marketplaceId === m.id).map((a) => {
              const n = importable[a.id]?.length ?? 0
              return (
                <label key={a.id} className={`link-opt${accts.includes(a.id) ? ' is-on' : ''}`}>
                  <input type="checkbox" checked={accts.includes(a.id)} disabled={!n} onChange={() => toggleAcct(a.id)} />
                  <Tile marketplaceId={m.id} />
                  <span className="link-opt-main"><b>{a.name}</b><span className="hint">{n ? `${n} listings not in your inventory yet` : 'Nothing new to import'}</span></span>
                </label>
              )
            }))}
          </div>
        </section>
        <section className="card pad">
          <div className="import-head"><div><h2>2. Choose listings</h2><p className="hint">Nothing changes on the marketplace. Ruit only copies the listing into your inventory.</p></div><SampleNote>Sample listings</SampleNote></div>
          {found.length === 0 ? <p className="empty">Choose an account to see its listings.</p> : (
            <ul className="import-list">
              <li className="import-all"><label><input type="checkbox" checked={allOn} onChange={() => setPicked(allOn ? new Set() : new Set(found.map((f) => f.key)))} /> Select all {found.length}</label></li>
              {found.map((f) => {
                const a = state.accounts.find((x) => x.id === f.accountId)!
                return (
                  <li key={f.key}><label>
                    <input type="checkbox" checked={picked.has(f.key)} onChange={() => togglePick(f.key)} />
                    <span className="import-title">{f.title}</span>
                    <span className="acct-chip"><Tile marketplaceId={a.marketplaceId} /><span className="acct-name">{a.name}</span></span>
                    <span className="num">{money(f.price)}</span>
                  </label></li>
                )
              })}
            </ul>
          )}
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => dispatch({ type: 'go', route: { name: 'products' } })}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!chosen.length} onClick={run}>{chosen.length ? `Import ${chosen.length} ${chosen.length === 1 ? 'listing' : 'listings'}` : 'Import listings'}</button>
          </div>
        </section>
      </div>
    </>
  )
}
