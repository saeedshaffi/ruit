"""Functional checks for the prototype. Run `npm run build` first, then `npm run test:e2e`."""
import subprocess, time, sys
from playwright.sync_api import sync_playwright, expect

BASE = 'http://localhost:4173/'
results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))

def open_at(pg, route):
    pg.goto(BASE + '#' + route.replace('/', '-')); pg.reload(); pg.wait_for_timeout(350)

def run(pg):
    # ---- 9. Audit navigation, annotations, current versus improved ----
    open_at(pg, 'intro')
    pg.get_by_role('button', name='Start the review').click()
    check('audit: starts at 1 of 17', pg.locator('.bar-where').inner_text().startswith('1 of 17'))
    pg.get_by_role('button', name='Next', exact=True).click(); pg.wait_for_timeout(200)
    check('audit: Next moves to 2 of 17', '2 of 17' in pg.locator('.bar-where').inner_text())
    pg.get_by_role('button', name='See improvement').click(); pg.wait_for_timeout(200)
    check('audit: improvement keeps position', '2 of 17' in pg.locator('.bar-where').inner_text() and pg.url.endswith('#issue-2-improved'))
    check('audit: improved prototype is shown', pg.locator('.frame .side').count() == 1)
    pg.get_by_role('button', name='Back to the problem').click(); pg.wait_for_timeout(300)
    check('audit: can return to the problem', pg.url.endswith('#issue-2') and pg.locator('.spot-note').count() == 1)
    pg.get_by_role('button', name='All issues').click()
    check('audit: index lists every issue', pg.locator('#issue-index li').count() == 17)
    pg.locator('#issue-index li button').nth(11).click(); pg.wait_for_timeout(200)
    check('audit: index jumps to an issue', '12 of 17' in pg.locator('.bar-where').inner_text())
    pg.locator('body').click(position={'x': 700, 'y': 20}); pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(200)
    check('audit: arrow keys step through issues', '11 of 17' in pg.locator('.bar-where').inner_text())
    bad = []
    for n in range(1, 18):
        open_at(pg, f'issue/{n}'); pg.wait_for_timeout(450)
        rings = [pg.locator('.spot-ring').nth(i).bounding_box() for i in range(pg.locator('.spot-ring').count())]
        note, stage = pg.locator('.spot-note').bounding_box(), pg.locator('.stage').bounding_box()
        if not rings or not note: bad.append(f'{n}: no spotlight'); continue
        ring = rings[0]
        overlap = any(not (note['x'] + note['width'] <= r['x'] or r['x'] + r['width'] <= note['x'] or note['y'] + note['height'] <= r['y'] or r['y'] + r['height'] <= note['y']) for r in rings)
        inside = note['x'] >= stage['x'] and note['y'] >= stage['y'] and note['x'] + note['width'] <= stage['x'] + stage['width'] and note['y'] + note['height'] <= stage['y'] + stage['height']
        if overlap: bad.append(f'{n}: note covers target')
        if not inside: bad.append(f'{n}: note leaves the stage')
        if ring['width'] < 20 or ring['height'] < 12: bad.append(f'{n}: target too small')
        open_at(pg, f'issue/{n}/improved')
        if pg.locator('.frame .side').count() != 1: bad.append(f'{n}: improved view missing')
    check('audit: all 17 issues have a visible target, a clear note and an improved view', not bad, '; '.join(bad))

    # ---- 1. Sidebar ----
    open_at(pg, 'explore')
    r = pg.locator('.side .logo > span').first
    x0 = r.bounding_box()
    pg.get_by_role('button', name='Collapse sidebar').click()
    xs = []
    for _ in range(6): pg.wait_for_timeout(45); xs.append(r.bounding_box())
    check('sidebar: logo does not move while collapsing', all(abs(b['x'] - x0['x']) < 0.6 and abs(b['y'] - x0['y']) < 0.6 and abs(b['width'] - x0['width']) < 0.6 for b in xs), str([round(b['x'], 1) for b in xs]))
    pg.locator('[data-nav="buy"]').hover(); pg.wait_for_timeout(250)
    check('sidebar collapsed: hover shows the name only', pg.locator('.nav-fly').count() == 0 and pg.locator('[data-nav="buy"] .tip').is_visible())
    pg.locator('[data-nav="inventory"]').click()
    check('sidebar collapsed: click opens a menu and stays collapsed', pg.locator('.nav-fly').is_visible() and pg.locator('.side.is-collapsed').count() == 1)
    pg.keyboard.press('Escape')
    check('sidebar collapsed: Escape closes and returns focus', pg.locator('.nav-fly').count() == 0 and pg.evaluate('document.activeElement.dataset.nav') == 'inventory')
    pg.get_by_role('button', name='Expand sidebar').click(); pg.wait_for_timeout(300)
    buy = pg.locator('[data-nav="buy"]')
    check('sidebar: arrows are visible without hover', pg.locator('.side-nav .nav-row .chev').count() == 3 and all(pg.locator('.side-nav .nav-row .chev').nth(i).is_visible() for i in range(3)))
    buy.hover(); pg.wait_for_timeout(250)
    check('sidebar: hover does not open a group', buy.get_attribute('aria-expanded') == 'false')
    buy.click(); check('sidebar: click opens a group', buy.get_attribute('aria-expanded') == 'true' and pg.locator('#sub-buy').is_visible())
    buy.click(); check('sidebar: click closes it again', buy.get_attribute('aria-expanded') == 'false')
    buy.focus(); pg.keyboard.press('Enter')
    check('sidebar: Enter toggles a group', buy.get_attribute('aria-expanded') == 'true')
    pg.keyboard.press('ArrowDown')
    check('sidebar: arrow keys move between items', pg.evaluate('document.activeElement.dataset.nav') == 'inventory')
    check('sidebar: focus ring is visible', pg.evaluate("getComputedStyle(document.activeElement).outlineStyle") != 'none')
    check('sidebar: active page and parent are marked', pg.locator('.nav-leaf[aria-current="page"]').inner_text() == 'Products' and 'holds-active' in pg.locator('[data-nav="inventory"]').get_attribute('class'))

    # ---- 2. Products table ----
    for w in (1100, 1280, 1440, 1920):
        pg.set_viewport_size({'width': w, 'height': 900}); open_at(pg, 'explore')
        if w == 1100: pg.get_by_role('button', name='Collapse sidebar').click(); pg.wait_for_timeout(300)
        m = pg.evaluate("(() => { const t = document.querySelector('.table-scroll'); return [t.scrollWidth, t.clientWidth, document.documentElement.scrollWidth, innerWidth] })()")
        check(f'table: no sideways scroll at {w}px' + (' (sidebar collapsed)' if w == 1100 else ''), m[0] <= m[1] + 1 and m[2] <= m[3], str(m))
    pg.set_viewport_size({'width': 1440, 'height': 900}); open_at(pg, 'explore')
    row = pg.locator('.ptable tbody tr').first
    txt, btn = row.locator('.cell-prod .edit-text').bounding_box(), row.locator('.cell-prod .edit-btn').bounding_box()
    check('table: edit button sits next to a short name', 0 <= btn['x'] - (txt['x'] + txt['width']) <= 8, f"gap {btn['x'] - (txt['x'] + txt['width']):.1f}")
    h0 = row.bounding_box()['height']; row.hover(); pg.wait_for_timeout(120)
    b2 = row.locator('.cell-prod .edit-btn').bounding_box()
    check('table: layout is stable on hover', abs(row.bounding_box()['height'] - h0) < 0.5 and abs(b2['x'] - btn['x']) < 0.5)
    row.locator('.cell-prod .edit-btn').focus(); pg.keyboard.press('Enter'); pg.keyboard.type('Test renamed'); pg.keyboard.press('Enter')
    check('table: keyboard inline edit saves', row.locator('.cell-prod .edit-text').inner_text() == 'Test renamed')
    row.locator('.cell-prod .edit-btn').click(); pg.keyboard.type('zzz'); pg.keyboard.press('Escape')
    check('table: Escape cancels an edit', row.locator('.cell-prod .edit-text').inner_text() == 'Test renamed')
    long_row = pg.locator('.ptable tbody tr').nth(1)
    check('table: long names stay inside their cell', long_row.evaluate("r => { const c = r.querySelector('.cell-prod'); return c.scrollWidth <= c.clientWidth + 1 }"))
    check('table: empty values are labelled', 'Untitled draft' in pg.locator('.ptable').inner_text() and 'Not set' in pg.locator('.ptable').inner_text())
    names = row.locator('.acct-name').all_inner_texts()
    check('table: two accounts on one marketplace are named', names[:2] == ['eBay UK Store', 'eBay Outlet'], str(names))
    row.locator('.acct-trigger').click()
    check('table: account details popover lists state per account', 'Linked, not listed' in pg.locator('.acct-pop').inner_text() and 'Listed' in pg.locator('.acct-pop').inner_text())
    pg.keyboard.press('Escape')

    # ---- 7. Linking one product to two accounts on the same marketplace ----
    nike = pg.locator('.ptable tbody tr', has_text='Nike Air Max 90')
    nike.get_by_role('button', name='Link accounts for Nike Air Max 90').click()
    dlg = pg.get_by_role('dialog', name='Link accounts')
    check('link: Apply is disabled until something changes', dlg.get_by_role('button', name='Apply changes').is_disabled())
    dlg.get_by_label('eBay UK Store').check(); dlg.get_by_label('eBay Outlet').check()
    summ = dlg.locator('.change-summary').inner_text()
    check('link: summary states what will change', 'Will link' in summ and 'eBay UK Store' in summ and 'eBay Outlet' in summ, summ)
    dlg.get_by_role('button', name='Apply 2 changes').click()
    check('link: product shows both eBay accounts', nike.locator('.acct-name').all_inner_texts() == ['eBay UK Store', 'eBay Outlet'])
    check('link: confirmation says nothing was published', 'Nothing was published' in pg.locator('.toast').inner_text())
    check('link: product status is unchanged', 'Ready to list' in nike.inner_text())
    nike.get_by_role('button', name='More actions for Nike Air Max 90').click()
    pg.get_by_role('menuitem', name='Link accounts').click()
    dlg.get_by_label('eBay Outlet').uncheck()
    check('link: existing links are shown and unlinking is previewed', 'Will unlink' in dlg.locator('.change-summary').inner_text() and dlg.get_by_label('eBay UK Store').is_checked())
    pg.keyboard.press('Escape'); check('link: Escape closes the dialog without changes', pg.get_by_role('dialog').count() == 0 and nike.locator('.acct-name').count() == 2)

    # ---- 8. Accounts ----
    pg.locator('[data-nav="accounts"]').click()
    uk = pg.locator('.acct-row', has_text='eBay UK Store')
    check('accounts: linked product count is correct', uk.locator('.acct-stats dd').first.inner_text() == '3', uk.locator('.acct-stats').inner_text())
    uk.get_by_role('button', name='View products').click()
    check('accounts: products of one account can be inspected', uk.locator('.acct-prods li').count() == 3 and 'Nike Air Max 90' in uk.locator('.acct-prods').inner_text())
    check('accounts: two eBay accounts are listed under eBay', pg.locator('.mk-card').first.locator('.acct-row').count() == 2)
    check('accounts: sidebar marks Linked accounts', pg.locator('[data-nav="accounts"]').get_attribute('aria-current') == 'page')

    # ---- 3, 4, 5, 6. Single product form ----
    open_at(pg, 'explore')
    pg.get_by_role('button', name='Add products').click()
    add = pg.get_by_role('dialog', name='Add products')
    check('add: import is the only primary action', add.locator('.btn-primary').count() == 1 and add.locator('.btn-primary').inner_text() == 'Import listings')
    add.get_by_role('button', name='Add manually').click()
    check('breadcrumb: Inventory, Products, Add product', pg.locator('.crumbs').inner_text().split() == ['Inventory', 'Products', 'Add', 'product'], pg.locator('.crumbs').inner_text())
    check('breadcrumb: sidebar keeps Products selected', pg.locator('.nav-leaf[aria-current="page"]').inner_text() == 'Products')
    check('form: fresh form shows no errors', pg.locator('[aria-invalid="true"], .error, .is-bad').count() == 0)
    check('form: neutral count of required fields', pg.locator('.sum-count').inner_text() == '6 required fields left')
    check('form: stock is shown as a default, not as done', 'Default: 1' in pg.locator('.summary li', has_text='Stock quantity').inner_text() and pg.locator('.summary li.is-done').count() == 0)
    check('form: AI states the photo requirement up front', 'Add at least one photo first' in pg.locator('.ai').inner_text())
    pg.get_by_role('button', name='Add a photo first').click(); pg.wait_for_timeout(300)
    check('form: AI without a photo leads to the uploader and marks nothing invalid', pg.evaluate("document.activeElement.id") == 'f-photos' and pg.locator('[aria-invalid="true"], .error, .is-bad').count() == 0)
    pg.get_by_label('Title').fill('My own title')
    pg.get_by_role('button', name='Use a sample photo').click()
    check('form: photo preview with cover and remove', pg.locator('.photos li').count() == 1 and pg.locator('.photo-cover').is_visible() and pg.get_by_role('button', name='Remove photo 1').is_visible())
    pg.get_by_role('button', name='Failure').click(); pg.get_by_role('button', name='Suggest details').click()
    check('form: AI loading state', 'Reading 1 photo' in pg.locator('.ai').inner_text())
    pg.wait_for_timeout(1800)
    check('form: AI failure state keeps the form', 'could not read' in pg.locator('.ai').inner_text() and pg.get_by_label('Title').input_value() == 'My own title')
    pg.get_by_role('button', name='Success').click(); pg.get_by_role('button', name='Try again').click(); pg.wait_for_timeout(1800)
    rev = pg.locator('.ai-review')
    check('form: AI suggestions are labelled as a sample', 'No AI service was called' in rev.inner_text())
    check('form: AI does not replace a value the user typed', not rev.get_by_label('Title').is_checked() and rev.get_by_label('Description').is_checked() and 'You already wrote' in rev.inner_text())
    rev.page.get_by_role('button', name='Apply selected').click()
    check('form: applied suggestions are editable and the typed title is kept', pg.get_by_label('Title').input_value() == 'My own title' and pg.get_by_label('Description').input_value().startswith('Nike Air Max 90') and pg.locator('.pill-violet').count() >= 2)
    pg.get_by_role('button', name='Add product', exact=True).click(); pg.wait_for_timeout(300)
    check('form: submit shows errors next to fields and keeps input', pg.locator('#e-price').is_visible() and pg.locator('#e-delivery').is_visible() and pg.get_by_label('Title').input_value() == 'My own title' and 'Fill in 2 more fields' in pg.locator('.sum-count').inner_text(), pg.locator('.sum-count').inner_text())
    hb = pg.get_by_role('button', name='Help: Price')
    box = hb.bounding_box(); hb.click(); pop = pg.locator('.help-pop')
    check('help: target is at least 24px and tip wraps at a readable width', box['width'] >= 24 and box['height'] >= 24 and pop.bounding_box()['width'] <= 281, str(box))
    pg.keyboard.press('Escape'); check('help: Escape closes and returns focus', pg.locator('.help-pop').count() == 0 and pg.evaluate("document.activeElement.getAttribute('aria-label')") == 'Help: Price')
    pg.locator('.explain summary').click()
    check('help: long delivery help is an inline list', pg.locator('.explain dl').is_visible() and pg.locator('.explain dl').bounding_box()['width'] <= 560)
    pg.set_viewport_size({'width': 1100, 'height': 900}); pg.wait_for_timeout(200)
    pg.get_by_role('button', name='Prototype control: fill with long values').click()
    spill = pg.evaluate("""(() => { const m = document.querySelector('.more-body').getBoundingClientRect(); const out = [];
      document.querySelectorAll('.more-body .tag, .more-body .input, .more-body .textarea, .more-body .affix > span, .more-body .tags').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > m.right + 0.5 || r.left < m.left - 0.5) out.push(e.className) });
      const a = document.querySelector('#f-cost').getBoundingClientRect(), s = document.querySelector('#f-cost + span').getBoundingClientRect(); if (s.right > a.right - 4) out.push('suffix on border');
      return out })()""")
    check('more options: long values stay inside their fields at 1100px', not spill, str(spill))
    pg.set_viewport_size({'width': 1440, 'height': 900})
    pg.locator('#f-price').fill('120'); pg.get_by_label('How you deliver it').select_option('Shipping')
    check('form: errors clear as fields are fixed', pg.locator('#e-price').count() == 0 and 'Everything required' in pg.locator('.sum-count').inner_text())
    pg.get_by_role('button', name='Add product', exact=True).click()
    check('form: one product is added with a matching message', 'My own title' in pg.locator('.toast').inner_text() and pg.locator('.ptable tbody tr').count() == 7 and 'My own title' in pg.locator('.ptable tbody tr').first.inner_text())

    # ---- 3. Several products ----
    pg.get_by_role('button', name='Add products').click(); pg.get_by_role('button', name='Add manually').click()
    pg.get_by_role('button', name='Several products').click()
    pg.wait_for_timeout(150); check('bulk: title is plural for several products', pg.locator('.crumbs h1').inner_text() == 'Add products', pg.locator('.crumbs h1').inner_text())
    check('bulk: fresh grid shows no errors', pg.locator('[aria-invalid="true"], .state-bad, .bulk-banner').count() == 0)
    pg.get_by_label('Row 1 title').fill('Olympus OM-1'); pg.get_by_label('Row 1 price in euros').fill('165')
    pg.get_by_label('Row 2 title').fill('Anglepoise lamp')
    check('bulk: title follows the count', pg.locator('.crumbs h1').inner_text() == 'Add products' and 'Review 2 products' in pg.locator('.bulk-foot').inner_text())
    pg.get_by_role('button', name='Review 2 products').click()
    check('bulk: review is blocked with per row errors and input is kept', pg.locator('.bulk-banner').is_visible() and pg.locator('.bulk-table [aria-invalid="true"]').count() >= 3 and pg.get_by_label('Row 2 title').input_value() == 'Anglepoise lamp' and 'Add a price' in pg.locator('.bulk-table tbody tr').nth(1).inner_text())
    pg.locator('#sh-c').select_option('Good'); pg.locator('#sh-d').select_option('Shipping'); pg.get_by_label('Row 2 price in euros').fill('110')
    pg.get_by_label('Row 2 condition').select_option('Like New')
    check('bulk: shared value shows in rows and a row can override it', 'Shared: Good' in pg.get_by_label('Row 1 condition').inner_text() and pg.get_by_label('Row 2 condition').input_value() == 'Like New')
    pg.get_by_role('button', name='More details for row 1').click()
    pg.get_by_label('Description').fill('Body only, light seals replaced.')
    check('bulk: advanced fields open beside the grid', pg.locator('.detail').is_visible() and pg.locator('.bulk-table').is_visible())
    pg.get_by_label('Row 3 title').focus(); pg.keyboard.press('Enter')
    check('bulk: Enter in the last row adds a row', pg.locator('.bulk-table tbody tr').count() == 4)
    pg.get_by_role('button', name='Review 2 products').click()
    rv = pg.locator('.bulk-review')
    check('bulk: review lists both products with shared and own values', rv.locator('tbody tr').count() == 2 and 'Shared' in rv.locator('tbody tr').first.inner_text() and 'Like New' in rv.inner_text())
    rv.get_by_role('button', name='Back to editing').click()
    check('bulk: going back keeps everything', pg.get_by_label('Row 1 title').input_value() == 'Olympus OM-1' and pg.get_by_label('Row 2 price in euros').input_value() == '110')
    pg.get_by_role('button', name='Review 2 products').click(); pg.get_by_role('button', name='Add 2 products').click()
    check('bulk: products are added with a matching message', '2 products added' in pg.locator('.toast').inner_text() and pg.locator('.ptable tbody tr').count() == 9)

    # ---- Import with two eBay accounts ----
    pg.get_by_role('button', name='Add products').click(); pg.get_by_role('dialog').get_by_role('button', name='Import listings').click()
    pg.get_by_label('eBay Outlet').check(); pg.get_by_label('Select all 5').check()
    pg.get_by_role('button', name='Import 5 listings').click()
    check('import: listings from two eBay accounts arrive linked to their account', pg.locator('.ptable tbody tr').count() == 14 and pg.locator('.ptable tbody tr', has_text='Carhartt').locator('.acct-name').inner_text() == 'eBay Outlet')

    # ---- 10. Keyboard and scope ----
    open_at(pg, 'explore')
    pg.keyboard.press('Tab'); pg.keyboard.press('Tab'); pg.keyboard.press('Tab')
    seen = set()
    for _ in range(40):
        pg.keyboard.press('Tab'); seen.add(pg.evaluate("(document.activeElement.getAttribute('aria-label') || document.activeElement.innerText || '').trim().slice(0, 28)"))
    need = ['Linked accounts', 'Add products', 'Edit product name: Test', 'Link accounts for Test']
    check('keyboard: Tab reaches navigation, add, inline edit and linking', all(any(n in s for s in seen) for n in need), str(sorted(seen))[:400])
    check('scope: unrelated areas are greyed and not focusable', pg.locator('.side .out').count() >= 8 and pg.locator('.side .out:is(button, a, [tabindex])').count() == 0)

srv = subprocess.Popen(['python3', '-m', 'http.server', '4173', '--directory', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1440, 'height': 900})
        pg.set_default_timeout(6000)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        try: run(pg)
        except Exception as e:
            print('STOPPED:', str(e)[:600]); pg.screenshot(path='tests/shots/failure.jpg', type='jpeg', quality=70); results.append(('run completed', False, ''))
        check('no console or page errors', not errs, str(errs)[:300])
        b.close()
finally:
    srv.terminate()
failed = [r for r in results if not r[1]]
print(f'\n{len(results) - len(failed)} of {len(results)} checks passed')
sys.exit(1 if failed else 0)
