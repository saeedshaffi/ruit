import { useMemo, useState } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { useStore } from './store'
import { marketplaces, type ProductLink } from '../data/sample'
import { Modal, SampleNote, Tile } from '../ui'
import { linkLabel } from './ProductsPage'

/** Link one product to any number of accounts, including several on the same marketplace. */
export function LinkDialog({ productId }: { productId: string }) {
  const { state, dispatch } = useStore()
  const p = state.products.find((x) => x.id === productId)!
  const existing = useMemo(() => new Map(p.links.map((l) => [l.accountId, l])), [p.links])
  const [sel, setSel] = useState(() => new Set(existing.keys()))
  const close = () => dispatch({ type: 'patch', patch: { linkFor: null } })
  const name = (id: string) => state.accounts.find((a) => a.id === id)!.name
  const adds = [...sel].filter((id) => !existing.has(id))
  const removes = [...existing.keys()].filter((id) => !sel.has(id))
  const changes = adds.length + removes.length
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const apply = () => {
    const links: ProductLink[] = [...sel].map((id) => existing.get(id) ?? { accountId: id, state: 'linked' })
    dispatch({ type: 'setLinks', id: p.id, links })
    const parts = [adds.length && `Linked to ${adds.map(name).join(' and ')}`, removes.length && `Unlinked from ${removes.map(name).join(' and ')}`].filter(Boolean)
    dispatch({ type: 'patch', patch: { linkFor: null, toast: `${parts.join('. ')}. Nothing was published.` } })
  }
  return (
    <Modal wide title="Link accounts" sub={<>Choose where <b>{p.title || 'this draft'}</b> can be sold. You can pick more than one account on the same marketplace.</>} onClose={close}
      footer={<>
        <div className="change-summary" aria-live="polite" data-spot="link-summary">
          {changes === 0 ? <span className="hint">No changes yet.</span> : (
            <ul>
              {adds.length > 0 && <li><span className="pill pill-green">Will link</span> {adds.map(name).join(', ')}</li>}
              {removes.length > 0 && <li><span className="pill pill-amber">Will unlink</span> {removes.map(name).join(', ')}</li>}
            </ul>
          )}
        </div>
        <button type="button" className="btn" onClick={close}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={changes === 0} onClick={apply}>{changes === 0 ? 'Apply changes' : `Apply ${changes} ${changes === 1 ? 'change' : 'changes'}`}</button>
      </>}>
      <div className="link-groups" data-spot="link-groups">
        {marketplaces.map((m) => {
          const accts = state.accounts.filter((a) => a.marketplaceId === m.id)
          if (!accts.length) return null
          return (
            <fieldset key={m.id} className="link-group">
              <legend><Tile marketplaceId={m.id} />{m.name}<span className="hint">{accts.length} {accts.length === 1 ? 'account' : 'accounts'}</span></legend>
              {accts.map((a) => {
                const link = existing.get(a.id)
                const on = sel.has(a.id)
                return (
                  <label key={a.id} className={`link-opt${on ? ' is-on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(a.id)} />
                    <span className="link-opt-main">
                      <b>{a.name}</b><span className="hint">{a.handle}</span>
                      {a.status === 'attention' && <span className="hint warn"><AlertTriangle />{a.note}</span>}
                      {link?.state === 'listed' && !on && <span className="hint warn"><AlertTriangle />This product is listed here. Unlinking does not end the listing.</span>}
                    </span>
                    {link && on && <span className={`pill ${link.state === 'listed' ? 'pill-green' : link.state === 'attention' ? 'pill-amber' : ''}`}>{linkLabel[link.state]}</span>}
                    {!link && on && <span className="pill pill-green">Will link</span>}
                    {link && !on && <span className="pill pill-amber">Will unlink</span>}
                  </label>
                )
              })}
            </fieldset>
          )
        })}
      </div>
      <p className="link-note"><Info aria-hidden="true" />Linking does not publish anything. It only decides which accounts this product belongs to. You publish as a separate step.</p>
      <SampleNote>Sample accounts</SampleNote>
    </Modal>
  )
}
