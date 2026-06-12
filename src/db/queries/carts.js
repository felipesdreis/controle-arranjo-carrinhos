export function listAllCarts(db) {
  const result = db.exec('SELECT * FROM carts ORDER BY name')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function listCarts(db) {
  const result = db.exec('SELECT * FROM carts WHERE active = 1 ORDER BY name')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export function createCart(db, persist, { name, description = null }) {
  db.run('INSERT INTO carts (name, description) VALUES (?, ?)', [name, description])
  persist()
}

export function updateCart(db, persist, id, { name, description = null }) {
  db.run('UPDATE carts SET name = ?, description = ? WHERE id = ?', [name, description, id])
  persist()
}

export function deactivateCart(db, persist, id) {
  db.run('UPDATE carts SET active = 0 WHERE id = ?', [id])
  persist()
}
