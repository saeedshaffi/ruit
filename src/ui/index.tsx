import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { CircleHelp, X, Check } from 'lucide-react'
import { mk } from '../data/sample'

/** Close on outside press or Escape. Escape returns focus to the trigger when one is given. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, trigger?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || trigger?.current?.contains(t)) return
      onClose()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation(); onClose(); trigger?.current?.focus()
    }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key, true)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key, true) }
  }, [open, onClose, ref, trigger])
}

export function Tile({ marketplaceId, lg }: { marketplaceId: string; lg?: boolean }) {
  const m = mk(marketplaceId)
  return <span className={`mono-tile${lg ? ' lg' : ''}`} style={{ background: m.color }} aria-hidden="true">{m.mono}</span>
}

/** Help that opens on click, Enter or tap. Text wraps at a readable width. */
export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const id = useId()
  useDismiss(box, open, () => setOpen(false), btn)
  return (
    <span className="help" ref={box}>
      <button ref={btn} type="button" className="help-btn" aria-label={`Help: ${label}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <CircleHelp />
      </button>
      {open && <span id={id} role="note" className="pop help-pop">{children}</span>}
    </span>
  )
}

export function Modal({ title, sub, onClose, children, footer, wide }: { title: string; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current!
    const focusables = () => [...el.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, textarea, [href], [tabindex]:not([tabindex="-1"])')]
    ;(focusables()[1] ?? focusables()[0])?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key !== 'Tab') return
      const f = focusables(); const first = f[0]; const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    el.addEventListener('keydown', key)
    return () => { el.removeEventListener('keydown', key); prev?.focus?.() }
  }, [onClose])
  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={`modal${wide ? ' wide' : ''}`}>
        <header className="modal-head">
          <div><h2 id={id}>{title}</h2>{sub && <p className="hint">{sub}</p>}</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4200); return () => clearTimeout(t) }, [text, onDone])
  return <div className="toast" role="status"><Check />{text}</div>
}

export function SampleNote({ children = 'Sample data' }: { children?: ReactNode }) {
  return <span className="sample-note">{children}</span>
}
