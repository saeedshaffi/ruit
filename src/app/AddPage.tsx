import { PageHead } from './AppShell'
import { useStore } from './store'
import { ProductForm } from './ProductForm'
import { BulkGrid } from './BulkGrid'
import { useState } from 'react'

/** Manual entry. One product uses the full form. Several products use the grid. */
export function AddPage({ mode }: { mode: 'one' | 'many' }) {
  const { dispatch } = useStore()
  const [count, setCount] = useState(1)
  const title = mode === 'one' || count === 1 ? 'Add product' : 'Add products'
  return (
    <>
      <PageHead back={{ name: 'products' }} crumbs={[{ label: 'Inventory' }, { label: 'Products', route: { name: 'products' } }, { label: title }]}>
        <div className="seg" role="group" aria-label="How many products" data-spot="mode-switch">
          <button type="button" aria-pressed={mode === 'one'} onClick={() => dispatch({ type: 'go', route: { name: 'add', mode: 'one' } })}>One product</button>
          <button type="button" aria-pressed={mode === 'many'} onClick={() => dispatch({ type: 'go', route: { name: 'add', mode: 'many' } })}>Several products</button>
        </div>
      </PageHead>
      {mode === 'one' ? <ProductForm /> : <BulkGrid onCount={setCount} />}
    </>
  )
}
