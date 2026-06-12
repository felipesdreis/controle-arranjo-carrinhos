export function listSlots(db) {
  const result = db.exec(`
    SELECT s.*, l.name AS location_name, c.name AS cart_name
    FROM slots s
    JOIN locations l ON l.id = s.location_id
    LEFT JOIN carts c ON c.id = s.cart_id
    WHERE s.active = 1
    ORDER BY s.day_of_week, s.start_time
  `)
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function createSlot(db, persist, { location_id, cart_id = null, group_id = null, day_of_week, start_time, end_time, capacity = 2 }) {
  db.run(
    'INSERT INTO slots (location_id, cart_id, group_id, day_of_week, start_time, end_time, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [location_id, cart_id, group_id, day_of_week, start_time, end_time, capacity]
  )
  persist()
  const result = db.exec('SELECT last_insert_rowid() AS id')
  return result[0].values[0][0]
}

export function updateSlot(db, persist, id, { location_id, cart_id = null, group_id = null, day_of_week, start_time, end_time, capacity = 2 }) {
  db.run(
    'UPDATE slots SET location_id = ?, cart_id = ?, group_id = ?, day_of_week = ?, start_time = ?, end_time = ?, capacity = ? WHERE id = ?',
    [location_id, cart_id, group_id, day_of_week, start_time, end_time, capacity, id]
  )
  persist()
}

export function deactivateSlot(db, persist, id) {
  db.run('UPDATE slots SET active = 0 WHERE id = ?', [id])
  persist()
}

export function listSlotsByLocation(db, locationId) {
  const result = db.exec(`
    SELECT s.*, c.name AS cart_name
    FROM slots s
    LEFT JOIN carts c ON c.id = s.cart_id
    WHERE s.location_id = ? AND s.active = 1
    ORDER BY s.day_of_week, s.start_time
  `, [locationId])
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function deleteSlot(db, persist, id) {
  db.run('UPDATE slots SET active = 0 WHERE id = ?', [id])
  persist()
}
