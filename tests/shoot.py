"""Takes screenshots of chosen routes. Usage: python3 tests/shoot.py <width> <height> route[:name] ..."""
import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
w, h = int(sys.argv[1]), int(sys.argv[2])
srv = subprocess.Popen(['python3', '-m', 'http.server', '4173', '--directory', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': w, 'height': h})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        for r in sys.argv[3:]:
            name = r.replace('/', '_').strip('_#') or 'intro'
            pg.goto('http://localhost:4173/#' + r.replace('/', '-')); pg.reload(); time.sleep(0.9)
            pg.screenshot(path=f'tests/shots/{name}_{w}.jpg', type='jpeg', quality=72)
        print('errors:', errs)
        b.close()
finally:
    srv.terminate()
