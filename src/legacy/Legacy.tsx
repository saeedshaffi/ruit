// Reconstruction of the current Ruit screens, rebuilt from what we saw on the live
// platform on 13 Nov 2026. Personal details (workspace name, email, account handle)
// are replaced with neutral placeholders. Only the behaviours under review are wired up.
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Bell, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, CircleMinus, ClipboardList, CloudUpload, Download, FolderOpen, HelpCircle, Home, ImageIcon, Info, LayoutGrid, MessageSquare, MoreVertical, Plus, Search, Settings, ShoppingCart, SlidersHorizontal, Sparkles, SquarePen, Store, Table2, X } from 'lucide-react'

export type LegacyView = {
  screen: 'products' | 'create' | 'accounts'
  collapsed?: boolean; flyout?: 'buy'; hoverRow?: boolean; modal?: boolean
  scrollTo?: string; tooltip?: boolean; aiToast?: boolean; rowMenu?: boolean
}

const GROUPS = { buy: ['Search', 'Saved Searches', 'Liked Items'], inventory: ['Products', 'Publications', 'Transactions', 'Orders', 'Records'], settings: ['Profile', 'Your plan'] }

function LegacySidebar({ view }: { view: LegacyView }) {
  const [collapsed, setCollapsed] = useState(!!view.collapsed)
  const [hover, setHover] = useState<string | null>(view.flyout ?? null)
  useEffect(() => { setCollapsed(!!view.collapsed); setHover(view.flyout ?? null) }, [view])
  const onInventory = view.screen !== 'accounts'
  const showSub = view.screen === 'products' && !collapsed
  const item = (id: string, label: string, Icon: typeof Home, active = false) => {
    const group = id in GROUPS
    return (
      <li key={id} className="lg-item" onMouseEnter={() => group && !(id === 'inventory' && showSub) && !collapsed && setHover(id)} onMouseLeave={() => !view.flyout && setHover(null)}>
        {/* Clicking any icon in the collapsed state expands the whole sidebar, as on the live site. */}
        <button type="button" className={`lg-row${active ? ' is-active' : ''}`} onClick={() => collapsed && setCollapsed(false)}>
          <Icon /><span className="lg-label">{label}</span>
          {id === 'inventory' && showSub && <ChevronDown className="lg-chev" />}
          {group && hover === id && !collapsed && <ChevronRight className="lg-chev" />}
          {collapsed && <span className="tip">{label}</span>}
        </button>
        {group && hover === id && !collapsed && (
          <ul className="pop lg-fly" data-spot="lg-fly">{GROUPS[id as keyof typeof GROUPS].map((c) => <li key={c}>{c}</li>)}</ul>
        )}
        {id === 'inventory' && showSub && <ul className="lg-sub">{GROUPS.inventory.map((c) => <li key={c} className={c === 'Products' ? 'is-active' : undefined}>{c}</li>)}</ul>}
      </li>
    )
  }
  return (
    <aside className={`lg-side${collapsed ? ' is-collapsed' : ''}`} data-spot="lg-side">
      <div className="lg-logo" data-spot="lg-logo">
        {collapsed ? <span className="logo lg-mark">r</span> : <span className="logo">ruit</span>}
        <span className="lg-bell"><Bell /></span>
      </div>
      <div className="lg-acct"><span className="avatar">W</span><span className="lg-label">your-workspace</span><ChevronsUpDown className="lg-label" /></div>
      <div className="lg-search"><Search /><span className="lg-label">Search</span><kbd className="lg-label">⌘K</kbd></div>
      <ul className="lg-nav" data-spot="lg-nav">
        {item('home', 'Home', Home)}
        {item('buy', 'Buy', ShoppingCart)}
        {item('inventory', 'Inventory', ClipboardList, onInventory)}
        {item('messages', 'Messages', MessageSquare)}
        {item('accounts', 'Linked accounts', Store, view.screen === 'accounts')}
        {item('settings', 'Settings', Settings)}
      </ul>
      <div className="lg-side-foot"><span className="lg-help"><HelpCircle /><span className="lg-label">Write to us</span></span><span className="lg-conf"><SlidersHorizontal /><span className="lg-label">Configure sidebar</span></span></div>
      <button type="button" className="side-toggle lg-toggle" data-spot="lg-toggle" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight /> : <ChevronLeft />}</button>
    </aside>
  )
}

const Trial = () => <div className="trial"><span>1 / 14 days</span><span className="trial-track"><i /></span><span>You are on your free trial</span><span className="trial-right"><span className="btn btn-primary btn-sm">See plans</span></span></div>

