import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { initialAccounts, initialProducts, type Account, type Product, type ProductLink } from '../data/sample'

export type Route =
  | { name: 'products' }
  | { name: 'add'; mode: 'one' | 'many' }
  | { name: 'import' }
  | { name: 'accounts'; open?: string }

export type State = {
  route: Route
  products: Product[]
  accounts: Account[]
  collapsed: boolean
  openGroups: string[]
  linkFor: string | null      // product id with the Link accounts dialog open
  addMenu: boolean
  toast: string | null
}

type Action =
  | { type: 'go'; route: Route }
  | { type: 'patch'; patch: Partial<State> }
  | { type: 'toggleGroup'; id: string }
  | { type: 'editProduct'; id: string; patch: Partial<Product> }
  | { type: 'setLinks'; id: string; links: ProductLink[] }
  | { type: 'addProducts'; items: Product[]; toast: string }
  | { type: 'reset'; preset?: Partial<State> }

const groupOf = (r: Route) => (r.name === 'accounts' ? null : 'inventory')

export const initial = (preset: Partial<State> = {}): State => ({
  route: { name: 'products' }, products: initialProducts, accounts: initialAccounts,
  collapsed: false, openGroups: ['inventory'], linkFor: null, addMenu: false, toast: null, ...preset,
})

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'go': {
      const g = groupOf(a.route)
      const openGroups = g && !s.openGroups.includes(g) ? [...s.openGroups, g] : s.openGroups
      return { ...s, route: a.route, openGroups, addMenu: false, linkFor: null }
    }
    case 'patch': return { ...s, ...a.patch }
    case 'toggleGroup':
      return { ...s, openGroups: s.openGroups.includes(a.id) ? s.openGroups.filter((g) => g !== a.id) : [...s.openGroups, a.id] }
    case 'editProduct':
      return { ...s, products: s.products.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) }
    case 'setLinks':
      return { ...s, products: s.products.map((p) => (p.id === a.id ? { ...p, links: a.links } : p)) }
    case 'addProducts':
      return { ...s, products: [...a.items, ...s.products.map((p) => ({ ...p, isNew: false }))], route: { name: 'products' }, toast: a.toast }
    case 'reset': return initial(a.preset)
  }
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null)

export function StoreProvider({ children, preset }: { children: ReactNode; preset?: Partial<State> }) {
  const [state, dispatch] = useReducer(reducer, preset, initial)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)!
