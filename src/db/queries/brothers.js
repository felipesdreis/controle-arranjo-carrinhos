/**
 * Executa todas as queries relacionadas a irmãos.
 * Recebe `db` (instância sql.js) e `persist` (função de salvamento).
 */

export function listAllBrothers(db) {
  const result = db.exec('SELECT * FROM brothers ORDER BY name')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function listBrothers(db) {
  const result = db.exec('SELECT * FROM brothers WHERE active = 1 ORDER BY name')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function createBrother(db, persist, { name, phone = null, notes = null }) {
  db.run(
    'INSERT INTO brothers (name, phone, notes) VALUES (?, ?, ?)',
    [name, phone, notes]
  )
  persist()
}

export function updateBrother(db, persist, id, { name, phone = null, notes = null }) {
  db.run(
    'UPDATE brothers SET name = ?, phone = ?, notes = ? WHERE id = ?',
    [name, phone, notes, id]
  )
  persist()
}

export function deactivateBrother(db, persist, id) {
  db.run('UPDATE brothers SET active = 0 WHERE id = ?', [id])
  persist()
}
