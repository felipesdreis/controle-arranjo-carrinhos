import { useState, useEffect, Fragment } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import Modal from '../components/ui/Modal'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const EMPTY_LOCATION_FORM = { name: '', address: '', notes: '' }
const EMPTY_SLOT_FORM = { day_of_week: 0, start_time: '08:00', end_time: '10:00', cart_id: '', capacity: 2 }

function hasOverlap(slots, dayOfWeek, startTime, endTime, excludeId = null) {
  return slots.some(
    (s) =>
      s.id !== excludeId &&
      s.day_of_week === dayOfWeek &&
      !(s.end_time <= startTime || s.start_time >= endTime)
  )
}

function Badge({ active }) {
  return active ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
      Inativo
    </span>
  )
}

function LocationForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Anotações</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors"
        >
          Salvar
        </button>
      </div>
    </form>
  )
}

function SlotForm({ initial, slots, activeCarts, onSave, onClose, editingId }) {
  const [form, setForm] = useState(initial)
  const [overlapError, setOverlapError] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'day_of_week' || name === 'capacity' ? Number(value) : value }))
    setOverlapError(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (hasOverlap(slots, form.day_of_week, form.start_time, form.end_time, editingId)) {
      setOverlapError(true)
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dia da semana</label>
          <select
            name="day_of_week"
            value={form.day_of_week}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {DAYS.map((day, i) => (
              <option key={i} value={i}>{day}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade</label>
          <input
            name="capacity"
            type="number"
            min={1}
            max={4}
            value={form.capacity}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Horário início</label>
          <input
            name="start_time"
            type="time"
            value={form.start_time}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Horário fim</label>
          <input
            name="end_time"
            type="time"
            value={form.end_time}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Carrinho</label>
        <select
          name="cart_id"
          value={form.cart_id}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">-- Nenhum --</option>
          {activeCarts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      {overlapError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Conflito de horário: já existe um turno neste dia que se sobrepõe ao intervalo informado.
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors"
        >
          Salvar
        </button>
      </div>
    </form>
  )
}

function SlotsPanel({ locationId, activeCarts }) {
  const store = useAppStore()
  const slots = store.slots
    .filter((s) => s.location_id === locationId)
    .map((s) => ({
      ...s,
      cart_name: store.carts.find((c) => c.id === s.cart_id)?.name ?? null,
    }))
  const [slotModal, setSlotModal] = useState(null) // null | 'new' | { slot }

  async function handleSaveSlot(form) {
    const payload = {
      location_id: locationId,
      cart_id: form.cart_id || null,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      capacity: form.capacity,
    }
    if (slotModal === 'new') {
      await store.createSlot(payload)
    } else {
      await store.updateSlot(slotModal.slot.id, payload)
    }
    setSlotModal(null)
  }

  async function handleDeleteSlot(slot) {
    if (window.confirm(`Excluir turno ${DAYS[slot.day_of_week]} ${slot.start_time}–${slot.end_time}?`)) {
      await store.deleteSlot(slot.id)
    }
  }

  const editingSlot = slotModal && slotModal !== 'new' ? slotModal.slot : null
  const slotFormInitial = editingSlot
    ? {
        day_of_week: editingSlot.day_of_week,
        start_time: editingSlot.start_time,
        end_time: editingSlot.end_time,
        cart_id: editingSlot.cart_id ?? '',
        capacity: editingSlot.capacity,
      }
    : EMPTY_SLOT_FORM

  return (
    <div className="bg-slate-50 border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">Turnos</span>
        <button
          onClick={() => setSlotModal('new')}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors"
        >
          <Plus size={13} />
          Novo Turno
        </button>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Nenhum turno cadastrado.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500 border-b border-gray-200">
              <th className="pb-2 pr-4">Dia</th>
              <th className="pb-2 pr-4">Horário</th>
              <th className="pb-2 pr-4">Carrinho</th>
              <th className="pb-2 pr-4">Capacidade</th>
              <th className="pb-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 text-slate-700">{DAYS[slot.day_of_week]}</td>
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">
                    {slot.start_time} – {slot.end_time}
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-600">{slot.cart_name ?? '—'}</td>
                <td className="py-2 pr-4 text-slate-600">{slot.capacity}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSlotModal({ slot })}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                      title="Editar turno"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Excluir turno"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {slotModal && (
        <Modal
          title={slotModal === 'new' ? 'Novo Turno' : 'Editar Turno'}
          onClose={() => setSlotModal(null)}
        >
          <SlotForm
            initial={slotFormInitial}
            slots={slots}
            activeCarts={activeCarts}
            editingId={editingSlot?.id ?? null}
            onSave={handleSaveSlot}
            onClose={() => setSlotModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}

export default function Locations() {
  const store = useAppStore()
  const { locations, carts, loading, error } = store

  const [expandedId, setExpandedId] = useState(null)
  const [locationModal, setLocationModal] = useState(null) // null | 'new' | { location }

  useEffect(() => {
    if (!locations.length) store.fetchLocations()
    if (!carts.length) store.fetchCarts()
    store.fetchSlots()
  }, [])

  const activeCarts = carts.filter((c) => c.active === true)

  function toggleExpand(locationId) {
    setExpandedId((prev) => (prev === locationId ? null : locationId))
  }

  async function handleSaveLocation(form) {
    if (locationModal === 'new') {
      await store.createLocation(form.name)
    } else {
      await store.updateLocation(locationModal.location.id, form.name)
    }
    setLocationModal(null)
  }

  async function handleDeleteLocation(loc) {
    if (window.confirm(`Excluir "${loc.name}"? Esta ação não pode ser desfeita.`)) {
      await store.deleteLocation(loc.id)
    }
  }

  const editingLocation = locationModal && locationModal !== 'new' ? locationModal.location : null
  const locationFormInitial = editingLocation
    ? { name: editingLocation.name, address: editingLocation.address ?? '', notes: editingLocation.notes ?? '' }
    : EMPTY_LOCATION_FORM

  if (loading) return <div className="p-8 text-slate-500">Carregando...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Locais</h1>
        <button
          onClick={() => setLocationModal('new')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
          Novo Local
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500 bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Endereço</th>
              <th className="px-6 py-3">Ativo</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                  Nenhum local cadastrado.
                </td>
              </tr>
            )}
            {locations.map((loc) => (
              <Fragment key={loc.id}>
                <tr
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-slate-800">{loc.name}</td>
                  <td className="px-6 py-3 text-slate-500 text-sm">{loc.address || '—'}</td>
                  <td className="px-6 py-3">
                    <Badge active={loc.active === true} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleExpand(loc.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title={expandedId === loc.id ? 'Recolher turnos' : 'Expandir turnos'}
                      >
                        {expandedId === loc.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => setLocationModal({ location: loc })}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Editar local"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(loc)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Excluir local"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === loc.id && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <SlotsPanel
                        locationId={loc.id}
                        activeCarts={activeCarts}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {locationModal && (
        <Modal
          title={locationModal === 'new' ? 'Novo Local' : 'Editar Local'}
          onClose={() => setLocationModal(null)}
        >
          <LocationForm
            initial={locationFormInitial}
            onSave={handleSaveLocation}
            onClose={() => setLocationModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
