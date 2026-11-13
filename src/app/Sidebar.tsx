import { useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ClipboardList, Home, MessageSquare, Search, Settings, ShoppingCart, Store, type LucideIcon } from 'lucide-react'
import { useStore, type Route } from './store'
import { useDismiss } from '../ui'

type Leaf = { id: string; label: string; route?: Route }
type Item = Leaf & { icon: LucideIcon; children?: Leaf[] }

// Items without a route are outside this review: shown, greyed, not clickable.
export const NAV: Item[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'buy', label: 'Buy', icon: ShoppingCart, children: [{ id: 'search', label: 'Search' }, { id: 'saved', label: 'Saved searches' }, { id: 'liked', label: 'Liked items' }] },
  { id: 'inventory', label: 'Inventory', icon: ClipboardList, children: [
    { id: 'products', label: 'Products', route: { name: 'products' } },
    { id: 'publications', label: 'Publications' }, { id: 'transactions', label: 'Transactions' }, { id: 'orders', label: 'Orders' }, { id: 'records', label: 'Records' },
  ] },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'accounts', label: 'Linked accounts', icon: Store, route: { name: 'accounts' } },
  { id: 'settings', label: 'Settings', icon: Settings, children: [{ id: 'profile', label: 'Profile' }, { id: 'plan', label: 'Your plan' }] },
]
const OUT = 'Outside this review'

export function activeLeaf(r: Route) { return r.name === 'accounts' ? 'accounts' : 'products' }

export function Sidebar() {
  const { state, dispatch } = useStore()
  const { collapsed, openGroups, route } = state
  const active = activeLeaf(route)
  const [flyout, setFlyout] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const flyRef = useRef<HTMLLIElement>(null)
  useDismiss(flyRef, !!flyout, () => { const id = flyout; setFlyout(null); navRef.current?.querySelector<HTMLElement>(`[data-nav="${id}"]`)?.focus() })

  // Up and Down move between visible items. Tab still works as usual.
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = [...navRef.current!.querySelectorAll<HTMLElement>('button, a')].filter((el) => el.offsetParent)
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    e.preventDefault()
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus()
  }
  const go = (r: Route) => { setFlyout(null); dispatch({ type: 'go', route: r }) }

  return (
    <aside className={`side${collapsed ? ' is-collapsed' : ''}`} data-spot="sidebar">
      <div className="side-logo" data-spot="logo" aria-label="Ruit">
        <span className="logo" aria-hidden="true"><span>r</span><span className="logo-rest">uit</span></span>
      </div>
      <div className="side-acct out" title={OUT} aria-disabled="true">
        <span className="avatar">N</span><span className="side-text">northlane-studio</span><ChevronsUpDown className="side-text" />
      </div>
      <div className="side-search out" title={OUT} aria-disabled="true"><Search /><span className="side-text">Search</span></div>

      <nav ref={navRef} aria-label="Main" className="side-nav" onKeyDown={onKey} data-spot="nav">
        <ul>
          {NAV.map((item) => {
            const Icon = item.icon
            const holdsActive = !!item.children?.some((c) => c.id === active)
            const isActive = item.id === active
            if (!item.children) {
              const out = !item.route
              return (
                <li key={item.id}>
                  {out ? (
                    <span className="nav-row out" aria-disabled="true" title={OUT}><Icon /><span className="side-text">{item.label}</span><span className="tip">{item.label} · {OUT}</span></span>
                  ) : (
                    <button type="button" data-nav={item.id} className={`nav-row${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'page' : undefined} onClick={() => go(item.route!)}>
                      <Icon /><span className="side-text">{item.label}</span><span className="tip" aria-hidden="true">{item.label}</span>
                    </button>
                  )}
                </li>
              )
            }
            const open = openGroups.includes(item.id)
            const flyOpen = flyout === item.id
            return (
              <li key={item.id} className="nav-group" ref={flyOpen ? flyRef : undefined}>
                <button
                  type="button" data-nav={item.id}
                  className={`nav-row${holdsActive ? ' holds-active' : ''}`}
                  aria-expanded={collapsed ? flyOpen : open}
                  aria-haspopup={collapsed ? 'true' : undefined}
                  aria-controls={`sub-${item.id}`}
                  onClick={() => (collapsed ? setFlyout(flyOpen ? null : item.id) : dispatch({ type: 'toggleGroup', id: item.id }))}
                >
                  <Icon /><span className="side-text">{item.label}</span>
                  <ChevronDown className="chev side-text" />
                  <ChevronRight className="chev-rail" />
                  {!flyOpen && <span className="tip" aria-hidden="true">{item.label}</span>}
                </button>
                {!collapsed && (
                  <ul id={`sub-${item.id}`} className="nav-sub" hidden={!open}>
                    {item.children.map((c) => <LeafRow key={c.id} leaf={c} active={c.id === active} go={go} />)}
                  </ul>
                )}
                {collapsed && flyOpen && (
                  <div id={`sub-${item.id}`} className="pop nav-fly" role="group" aria-label={item.label}>
                    <p className="nav-fly-title">{item.label}</p>
                    <ul>{item.children.map((c) => <LeafRow key={c.id} leaf={c} active={c.id === active} go={go} fly />)}</ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <p className="side-legend side-text">Greyed items are outside this review.</p>
      <button type="button" className="side-toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}
        onClick={() => { setFlyout(null); dispatch({ type: 'patch', patch: { collapsed: !collapsed } }) }}>
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
    </aside>
  )
}

function LeafRow({ leaf, active, go, fly }: { leaf: Leaf; active: boolean; go: (r: Route) => void; fly?: boolean }) {
  if (!leaf.route) return <li><span className={`nav-leaf out${fly ? ' in-fly' : ''}`} aria-disabled="true" title={OUT}>{leaf.label}{fly && <span className="out-tag">{OUT}</span>}</span></li>
  return (
    <li>
      <button type="button" className={`nav-leaf${active ? ' is-active' : ''}${fly ? ' in-fly' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => go(leaf.route!)} autoFocus={fly && active}>
        {leaf.label}
      </button>
    </li>
  )
}
