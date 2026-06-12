import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Zap, FileText, Settings, Pencil, Trash2, Plus, X } from 'lucide-react'
import { format, addWeeks, subWeeks, addDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import {
  getWeek,
  getOrCreateWeek,
  getActiveSlotsWithLocations,
  listAssignmentsByWeek,
  setAssignment,
  clearWeekAssignments,
  getLatestWeekBefore,
  copyWeekAssignments,
} from '../db/queries/assignments'
import { createSlot, updateSlot, deleteSlot } from '../db/queries/slots'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0]
const DAY_OFFSET = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }

const EMPTY_FORM = { location_id: '', day_of_week: '1', start_time: '', end_time: '', cart_id: '', capacity: '2' }

function getThisMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getPeriodFromTime(time) {
  if (time < '12:00') return 'MANHÃ'
  if (time < '18:00') return 'TARDE'
  return 'NOITE'
}

function buildGridByCart(slots) {
  const cartMap = {}
  for (const slot of slots) {
    const cartId = slot.cart_id ?? '__none__'
    const cartName = slot.cart_name || 'Sem Carrinho'
    const period = getPeriodFromTime(slot.start_time)
    if (!cartMap[cartId]) {
      cartMap[cartId] = { cart_id: cartId, cart_name: cartName, periods: {} }
    }
    if (!cartMap[cartId].periods[period]) {
      cartMap[cartId].periods[period] = { period, days: {} }
    }
    // Um slot pode aparecer em vários dias — usar day_of_week como chave
    // Múltiplos slots no mesmo período/dia são acumulados em array
    if (!cartMap[cartId].periods[period].days[slot.day_of_week]) {
      cartMap[cartId].periods[period].days[slot.day_of_week] = []
    }
    cartMap[cartId].periods[period].days[slot.day_of_week].push(slot)
  }
  return Object.values(cartMap).map((cart) => ({
    ...cart,
    periods: ['MANHÃ', 'TARDE', 'NOITE'].map((p) => cart.periods[p]).filter(Boolean),
  }))
}

function buildConflictSet(slots, assignments) {
  const dayMap = {}
  for (const slot of slots) {
    for (let pos = 1; pos <= slot.capacity; pos++) {
      const bId = assignments[`${slot.id}-${pos}`]
      if (!bId) continue
      if (!dayMap[slot.day_of_week]) dayMap[slot.day_of_week] = {}
      if (!dayMap[slot.day_of_week][bId]) dayMap[slot.day_of_week][bId] = []
      dayMap[slot.day_of_week][bId].push({ slotId: slot.id, pos })
    }
  }
  const conflicts = new Set()
  for (const brothers of Object.values(dayMap)) {
    for (const cells of Object.values(brothers)) {
      if (cells.length > 1) {
        cells.forEach(({ slotId, pos }) => conflicts.add(`${slotId}-${pos}`))
      }
    }
  }
  return conflicts
}

function autoFill(slots, currentAssignments, activeBrothers) {
  const next = { ...currentAssignments }
  const dayUsed = {}
  for (const slot of slots) {
    if (!dayUsed[slot.day_of_week]) dayUsed[slot.day_of_week] = new Set()
    for (let pos = 1; pos <= slot.capacity; pos++) {
      const bId = next[`${slot.id}-${pos}`]
      if (bId) dayUsed[slot.day_of_week].add(bId)
    }
  }
  const pool = [...activeBrothers].sort(() => Math.random() - 0.5)
  for (const slot of slots) {
    const used = dayUsed[slot.day_of_week] ?? new Set()
    for (let pos = 1; pos <= slot.capacity; pos++) {
      const key = `${slot.id}-${pos}`
      if (next[key]) continue
      const available = pool.filter((b) => !used.has(b.id))
      if (!available.length) continue
      const chosen = available[0]
      next[key] = chosen.id
      used.add(chosen.id)
    }
    dayUsed[slot.day_of_week] = used
  }
  return next
}

// Agrupa slots por local para exibição no modal
function groupSlotsByLocation(slots) {
  const map = {}
  for (const s of slots) {
    if (!map[s.location_id]) map[s.location_id] = { name: s.location_name, slots: [] }
    map[s.location_id].slots.push(s)
  }
  return Object.values(map)
}

