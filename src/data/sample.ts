// Everything in this file is SAMPLE DATA for the prototype.
// The reviewer's real account has one product and one eBay account, so the
// multi account scenarios are demonstrated with the invented records below.

export type Marketplace = { id: string; name: string; mono: string; color: string }
export type AccountStatus = 'connected' | 'attention'
export type Account = {
  id: string; marketplaceId: string; name: string; handle: string
  status: AccountStatus; note?: string
}
export type LinkState = 'linked' | 'listed' | 'attention'
export type ProductLink = { accountId: string; state: LinkState; note?: string }
export type Product = {
  id: string; title: string; price: number | null; stock: number
  condition: string; delivery?: string; sku: string; status: 'Draft' | 'Ready to list' | 'Listed'
  tone: string; links: ProductLink[]; isNew?: boolean
}

export const marketplaces: Marketplace[] = [
  { id: 'ebay', name: 'eBay', mono: 'eB', color: '#3157c9' },
  { id: 'vinted', name: 'Vinted', mono: 'Vi', color: '#0d7c85' },
  { id: 'wallapop', name: 'Wallapop', mono: 'Wa', color: '#0e9c8a' },
  { id: 'shopify', name: 'Shopify', mono: 'Sh', color: '#5b8a2d' },
]

export const initialAccounts: Account[] = [
  { id: 'ebay-uk', marketplaceId: 'ebay', name: 'eBay UK Store', handle: 'northlane_uk', status: 'connected' },
  { id: 'ebay-outlet', marketplaceId: 'ebay', name: 'eBay Outlet', handle: 'northlane_outlet', status: 'connected' },
  { id: 'vinted-1', marketplaceId: 'vinted', name: 'Vinted Wardrobe', handle: 'northlane', status: 'connected' },
  { id: 'wallapop-1', marketplaceId: 'wallapop', name: 'Wallapop Madrid', handle: 'northlane.mad', status: 'connected' },
  { id: 'shopify-1', marketplaceId: 'shopify', name: 'Northlane Shop', handle: 'northlane.myshopify.com', status: 'attention', note: 'Sign in again to keep this shop in sync.' },
]

export const initialProducts: Product[] = [
  { id: 'p1', title: 'Test', price: 14, stock: 100, condition: 'Brand New', sku: 'A41C09D2', status: 'Listed', tone: '#e9dcc0',
    links: [{ accountId: 'ebay-uk', state: 'listed' }, { accountId: 'ebay-outlet', state: 'linked' }] },
  { id: 'p2', title: "Vintage Levi's 501 denim jacket, stonewash, size M, made in USA, 1990s", price: 89, stock: 1, condition: 'Good', sku: '7BE1F0A3', status: 'Listed', tone: '#b9c8dc',
    links: [{ accountId: 'vinted-1', state: 'listed' }, { accountId: 'ebay-uk', state: 'listed' }, { accountId: 'wallapop-1', state: 'attention', note: 'Wallapop needs a weight to work out shipping.' }] },
  { id: 'p3', title: 'Nike Air Max 90', price: 120, stock: 3, condition: 'Like New', sku: 'C90D11E7', status: 'Ready to list', tone: '#e4c9c2', links: [] },
  { id: 'p4', title: '', price: null, stock: 1, condition: '', sku: 'FECFBB9E', status: 'Draft', tone: '#e3e5e0', links: [] },
  { id: 'p5', title: 'Polaroid SX-70 Land Camera', price: 240, stock: 1, condition: 'Good', sku: '19AA40C6', status: 'Listed', tone: '#d6cfb8',
    links: [{ accountId: 'ebay-outlet', state: 'listed' }, { accountId: 'shopify-1', state: 'attention', note: 'The shop is signed out, so this listing is not syncing.' }] },
  { id: 'p6', title: 'Le Creuset cast iron casserole, 24 cm', price: 135, stock: 2, condition: 'Brand New', sku: '55D0E2B8', status: 'Ready to list', tone: '#e8b9a0',
    links: [{ accountId: 'shopify-1', state: 'linked' }] },
]

export const importable: Record<string, { title: string; price: number; stock: number; condition: string }[]> = {
  'ebay-uk': [
    { title: 'Olympus OM-1 35mm film camera body', price: 165, stock: 1, condition: 'Good' },
    { title: 'Anglepoise Type 75 desk lamp, slate grey', price: 110, stock: 2, condition: 'Like New' },
    { title: 'Barbour Bedale wax jacket, size 40', price: 95, stock: 1, condition: 'Good' },
  ],
  'ebay-outlet': [
    { title: 'Carhartt WIP Detroit jacket, size L', price: 70, stock: 1, condition: 'Fair' },
    { title: 'Set of 6 Duralex Picardie tumblers', price: 18, stock: 9, condition: 'Brand New' },
  ],
  'vinted-1': [{ title: 'COS wool overshirt, size M', price: 42, stock: 1, condition: 'Like New' }],
  'wallapop-1': [{ title: 'Brompton front carrier block', price: 15, stock: 4, condition: 'Brand New' }],
}

export const conditions = ['Brand New', 'Like New', 'Good', 'Fair']
export const deliveries = ['Shipping', 'In person', 'Shipping or in person']

export const mk = (id: string) => marketplaces.find((m) => m.id === id)!
export const money = (n: number | null) => (n == null ? '' : `€${n.toFixed(2)}`)
export const sku = () => Math.random().toString(16).slice(2, 10).toUpperCase()
