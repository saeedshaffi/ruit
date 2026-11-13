import { useCallback, type ReactNode } from 'react'
import { ArrowLeft, Bell, ChevronRight } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useStore, type Route } from './store'
import { Toast } from '../ui'
import { ProductsPage } from './ProductsPage'
import { AddPage } from './AddPage'
import { ImportPage } from './ImportPage'
import { AccountsPage } from './AccountsPage'
import { LinkDialog } from './LinkDialog'
import { AddMenu } from './AddMenu'

export type Crumb = { label: string; route?: Route }

export function TrialBar() {
  return (
    <div className="trial">
      <span className="num">1 / 14 days</span><span className="trial-track"><i /></span><span>You are on your free trial</span>
      <span className="trial-right">
        <span className="icon-btn out" title="Outside this review" aria-disabled="true"><Bell /></span>
        <span className="btn btn-primary btn-sm out" title="Outside this review" aria-disabled="true">See plans</span>
      </span>
    </div>
  )
}

export function PageHead({ crumbs, back, children }: { crumbs: Crumb[]; back?: Route; children?: ReactNode }) {
  const { dispatch } = useStore()
  return (
    <header className="page-head" data-spot="breadcrumb">
      {back && <button type="button" className="icon-btn back" aria-label="Back to Products" onClick={() => dispatch({ type: 'go', route: back })}><ArrowLeft /></button>}
      <nav aria-label="Breadcrumb">
        <ol className="crumbs">
          {crumbs.map((c, i) => (
            <li key={c.label}>
              {i > 0 && <ChevronRight aria-hidden="true" />}
              {c.route ? <button type="button" onClick={() => dispatch({ type: 'go', route: c.route! })}>{c.label}</button>
                : i === crumbs.length - 1 ? <h1 aria-current="page">{c.label}</h1> : <span>{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      {children}
    </header>
  )
}

export function AppShell() {
  const { state, dispatch } = useStore()
  const { route, linkFor, addMenu, toast } = state
  const clearToast = useCallback(() => dispatch({ type: 'patch', patch: { toast: null } }), [dispatch])
  return (
    <div className="app">
      <Sidebar />
      <div className="app-main">
        <TrialBar />
        <main className="app-page">
          {route.name === 'products' && <ProductsPage />}
          {route.name === 'add' && <AddPage mode={route.mode} />}
          {route.name === 'import' && <ImportPage />}
          {route.name === 'accounts' && <AccountsPage open={route.open} />}
        </main>
      </div>
      {addMenu && <AddMenu />}
      {linkFor && <LinkDialog productId={linkFor} />}
      {toast && <Toast text={toast} onDone={clearToast} />}
    </div>
  )
}
