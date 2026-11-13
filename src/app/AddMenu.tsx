import { Download, FileSpreadsheet, PencilLine } from 'lucide-react'
import { useStore } from './store'
import { Modal, Tile } from '../ui'

/** One entry point, two clear routes. Import leads because most sellers arrive with live listings. */
export function AddMenu() {
  const { state, dispatch } = useStore()
  const close = () => dispatch({ type: 'patch', patch: { addMenu: false } })
  return (
    <Modal wide title="Add products" sub="Bring in listings you already have, or type new products in." onClose={close}>
      <div className="add-routes" data-spot="add-routes">
        <section className="add-main">
          <span className="pill pill-green">Fastest if you already sell online</span>
          <h3><Download aria-hidden="true" />Import listings</h3>
          <p>Copy titles, photos, prices and stock from your connected accounts. Imported products stay linked to the account they came from.</p>
          <ul className="add-accts" aria-label="Connected accounts">
            {state.accounts.map((a) => <li key={a.id}><Tile marketplaceId={a.marketplaceId} />{a.name}</li>)}
          </ul>
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'go', route: { name: 'import' } })}>Import listings</button>
        </section>
        <div className="add-side">
          <section>
            <h3><PencilLine aria-hidden="true" />Add manually</h3>
            <p>Type in one product, or several at once in a simple grid.</p>
            <button type="button" className="btn" onClick={() => dispatch({ type: 'go', route: { name: 'add', mode: 'one' } })}>Add manually</button>
          </section>
          <section className="out" aria-disabled="true">
            <h3><FileSpreadsheet aria-hidden="true" />Upload a file</h3>
            <p>CSV or Excel. Outside this review.</p>
          </section>
        </div>
      </div>
    </Modal>
  )
}