function LegacyProducts({ view }: { view: LegacyView }) {
  const Edit = () => <span className="lg-edit"><SquarePen /></span>
  return (
    <>
      <header className="page-head lg-head"><span className="icon-btn back"><ArrowLeft /></span><ClipboardList className="lg-crumb-icon" /><span className="lg-crumb">Inventory</span><ChevronRight /><b>Products</b></header>
      <section className="card table-card lg-card">
        <div className="toolbar">
          <span className="btn">Bulk actions <ChevronDown /></span>
          <span className="search"><Search /><span className="input lg-fake">Search by title, SKU, or description...</span></span>
          <span className="btn">Filters</span><span className="btn"><SlidersHorizontal />Customize table</span>
          <span className="lg-views"><Table2 /><LayoutGrid /></span>
          <span className="btn btn-primary" data-spot="lg-add"><Plus />Add products</span>
        </div>
        <div className="lg-table-wrap" data-spot="lg-table">
          <div className="lg-scroll">
            <table className="lg-table">
              <thead><tr><th className="w-check"><i className="lg-box" /></th><th className="w-title">Title</th><th className="w-130">Price</th><th className="w-130">Stock<br />Quantity</th><th className="w-150">Condition</th><th className="w-162" data-spot="lg-pubs">Publications</th><th className="w-150">Status</th><th className="w-190">Source</th></tr></thead>
              <tbody>
                <tr><td><i className="lg-box" /></td><td><span className="thumb"><ImageIcon /></span></td><td>€0.00</td><td>1</td><td /><td /><td><span className="pill">Draft</span></td><td>name@example.com</td></tr>
                <tr className={view.hoverRow ? 'is-hover' : undefined}>
                  <td><i className="lg-box" /></td>
                  <td data-spot="lg-title"><span className="thumb" style={{ background: '#e9dcc0' }} /><span>Test</span><Edit /></td>
                  <td>€14.00<Edit /></td><td>100<Edit /></td><td>Brand New <ChevronDown /></td><td /><td><span className="pill">Ready to list</span><Edit /></td><td>name@example.com</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="lg-pinned" data-spot="lg-actions">
            <div className="lg-pin-head">Actions</div>
            <div className="lg-pin-row"><span className="btn btn-sm"><SquarePen />Complete</span><MoreVertical /></div>
            <div className="lg-pin-row"><span className="btn btn-sm btn-soft">Publish</span><MoreVertical />
              {view.rowMenu && <ul className="pop lg-rowmenu" data-spot="lg-rowmenu">{['Publish', 'View details', 'Edit', 'View publications', 'View transactions', 'View orders', 'View records', 'View messages', 'Delete'].map((m) => <li key={m}>{m}</li>)}</ul>}
            </div>
          </div>
          <div className="lg-hbar"><i /></div>
        </div>
        <footer className="table-foot">Page <b>1</b> of 1 · Total products: 2</footer>
      </section>
      {view.modal && (
        <div className="scrim lg-scrim">
          <div className="modal wide lg-modal" data-spot="lg-modal">
            <header className="modal-head"><div><h2 data-spot="lg-modal-title">Add to Inventory</h2><p className="hint">Choose how you want to add products to your inventory.</p></div><span className="icon-btn"><X /></span></header>
            <div className="lg-choices" data-spot="lg-choices">
              <div><span className="lg-ico"><Plus /></span><h3>Create Product</h3><p>Create a product in your inventory and publish it to your connected accounts in one click.</p><span className="btn btn-primary" data-spot="lg-create-btn">Create Product</span></div>
              <div><span className="lg-ico"><Download /></span><h3>Import Listings</h3><p>Import listings from your connected accounts to your inventory to later manage and publish them anywhere.</p><span className="btn btn-primary">Import Listings</span></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const LONG_TIP = 'Only Wallapop reads it: in person or pick-up switch shipping off, and shipping picks the weight tier. Todocoleccion uses your shipping settings; Vinted, eBay, Etsy and the stores set it in their own form.'

function LegacyCreate({ view }: { view: LegacyView }) {
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // The page scrolls, as on the live site. Rects are divided by the stage scale.
    const page = scroller.current?.closest<HTMLElement>('.app-page')
    const el = view.scrollTo ? scroller.current?.querySelector<HTMLElement>(view.scrollTo) : null
    if (!page) return
    const scale = page.getBoundingClientRect().width / page.offsetWidth || 1
    page.scrollTop = el ? page.scrollTop + (el.getBoundingClientRect().top - page.getBoundingClientRect().top) / scale - 150 : 0
  }, [view])
  const Tip = () => <Info className="lg-tip" />
  return (
    <>
      <header className="page-head lg-head" data-spot="lg-crumbs"><span className="icon-btn back"><ArrowLeft /></span><span className="lg-crumb">Sell</span><ChevronRight /><b>Create Product</b></header>
      <div className="lg-ai" data-spot="lg-ai"><Sparkles /><div><b>Let the AI fill in the product</b><p>Add a photo below and press: title, description, condition and attributes. You set the price and the shipping.</p></div><span className="btn lg-ai-btn" data-spot="lg-ai-btn"><Sparkles />Fill with AI</span><span className="icon-btn"><Settings /></span></div>
      <div className="lg-form">
        <div className="lg-form-main" ref={scroller}>
          <section className="card pad" data-sec="photos"><h3><i className="lg-step">1</i>Photos</h3><p className="hint">Up to 20; the first is the cover, drag to reorder. Wallapop and Etsy publish the first 10.</p>
            <div className="lg-drop"><CloudUpload /><b>Drag and drop your images here</b><span className="hint">Upload up to 20 images. The first one will be your cover photo.</span><span className="btn btn-sm"><FolderOpen />Select files</span></div></section>
          <section className="card pad" data-sec="price"><h3><i className="lg-step">2</i>Price and shipping</h3><p className="hint">What the AI can't fill in for you.</p>
            <div className="two"><div className="field"><span className="label"><span className="req">*</span>Price<Tip /></span><span className="lg-input lg-suffix">0.00<i>€</i></span></div><div className="field"><span className="label">Discount<Tip /></span><span className="lg-input lg-suffix">0<i>%</i></span></div></div>
            <div className="two"><div className="field"><span className="label"><span className="req">*</span>Stock Quantity<Tip /></span><span className="lg-input filled">1</span></div><div /></div>
            <div className="field" data-spot="lg-deliver"><span className="label"><span className="req">*</span>How you deliver it<span data-spot="lg-help-icon"><Tip /></span></span><span className="lg-input lg-select">Select an option<ChevronDown /></span>
              {view.tooltip && <span className="lg-longtip" data-spot="lg-longtip">{LONG_TIP}</span>}</div></section>
          <section className="card pad" data-sec="info"><h3><i className="lg-step">3</i>Information</h3><p className="hint">What the buyer will see on every marketplace.</p>
            <div className="field"><span className="label"><span className="req">*</span>Title<Tip /></span><span className="lg-input">e.g. Nike Air Max 90</span></div>
            <div className="field"><span className="label"><span className="req">*</span>Description<Tip /></span><span className="lg-input tall" /></div>
            <div className="two"><div className="field"><span className="label"><span className="req">*</span>Condition<Tip /></span><span className="lg-input lg-select">Select an option<ChevronDown /></span></div><div className="field"><span className="label">SKU<Tip /></span><span className="lg-input filled">FECFBB9E</span></div></div></section>
          <section className="card pad" data-sec="more" data-spot="lg-more"><h3>More options</h3><p className="hint">Not in the listing: it serves your inventory.</p>
            <div className="field"><span className="label">Tags<Tip /></span><span className="lg-input">Type a word or phrase and press ↵</span></div>
            <div className="field"><span className="label">Notes<Tip /></span><span className="lg-input tall" /></div>
            <div className="two"><div className="field"><span className="label">Purchase cost<Tip /></span><span className="lg-input lg-suffix" data-spot="lg-cost">Optional<i>€</i></span></div><div /></div></section>
        </div>
        <aside className="card pad lg-summary" data-spot="lg-summary">
          <h3>Summary</h3>
          <ul>{['Photos', 'Price', 'Shipping', 'Stock Quantity', 'Title', 'Description', 'Condition'].map((s) => (
            <li key={s} className={s === 'Stock Quantity' ? 'is-done' : undefined} data-spot={s === 'Stock Quantity' ? 'lg-stock' : undefined}>{s === 'Stock Quantity' ? <span className="lg-tick"><Check /></span> : <CircleMinus />}{s}</li>))}</ul>
          <span className="lg-missing" data-spot="lg-missing"><AlertTriangle />6 required fields missing</span>
        </aside>
      </div>
      {view.aiToast && <div className="lg-toast" data-spot="lg-toast">Please add at least one image to generate product information<X /></div>}
    </>
  )
}

function LegacyAccounts() {
  return (
    <>
      <header className="page-head lg-head"><Store className="lg-crumb-icon" /><b>Linked accounts</b></header>
      <div className="lg-acct-bar"><span className="hint">1 of 3 active accounts on your Plus plan · <b className="lg-green">Upgrade</b></span><span className="btn"><Settings />Marketplace settings</span><span className="btn btn-primary">Connect account</span></div>
      <section className="card pad lg-acct-card" data-spot="lg-acct-card">
        <span className="mono-tile lg" style={{ background: '#3157c9' }}>eB</span><div className="lg-mk"><b>eBay</b><span className="hint">1 account</span></div><span className="icon-btn"><Settings /></span>
        <span className="avatar lg pink">S</span>
        <div className="lg-acct-main"><b>seller-account</b><span className="lg-green">● Connected</span><span className="lg-red"><AlertTriangle />This account cannot publish: Finish your eBay seller registration to sell. <b className="lg-green">Fix it</b></span></div>
        <span className="icon-btn"><MoreVertical /></span>
      </section>
    </>
  )
}

export function LegacyApp({ view }: { view: LegacyView }) {
  return (
    <div className="app legacy" inert={undefined}>
      <LegacySidebar view={view} />
      <div className="app-main">
        <Trial />
        <main className="app-page">
          {view.screen === 'products' && <LegacyProducts view={view} />}
          {view.screen === 'create' && <LegacyCreate view={view} />}
          {view.screen === 'accounts' && <LegacyAccounts />}
        </main>
      </div>
    </div>
  )
}
