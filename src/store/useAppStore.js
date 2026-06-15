import { create } from 'zustand'
import { getBrothers, createBrother as createBrotherApi, updateBrother as updateBrotherApi, deleteBrother as deleteBrotherApi } from '../api/brothers'
import { getCarts, createCart as createCartApi, updateCart as updateCartApi, deleteCart as deleteCartApi } from '../api/carts'
import { getLocations, createLocation as createLocationApi, updateLocation as updateLocationApi, deleteLocation as deleteLocationApi } from '../api/locations'
import { getGroups, createGroup as createGroupApi, updateGroup as updateGroupApi, deleteGroup as deleteGroupApi } from '../api/groups'
import { getSlots, createSlot as createSlotApi, updateSlot as updateSlotApi, deleteSlot as deleteSlotApi } from '../api/slots'
import { getScheduleWeeks, createScheduleWeek as createScheduleWeekApi, updateScheduleWeek as updateScheduleWeekApi, deleteScheduleWeek as deleteScheduleWeekApi } from '../api/scheduleWeeks'
import { getAssignments, getAssignmentsByWeek, upsertAssignment as upsertAssignmentApi, deleteAssignment as deleteAssignmentApi } from '../api/assignments'
import { getCongregationName, updateCongregationName } from '../api/userSettings'

const useAppStore = create((set, get) => ({
  brothers: [],
  carts: [],
  locations: [],
  groups: [],
  slots: [],
  scheduleWeeks: [],
  assignments: [],
  congregationName: '',
  currentUser: null,
  loading: false,
  error: null,

  // ── Setter puro ───────────────────────────────────────────
  setCurrentUser: (user) => set({ currentUser: user }),

  // ── Inicialização global ──────────────────────────────────
  initializeData: async () => {
    set({ loading: true, error: null })
    const results = await Promise.allSettled([
      get().fetchBrothers(),
      get().fetchCarts(),
      get().fetchLocations(),
      get().fetchGroups(),
      get().fetchSlots(),
      get().fetchScheduleWeeks(),
      get().fetchCongregationName(),
    ])
    const firstError = results.find((r) => r.status === 'rejected')
    set({ loading: false, error: firstError ? firstError.reason.message : null })
  },

  // ── Brothers ──────────────────────────────────────────────
  fetchBrothers: async () => {
    try {
      const data = await getBrothers()
      set({ brothers: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  createBrother: async (data) => {
    set({ loading: true, error: null })
    try {
      const item = await createBrotherApi(data)
      set((s) => ({ brothers: [...s.brothers, item] }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  updateBrother: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateBrotherApi(id, data)
      set((s) => ({ brothers: s.brothers.map((b) => (b.id === id ? updated : b)) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  deleteBrother: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteBrotherApi(id)
      set((s) => ({ brothers: s.brothers.filter((b) => b.id !== id) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Carts ─────────────────────────────────────────────────
  fetchCarts: async () => {
    try {
      const data = await getCarts()
      set({ carts: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  createCart: async (name) => {
    set({ loading: true, error: null })
    try {
      const item = await createCartApi(name)
      set((s) => ({ carts: [...s.carts, item] }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  updateCart: async (id, name) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateCartApi(id, name)
      set((s) => ({ carts: s.carts.map((c) => (c.id === id ? updated : c)) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  deleteCart: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteCartApi(id)
      set((s) => ({ carts: s.carts.filter((c) => c.id !== id) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Locations ─────────────────────────────────────────────
  fetchLocations: async () => {
    try {
      const data = await getLocations()
      set({ locations: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  createLocation: async (name) => {
    set({ loading: true, error: null })
    try {
      const item = await createLocationApi(name)
      set((s) => ({ locations: [...s.locations, item] }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  updateLocation: async (id, name) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateLocationApi(id, name)
      set((s) => ({ locations: s.locations.map((l) => (l.id === id ? updated : l)) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  deleteLocation: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteLocationApi(id)
      set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Groups ────────────────────────────────────────────────
  fetchGroups: async () => {
    try {
      const data = await getGroups()
      set({ groups: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  createGroup: async (name, responsibleId) => {
    set({ loading: true, error: null })
    try {
      const item = await createGroupApi(name, responsibleId)
      set((s) => ({ groups: [...s.groups, item] }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  updateGroup: async (id, name, responsibleId) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateGroupApi(id, name, responsibleId)
      set((s) => ({ groups: s.groups.map((g) => (g.id === id ? updated : g)) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  deleteGroup: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteGroupApi(id)
      set((s) => ({ groups: s.groups.filter((g) => g.id !== id) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Slots ─────────────────────────────────────────────────
  fetchSlots: async () => {
    try {
      const data = await getSlots()
      set({ slots: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  createSlot: async (slotData) => {
    set({ loading: true, error: null })
    try {
      const item = await createSlotApi(slotData)
      set((s) => ({ slots: [...s.slots, item] }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  updateSlot: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateSlotApi(id, updates)
      set((s) => ({ slots: s.slots.map((sl) => (sl.id === id ? updated : sl)) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  deleteSlot: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteSlotApi(id)
      set((s) => ({ slots: s.slots.filter((sl) => sl.id !== id) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Schedule Weeks ────────────────────────────────────────
  fetchScheduleWeeks: async () => {
    try {
      const data = await getScheduleWeeks()
      set({ scheduleWeeks: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  createScheduleWeek: async (weekStart, notes) => {
    set({ loading: true, error: null })
    try {
      const item = await createScheduleWeekApi(weekStart, notes)
      set((s) => ({ scheduleWeeks: [...s.scheduleWeeks, item] }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  updateScheduleWeek: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateScheduleWeekApi(id, updates)
      set((s) => ({ scheduleWeeks: s.scheduleWeeks.map((w) => (w.id === id ? updated : w)) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  deleteScheduleWeek: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteScheduleWeekApi(id)
      set((s) => ({ scheduleWeeks: s.scheduleWeeks.filter((w) => w.id !== id) }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Assignments ───────────────────────────────────────────
  fetchAssignments: async () => {
    try {
      const data = await getAssignments()
      set({ assignments: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchAssignmentsByWeek: async (weekId) => {
    try {
      const data = await getAssignmentsByWeek(weekId)
      set({ assignments: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  upsertAssignment: async (weekId, slotId, position, brotherId) => {
    set({ loading: true, error: null })
    try {
      const item = await upsertAssignmentApi(weekId, slotId, position, brotherId)
      set((s) => {
        const filtered = s.assignments.filter(
          (a) => !(a.week_id === weekId && a.slot_id === slotId && a.position === position)
        )
        return { assignments: [...filtered, item] }
      })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  removeAssignment: async (weekId, slotId, position) => {
    set({ loading: true, error: null })
    try {
      await deleteAssignmentApi(weekId, slotId, position)
      set((s) => ({
        assignments: s.assignments.filter(
          (a) => !(a.week_id === weekId && a.slot_id === slotId && a.position === position)
        ),
      }))
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Congregation Name ─────────────────────────────────────
  fetchCongregationName: async () => {
    try {
      const name = await getCongregationName()
      set({ congregationName: name || '' })
    } catch (err) {
      set({ error: err.message })
    }
  },

  saveCongregationName: async (name) => {
    set({ loading: true, error: null })
    try {
      await updateCongregationName(name)
      set({ congregationName: name })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },
}))

export default useAppStore
