import { create } from 'zustand'
import { initDB } from '../db/init'
import { listAllBrothers, createBrother, updateBrother as updateBrotherQuery, deactivateBrother } from '../db/queries/brothers'
import { listAllCarts, createCart, updateCart as updateCartQuery, deactivateCart } from '../db/queries/carts'
import { listAllLocations, createLocation, updateLocation as updateLocationQuery, deactivateLocation } from '../db/queries/locations'

const useAppStore = create((set, get) => ({
  db: null,
  persist: null,
  loading: true,
  error: null,
  brothers: [],
  carts: [],
  locations: [],

  initDB: async () => {
    try {
      const { db, persist } = await initDB()
      const brothers = listAllBrothers(db)
      const carts = listAllCarts(db)
      const locations = listAllLocations(db)
      set({ db, persist, loading: false, brothers, carts, locations })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ── Brothers ──────────────────────────────────────────────
  loadBrothers: () => {
    const { db } = get()
    set({ brothers: listAllBrothers(db) })
  },

  saveBrother: (data) => {
    const { db, persist } = get()
    createBrother(db, persist, data)
    set({ brothers: listAllBrothers(db) })
  },

  updateBrother: (id, data) => {
    const { db, persist } = get()
    updateBrotherQuery(db, persist, id, data)
    set({ brothers: listAllBrothers(db) })
  },

  toggleBrotherActive: (id) => {
    const { db, persist } = get()
    db.run('UPDATE brothers SET active = 1 - active WHERE id = ?', [id])
    persist()
    set({ brothers: listAllBrothers(db) })
  },

  // ── Carts ────────────────────────────────────────────────
  loadCarts: () => {
    const { db } = get()
    set({ carts: listAllCarts(db) })
  },

  saveCart: (data) => {
    const { db, persist } = get()
    createCart(db, persist, data)
    set({ carts: listAllCarts(db) })
  },

  updateCart: (id, data) => {
    const { db, persist } = get()
    updateCartQuery(db, persist, id, data)
    set({ carts: listAllCarts(db) })
  },

  toggleCartActive: (id) => {
    const { db, persist } = get()
    db.run('UPDATE carts SET active = 1 - active WHERE id = ?', [id])
    persist()
    set({ carts: listAllCarts(db) })
  },

  // ── Locations ────────────────────────────────────────────
  loadLocations: () => {
    const { db } = get()
    set({ locations: listAllLocations(db) })
  },

  saveLocation: (data) => {
    const { db, persist } = get()
    createLocation(db, persist, data)
    set({ locations: listAllLocations(db) })
  },

  updateLocation: (id, data) => {
    const { db, persist } = get()
    updateLocationQuery(db, persist, id, data)
    set({ locations: listAllLocations(db) })
  },

  toggleLocationActive: (id) => {
    const { db, persist } = get()
    db.run('UPDATE locations SET active = 1 - active WHERE id = ?', [id])
    persist()
    set({ locations: listAllLocations(db) })
  },
}))

export default useAppStore