export default function Schedule() {
  const { db, persist, brothers, carts, locations } = useAppStore()
  const navigate = useNavigate()
  const activeBrothers = brothers.filter((b) => b.active)
  const activeCarts = carts.filter((c) => c.active)
  const activeLocations = locations.filter((l) => l.active)

  const [monday, setMonday] = useState(getThisMonday)
  const [week, setWeek] = useState(null)
  const [slots, setSlots] = useState([])
  const [assignments, setAssignments] = useState({})
  const [showPrompt, setShowPrompt] = useState(false)
  const [prevWeek, setPrevWeek] = useState(null)

  // Modal de gerenciamento de turnos
  const [showSlotManager, setShowSlotManager] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [showSlotForm, setShowSlotForm] = useState(false)
  const [slotForm, setSlotForm] = useState(EMPTY_FORM)
  const [slotFormError, setSlotFormError] = useState('')
  const [slotBrothers, setSlotBrothers] = useState(['', ''])

  const weekStart = format(monday, 'yyyy-MM-dd')
  const weekLabel = `${format(monday, 'dd/MM')} a ${format(addDays(monday, 6), 'dd/MM/yyyy')}`

  const reloadSlots = useCallback(() => {
    setSlots(getActiveSlotsWithLocations(db))
  }, [db])

  const loadData = useCallback(
    (weekId) => {
      const allSlots = getActiveSlotsWithLocations(db)
      const rawAssignments = listAssignmentsByWeek(db, weekId)
      const map = {}
      for (const a of rawAssignments) {
        map[`${a.slot_id}-${a.position}`] = a.brother_id
      }
      setSlots(allSlots)
      setAssignments(map)
    },
    [db]
  )

  useEffect(() => {
    if (!db) return
    const existing = getWeek(db, weekStart)
    if (existing) {
      setWeek(existing)
      setShowPrompt(false)
      setPrevWeek(null)
      loadData(existing.id)
    } else {
      setWeek(null)
      setSlots([])
      setAssignments({})
      setPrevWeek(getLatestWeekBefore(db, weekStart))
      setShowPrompt(true)
    }
  }, [db, weekStart, loadData])

  async function handleCreateWeek(copyFrom = null) {
    const newWeek = await getOrCreateWeek(db, persist, weekStart)
    if (copyFrom) {
      await copyWeekAssignments(db, persist, copyFrom.id, newWeek.id)
    }
    setWeek(newWeek)
    setShowPrompt(false)
    setPrevWeek(null)
    loadData(newWeek.id)
  }

  async function handleAssign(slotId, position, brotherId) {
    const bId = brotherId ? Number(brotherId) : null
    setAssignments((prev) => ({ ...prev, [`${slotId}-${position}`]: bId }))
    await setAssignment(db, persist, week.id, slotId, position, bId)
  }

  async function handleAutoFill() {
    const filled = autoFill(slots, assignments, activeBrothers)
    const ops = []
    for (const [key, bId] of Object.entries(filled)) {
      if (assignments[key] === bId) continue
      const [slotId, pos] = key.split('-').map(Number)
      ops.push(setAssignment(db, persist, week.id, slotId, pos, bId))
    }
    setAssignments(filled)
    await Promise.all(ops)
  }

  async function handleClearAll() {
    if (!week) return
    await clearWeekAssignments(db, persist, week.id)
    setAssignments({})
  }

  // ---- Slot manager ----

  function openNewSlot() {
    setEditingSlot(null)
    setSlotForm(EMPTY_FORM)
    setSlotBrothers(['', ''])
    setSlotFormError('')
    setShowSlotForm(true)
  }

  function openEditSlot(slot) {
    setEditingSlot(slot)
    setSlotForm({
      location_id: String(slot.location_id),
      day_of_week: String(slot.day_of_week),
      start_time: slot.start_time,
      end_time: slot.end_time,
      cart_id: slot.cart_id ? String(slot.cart_id) : '',
      capacity: String(slot.capacity),
    })
    const bros = Array.from({ length: slot.capacity }, (_, i) =>
      assignments[`${slot.id}-${i + 1}`] ? String(assignments[`${slot.id}-${i + 1}`]) : ''
    )
    setSlotBrothers(bros)
    setSlotFormError('')
    setShowSlotForm(true)
  }

  function handleDeleteSlot(slot) {
    if (!window.confirm(`Excluir turno ${DAY_LABELS[slot.day_of_week]} ${slot.start_time}–${slot.end_time} em ${slot.location_name}?`)) return
    deleteSlot(db, persist, slot.id)
    reloadSlots()
  }

  async function handleSlotFormSave() {
    const { location_id, day_of_week, start_time, end_time, capacity } = slotForm
    if (!location_id) { setSlotFormError('Selecione um local.'); return }
    if (!start_time || !end_time) { setSlotFormError('Informe horário de início e fim.'); return }
    if (start_time >= end_time) { setSlotFormError('Horário de início deve ser anterior ao fim.'); return }
    if (!capacity || Number(capacity) < 1) { setSlotFormError('Capacidade mínima é 1.'); return }

    const payload = {
      location_id: Number(location_id),
      day_of_week: Number(day_of_week),
      start_time,
      end_time,
      cart_id: slotForm.cart_id ? Number(slotForm.cart_id) : null,
      capacity: Number(capacity),
    }

    let slotId
    if (editingSlot) {
      updateSlot(db, persist, editingSlot.id, payload)
      slotId = editingSlot.id
    } else {
      slotId = createSlot(db, persist, payload)
    }

    if (week) {
      const cap = Number(capacity)
      const ops = []
      for (let pos = 1; pos <= cap; pos++) {
        const bId = slotBrothers[pos - 1] ? Number(slotBrothers[pos - 1]) : null
        ops.push(setAssignment(db, persist, week.id, slotId, pos, bId))
      }
      await Promise.all(ops)
      loadData(week.id)
    } else {
      reloadSlots()
    }
    setShowSlotForm(false)
    setEditingSlot(null)
    setSlotForm(EMPTY_FORM)
    setSlotBrothers(['', ''])
    setSlotFormError('')
  }

  const grid = buildGridByCart(slots)
  const conflicts = buildConflictSet(slots, assignments)
  const slotGroups = groupSlotsByLocation(slots)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonday((m) => subWeeks(m, 1))}
            className="p-2 rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center min-w-[210px]">
            <p className="font-semibold text-slate-800 text-sm">Semana de {weekLabel}</p>
          </div>
          <button
            onClick={() => setMonday((m) => addWeeks(m, 1))}
            className="p-2 rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSlotForm(false); setShowSlotManager(true) }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <Settings size={14} />
            Gerenciar Turnos
          </button>
          {week && (
            <>
              <button
                onClick={handleAutoFill}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                <Zap size={14} />
                Gerar automático
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                Limpar tudo
              </button>
              <button
                onClick={() => navigate('/report')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors"
              >
                <FileText size={14} />
                Ver relatório
              </button>
            </>
          )}
        </div>
      </div>

      {/* Prompt: semana não existe */}
      {showPrompt && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center max-w-sm w-full">
            <p className="font-semibold text-slate-800 mb-1">Semana não encontrada</p>
            <p className="text-sm text-slate-500 mb-6">
              Deseja criar a programação para a semana de {weekLabel}?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleCreateWeek(null)}
                className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Criar semana vazia
              </button>
              {prevWeek && (
                <button
                  onClick={() => handleCreateWeek(prevWeek)}
                  className="border border-slate-300 hover:border-slate-500 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Copiar da semana de{' '}
                  {format(new Date(prevWeek.week_start + 'T00:00:00'), 'dd/MM/yyyy')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade semanal */}
      {week && (
        <div className="flex-1 overflow-auto px-6 py-4">
          {grid.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-3">
                  Nenhum turno configurado ainda.
                </p>
                <button
                  onClick={() => { setShowSlotForm(false); setShowSlotManager(true) }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors mx-auto"
                >
                  <Plus size={14} />
                  Adicionar turno
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {grid.map((cart) => (
                <div key={cart.cart_id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      Carrinho: {cart.cart_name}
                    </h3>
                  </div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600 w-24 shrink-0">
                          Período
                        </th>
                        {DISPLAY_DAYS.map((d) => {
                          const date = addDays(monday, DAY_OFFSET[d])
                          return (
                            <th key={d} className="px-2 py-3 font-medium text-slate-600 text-center min-w-[120px]">
                              <div>{DAY_LABELS[d]}</div>
                              <div className="text-xs text-slate-400 font-normal">{format(date, 'dd/MM')}</div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {cart.periods.map((periodObj) => (
                        <tr key={periodObj.period} className="border-b border-gray-100 last:border-0 align-top">
                          <td className="px-4 py-2 font-medium text-xs text-slate-600 shrink-0 whitespace-nowrap">
                            {periodObj.period}
                          </td>
                          {DISPLAY_DAYS.map((d) => {
                            const daySlots = periodObj.days[d]
                            if (!daySlots || daySlots.length === 0) {
                              return (
                                <td key={d} className="px-2 py-2 text-center text-slate-200 text-xs">—</td>
                              )
                            }
                            return (
                              <td key={d} className="px-2 py-2">
                                <div className="flex flex-col gap-2">
                                  {daySlots.map((slot) => (
                                    <div key={slot.id} className="flex flex-col gap-1">
                                      {Array.from({ length: slot.capacity }, (_, i) => i + 1).map((pos) => {
                                        const key = `${slot.id}-${pos}`
                                        const val = assignments[key] ?? ''
                                        const isConflict = conflicts.has(key)
                                        const isFilled = !!val
                                        return (
                                          <select
                                            key={pos}
                                            value={val}
                                            onChange={(e) => handleAssign(slot.id, pos, e.target.value)}
                                            className={`w-full rounded-md border px-1 py-1 text-xs focus:outline-none focus:ring-1 transition-colors cursor-pointer ${
                                              isConflict
                                                ? 'border-amber-400 bg-amber-50 text-amber-800 focus:ring-amber-400'
                                                : isFilled
                                                ? 'border-green-300 bg-green-50 text-green-800 focus:ring-green-400'
                                                : 'border-gray-200 bg-gray-50 text-slate-400 focus:ring-slate-300'
                                            }`}
                                          >
                                            <option value="">— vazio —</option>
                                            {activeBrothers.map((b) => (
                                              <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                          </select>
                                        )
                                      })}
                                      <div className="text-xs text-slate-400 mt-0.5 leading-tight">
                                        <span className="block truncate" title={slot.location_name}>{slot.location_name}</span>
                                        <span className="font-mono">{slot.start_time}–{slot.end_time}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legenda */}
      {week && slots.length > 0 && (
        <div className="px-6 pb-3 flex items-center gap-5 text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-gray-200 bg-gray-50 inline-block" />
            Vazio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-green-300 bg-green-50 inline-block" />
            Preenchido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-amber-400 bg-amber-50 inline-block" />
            Conflito — mesmo irmão no mesmo dia
          </span>
        </div>
      )}

      {/* Modal: Gerenciar Turnos */}
      {showSlotManager && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-slate-800">Gerenciar Turnos</h2>
              <button
                onClick={() => { setShowSlotManager(false); setShowSlotForm(false) }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Formulário de criação/edição */}
              {showSlotForm && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    {editingSlot ? 'Editar Turno' : 'Novo Turno'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Local</label>
                      <select
                        value={slotForm.location_id}
                        onChange={(e) => setSlotForm((f) => ({ ...f, location_id: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <option value="">Selecione um local</option>
                        {activeLocations.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Dia da semana</label>
                      <select
                        value={slotForm.day_of_week}
                        onChange={(e) => setSlotForm((f) => ({ ...f, day_of_week: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        {DAY_LABELS.map((label, i) => (
                          <option key={i} value={i}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Carrinho</label>
                      <select
                        value={slotForm.cart_id}
                        onChange={(e) => setSlotForm((f) => ({ ...f, cart_id: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <option value="">— nenhum —</option>
                        {activeCarts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hora início</label>
                      <input
                        type="time"
                        value={slotForm.start_time}
                        onChange={(e) => setSlotForm((f) => ({ ...f, start_time: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hora fim</label>
                      <input
                        type="time"
                        value={slotForm.end_time}
                        onChange={(e) => setSlotForm((f) => ({ ...f, end_time: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Capacidade (pessoas)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={slotForm.capacity}
                        onChange={(e) => {
                          const cap = Math.max(1, Math.min(10, Number(e.target.value) || 1))
                          setSlotForm((f) => ({ ...f, capacity: String(cap) }))
                          setSlotBrothers((prev) => {
                            const next = Array.from({ length: cap }, (_, i) => prev[i] ?? '')
                            return next
                          })
                        }}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  {/* Seção de irmãos — só quando há semana aberta */}
                  {week ? (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        Quem vai estar &mdash; semana de {weekLabel}
                      </label>
                      <div className="flex flex-col gap-1.5">
                        {slotBrothers.map((val, i) => (
                          <select
                            key={i}
                            value={val}
                            onChange={(e) => {
                              const v = e.target.value
                              setSlotBrothers((prev) => {
                                const next = [...prev]
                                next[i] = v
                                return next
                              })
                            }}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                          >
                            <option value="">— vazio —</option>
                            {activeBrothers.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-3">
                      Crie a programação da semana para designar irmãos.
                    </p>
                  )}

                  {slotFormError && (
                    <p className="text-xs text-red-600 mt-2">{slotFormError}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSlotFormSave}
                      className="px-4 py-1.5 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => { setShowSlotForm(false); setEditingSlot(null); setSlotFormError('') }}
                      className="px-4 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de turnos */}
              {slotGroups.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Nenhum turno cadastrado. Clique em "+ Novo Turno" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {slotGroups.map((group) => (
                    <div key={group.name}>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        {group.name}
                      </div>
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        {group.slots.map((slot, i) => (
                          <div
                            key={slot.id}
                            className={`flex items-center justify-between px-3 py-2 text-sm ${i > 0 ? 'border-t border-gray-100' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-slate-700 w-8">{DAY_LABELS[slot.day_of_week]}</span>
                              <span className="text-slate-500 font-mono text-xs">
                                {slot.start_time} – {slot.end_time}
                              </span>
                              {slot.cart_name && (
                                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded px-1.5 py-0.5">
                                  {slot.cart_name}
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                {slot.capacity} {slot.capacity === 1 ? 'pessoa' : 'pessoas'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditSlot(slot)}
                                className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot)}
                                className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rodapé do modal */}
            <div className="px-6 py-3 border-t border-gray-200">
              <button
                onClick={openNewSlot}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors"
              >
                <Plus size={14} />
                Novo Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
