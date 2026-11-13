import { Fragment, useEffect, useState, type RefObject } from 'react'
import type { Side } from './issues'

type Box = { x: number; y: number; w: number; h: number }
const PAD = 8

/** Finds the union box of the target elements, measured inside the stage. */
function useBoxes(stage: RefObject<HTMLElement | null>, selectors: string[], key: string) {
  const [boxes, setBoxes] = useState<Box[]>([])
  useEffect(() => {
    const measure = () => {
      const st = stage.current; if (!st) return
      const sr = st.getBoundingClientRect()
      const found: Box[] = []
      for (const sel of selectors) {
        const rects = [...st.querySelectorAll(sel)].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0)
        if (!rects.length) continue
        const x1 = Math.max(0, Math.min(...rects.map((r) => r.left)) - sr.left - PAD), y1 = Math.max(0, Math.min(...rects.map((r) => r.top)) - sr.top - PAD)
        const x2 = Math.min(sr.width, Math.max(...rects.map((r) => r.right)) - sr.left + PAD), y2 = Math.min(sr.height, Math.max(...rects.map((r) => r.bottom)) - sr.top + PAD)
        if (x2 - x1 < 4 || y2 - y1 < 4) continue
        const box = { x: Math.round(x1), y: Math.round(y1), w: Math.round(x2 - x1), h: Math.round(y2 - y1) }
        // Targets that share a row are merged into one box. Separate rows stay separate.
        const hit = found.find((f) => box.y < f.y + f.h && f.y < box.y + box.h)
        if (hit) {
          const nx = Math.min(hit.x, box.x), ny = Math.min(hit.y, box.y)
          hit.w = Math.max(hit.x + hit.w, box.x + box.w) - nx; hit.h = Math.max(hit.y + hit.h, box.y + box.h) - ny; hit.x = nx; hit.y = ny
        } else found.push(box)
      }
      setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(found) ? prev : found))
    }
    measure()
    const t = setInterval(measure, 150)
    window.addEventListener('resize', measure)
    return () => { clearInterval(t); window.removeEventListener('resize', measure) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return boxes
}

/** Dims and blurs the stage, keeps the target sharp, and points at it with a short note. */
export function Spotlight({ stage, selectors, note, side, id }: { stage: RefObject<HTMLElement | null>; selectors: string[]; note: string; side: Side; id: string }) {
  const boxes = useBoxes(stage, selectors, id)
  const sw = stage.current?.clientWidth ?? 0, sh = stage.current?.clientHeight ?? 0
  if (!boxes.length) return null
  const { x, y, w, h } = boxes[0]
  const rows = [...boxes].sort((a, b) => a.y - b.y)
  const NW = 232, GAP = 54
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  // Pick the requested side, or flip when there is no room for the note.
  let s = side
  if (s === 'right' && x + w + GAP + NW > sw) s = 'left'
  if (s === 'left' && x - GAP - NW < 0) s = x + w + GAP + NW <= sw ? 'right' : 'bottom'
  if (s === 'bottom' && y + h + GAP + 80 > sh) s = 'top'
  if (s === 'top' && y - GAP - 80 < 0) s = 'bottom'
  let nx = 0, ny = 0, ax = 0, ay = 0, bx = 0, by = 0, tf = ''
  if (s === 'right' || s === 'left') {
    ny = clamp(y + Math.min(h / 2, 34), 30, sh - 30); by = clamp(ny, y + 6, y + h - 6); ay = ny
    if (s === 'right') { nx = x + w + GAP; ax = nx - 6; bx = x + w + 6; tf = 'translateY(-50%)' }
    else { nx = x - GAP; ax = nx + 6; bx = x - 6; tf = 'translate(-100%, -50%)' }
  } else {
    nx = clamp(x + Math.min(w / 2, 150), NW / 2 + 12, sw - NW / 2 - 12); bx = clamp(nx, x + 8, x + w - 8); ax = nx
    if (s === 'bottom') { ny = y + h + GAP; ay = ny - 6; by = y + h + 6; tf = 'translateX(-50%)' }
    else { ny = y - GAP; ay = ny + 6; by = y - 6; tf = 'translate(-50%, -100%)' }
  }
  const horizontal = s === 'right' || s === 'left'
  const cx = horizontal ? (ax + bx) / 2 : ax + (bx - ax) * 0.2 + 14, cy = horizontal ? ay + (by - ay) * 0.2 - 14 : (ay + by) / 2
  return (
    <div className="spot" aria-hidden="true">
      {/* Four panels around the target. A single clipped layer would still blur the cut out area. */}
      {rows.map((b, i) => {
        const prevEnd = i === 0 ? 0 : rows[i - 1].y + rows[i - 1].h
        return (
          <Fragment key={i}>
            <div className="spot-dim" style={{ left: 0, top: prevEnd, width: sw, height: Math.max(0, b.y - prevEnd) }} />
            <div className="spot-dim" style={{ left: 0, top: b.y, width: b.x, height: b.h }} />
            <div className="spot-dim" style={{ left: b.x + b.w, top: b.y, width: Math.max(0, sw - b.x - b.w), height: b.h }} />
            <div className="spot-ring" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />
          </Fragment>
        )
      })}
      <div className="spot-dim" style={{ left: 0, top: rows[rows.length - 1].y + rows[rows.length - 1].h, width: sw, height: Math.max(0, sh - rows[rows.length - 1].y - rows[rows.length - 1].h) }} />
      <svg className="spot-arrow" width={sw} height={sh}>
        <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="var(--mark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></marker></defs>
        <path d={`M${ax} ${ay}Q${cx} ${cy} ${bx} ${by}`} fill="none" stroke="var(--mark)" strokeWidth="2.25" strokeLinecap="round" markerEnd="url(#ah)" />
      </svg>
      <p className="spot-note" style={{ left: nx, top: ny, width: NW, transform: tf }}>{note}</p>
    </div>
  )
}

/** On the improved screen: a soft outline around what changed. It fades so it never blocks the UI. */
export function ChangeRing({ stage, selectors, id }: { stage: RefObject<HTMLElement | null>; selectors: string[]; id: string }) {
  const boxes = useBoxes(stage, selectors, id)
  return <>{boxes.map((b, i) => <div className="change-ring" key={id + i} aria-hidden="true" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />)}</>
}
