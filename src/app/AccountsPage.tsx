import { useState } from 'react'
import { AlertTriangle, ChevronDown, Link2 } from 'lucide-react'
import { PageHead } from './AppShell'
import { useStore } from './store'
import { marketplaces, money } from '../data/sample'
import { SampleNote, Tile } from '../ui'
import { linkLabel } from './ProductsPage'

export function AccountsPage({ open: initialOpen }: { open?: string }) {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState<string | null>(initialOpen ?? null)
  return (
    <>
      <PageHead crumbs={[{ label: 'Linked accounts' }]}>
        <span className="head-actions"><SampleNote>Sample accounts and counts</SampleNote><span className="btn btn-primary out" aria-disabled="true" title="Outside this review">Connect account</span></span>
      </PageHead>
      <div className="acct-page">
        {marketplaces.map((m) => {
          const accts = state.accounts.filter((a) => a.marketplaceId === m.id)
          if (!accts.length) return null
          return (
            <section key={m.id} className="card mk-card" aria-labelledby={`mk-${m.id}`}>
              <h2 id={`mk-${m.id}`} className="mk-head"><Tile marketplaceId={m.id} lg />{m.name}<span className="hint">{accts.length} {accts.length === 1 ? 'account' : 'accounts'}</span></h2>
              <ul>
                {accts.map((a) => {
                  const linked = state.products.filter((p) => p.links.some((l) => l.accountId === a.id))
                  const count = (s: string) => linked.filter((p) => p.links.find((l) => l.accountId === a.id)!.state === s).length
                  const isOpen = open === a.id
                  return (
                    <li key={a.id} className={`acct-row${isOpen ? ' is-open' : ''}`} data-spot={a.id === 'ebay-uk' ? 'acct-row' : undefined}>
                      <div className="acct-row-top">
                        <span className="avatar lg">{a.name.replace(m.name, '').trim()[0] ?? a.name[0]}</span>
                        <div className="acct-id">
                          <h3>{a.name}</h3>
                          <span className="hint">{a.handle}</span>
                          {a.status === 'connected'
                            ? <span className="pill pill-green"><i className="dot" />Connected</span>
                            : <span className="pill pill-amber"><AlertTriangle width={12} height={12} />Needs attention</span>}
                        </div>
                        <dl className="acct-stats">
                          <div><dt>Linked products</dt><dd className="num">{linked.length}</dd></div>
                          <div><dt>Listed</dt><dd className="num">{count('listed')}</dd></div>
                          <div className={count('attention') ? 'is-warn' : undefined}><dt>Need attention</dt><dd className="num">{count('attention')}</dd></div>
                        </dl>
                        <button type="button" className="btn btn-sm" aria-expanded={isOpen} aria-controls={`prods-${a.id}`} disabled={!linked.length} onClick={() => setOpen(isOpen ? null : a.id)}>
                          {linked.length ? (isOpen ? 'Hide products' : 'View products') : 'No products yet'}{linked.length > 0 && <ChevronDown className={isOpen ? 'flip' : undefined} />}
                        </button>
                      </div>
                      {a.note && <p className="acct-alert"><AlertTriangle aria-hidden="true" />{a.note}</p>}
                      {isOpen && (
                        <ul id={`prods-${a.id}`} className="acct-prods" aria-label={`Products linked to ${a.name}`}>
                          {linked.map((p) => {
                            const l = p.links.find((x) => x.accountId === a.id)!
                            return (
                              <li key={p.id}>
                                <span className="thumb sm" style={{ background: p.tone }} aria-hidden="true" />
                                <span className="acct-prod-name">{p.title || 'Untitled draft'}</span>
                                <span className="num muted">{money(p.price)}</span>
                                <span className={`pill ${l.state === 'listed' ? 'pill-green' : l.state === 'attention' ? 'pill-amber' : ''}`}>{linkLabel[l.state]}</span>
                                <button type="button" className="btn btn-sm btn-quiet" onClick={() => dispatch({ type: 'patch', patch: { linkFor: p.id } })}><Link2 />Manage links</button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}
