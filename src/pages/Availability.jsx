import { useEffect, useMemo, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { buildAvailability } from '../lib/scheduleGrid'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAYS = [1, 2, 3, 4, 5, 6, 0]
const PERIODS = ['MANHÃ', 'TARDE', 'NOITE']
const MODES = [
  { value: 'all', label: 'Todos' },
  { value: 'used', label: 'Usados' },
  { value: 'free', label: 'Livres' },
]

const selectClass = 'px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-slate-700 bg-white'

export default function Availability() {
  const slots = useAppStore((s) => s.slots)
  const carts = useAppStore((s) => s.carts)
  const locations = useAppStore((s) => s.locations)
  const fetchSlots = useAppStore((s) => s.fetchSlots)

  const [cartId, setCartId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [periods, setPeriods] = useState(PERIODS)
  const [mode, setMode] = useState('all')

  // Schedule.jsx edita turnos direto pela API, sem passar pelo store — recarrega para não mostrar grade velha
  useEffect(() => { fetchSlots() }, [])

  const cells = useMemo(() => buildAvailability(slots, { cartId, locationId }), [slots, cartId, locationId])
  const cartName = useMemo(() => Object.fromEntries(carts.map((c) => [c.id, c.name])), [carts])
  const locationName = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, l.name])), [locations])

  function togglePeriod(p) {
    setPeriods((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : PERIODS.filter((x) => x === p || prev.includes(x))))
  }

  function describe(s) {
    return `${s.start_time}–${s.end_time} · ${cartName[s.cart_id] ?? 'Sem carrinho'} · ${locationName[s.location_id] ?? '—'}`
  }

  function renderCell(day, period) {
    const { matches = [], conflicts = [] } = cells[`${day}-${period}`] ?? {}
    const used = matches.length > 0
    const free = conflicts.length === 0
    const dimmed = (mode === 'used' && !used) || (mode === 'free' && !free)

    return (
      <td key={day} className={`px-2 py-2 align-top border-l border-surface-border ${dimmed ? 'opacity-25' : ''}`}>
        {used && (
          <ul className="space-y-1">
            {matches.map((s) => (
              <li key={s.id} className="text-xs rounded-md bg-brand-mint/10 text-ink px-2 py-1">{describe(s)}</li>
            ))}
          </ul>
        )}
        {free && <span className="inline-block text-xs font-medium rounded-md bg-green-50 text-green-700 px-2 py-1">Livre</span>}
        {!used && !free && (
          <ul className="space-y-1" title="Ocupado por outra combinação">
            {conflicts.map((s) => (
              <li key={s.id} className="text-xs text-ink/50 px-2 py-1 border border-dashed border-surface-border rounded-md">
                Ocupado: {describe(s)}
              </li>
            ))}
          </ul>
        )}
      </td>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-5 border-b border-surface-border bg-surface-card">
        <h1 className="text-xl font-semibold text-ink">Disponibilidade</h1>
        <p className="text-sm text-ink/60 mt-0.5">Com base nos turnos cadastrados na Programação.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap gap-y-2 px-4 md:px-8 py-3 border-b border-gray-200 bg-white">
        <select value={cartId} onChange={(e) => setCartId(e.target.value)} className={selectClass} aria-label="Carrinho">
          <option value="">Todos os carrinhos</option>
          {carts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={selectClass} aria-label="Local">
          <option value="">Todos os locais</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <div className="flex items-center gap-3">
          {PERIODS.map((p) => (
            <label key={p} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={periods.includes(p)} onChange={() => togglePeriod(p)} />
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === m.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="bg-surface-card rounded-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-3 py-3 text-left font-medium text-ink/70 w-24">Período</th>
                {DAYS.map((d) => (
                  <th key={d} className="px-2 py-3 font-medium text-ink/70 text-center min-w-[140px]">{DAY_LABELS[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p} className="border-b border-surface-border last:border-0">
                  <td className="px-3 py-2 font-medium text-ink/70 align-top">{p}</td>
                  {DAYS.map((d) => renderCell(d, p))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
