export function listAllLocations(db) {
  const result = db.exec('SELECT * FROM locations ORDER BY name')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function listLocations(db) {
  const result = db.exec('SELECT * FROM locations WHERE active = 1 ORDER BY name')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function createLocation(db, persist, { name, address = null, notes = null }) {
  db.run(
    'INSERT INTO locations (name, address, notes) VALUES (?, ?, ?)',
    [name, address, notes]
  )
  persist()
}

export function updateLocation(db, persist, id, { name, address = null, notes = null }) {
  db.run(
    'UPDATE locations SET name = ?, address = ?, notes = ? WHERE id = ?',
    [name, address, notes, id]
  )
  persist()
}

export function deactivateLocation(db, persist, id) {
  db.run('UPDATE locations SET active = 0 WHERE id = ?', [id])
  persist()
}
