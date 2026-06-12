export function getWeek(db, weekStart) {
  const result = db.exec('SELECT * FROM schedule_weeks WHERE week_start = ?', [weekStart])
  if (!result.length || !result[0].values.length) return null
  const [{ columns, values }] = result
  return Object.fromEntries(columns.map((col, i) => [col, values[0][i]]))
}

export function getActiveSlotsWithLocations(db) {
  const result = db.exec(`
    SELECT s.*, l.name AS location_name, c.name AS cart_name
    FROM slots s
    JOIN locations l ON l.id = s.location_id
    LEFT JOIN carts c ON c.id = s.cart_id
    WHERE s.active = 1 AND l.active = 1
    ORDER BY l.name, s.start_time, s.day_of_week
  `)
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export async function setAssignment(db, persist, weekId, slotId, position, brotherId) {
  if (!brotherId) {
    db.run('DELETE FROM assignments WHERE week_id = ? AND slot_id = ? AND position = ?', [weekId, slotId, position])
  } else {
    db.run(
      `INSERT INTO assignments (week_id, slot_id, brother_id, position) VALUES (?, ?, ?, ?)
       ON CONFLICT(week_id, slot_id, position) DO UPDATE SET brother_id = excluded.brother_id`,
      [weekId, slotId, brotherId, position]
    )
  }
  await persist()
}

export async function clearWeekAssignments(db, persist, weekId) {
  db.run('DELETE FROM assignments WHERE week_id = ?', [weekId])
  await persist()
}

export function listAssignmentsByWeek(db, weekId) {
  const result = db.exec(
    `SELECT a.*, b.name AS brother_name, s.day_of_week, s.start_time, s.end_time,
            l.name AS location_name, c.name AS cart_name
     FROM assignments a
     JOIN brothers b ON b.id = a.brother_id
     JOIN slots s ON s.id = a.slot_id
     JOIN locations l ON l.id = s.location_id
     LEFT JOIN carts c ON c.id = s.cart_id
     WHERE a.week_id = ?
     ORDER BY s.day_of_week, s.start_time, a.position`,
    [weekId]
  )
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

export async function createAssignment(db, persist, { week_id, slot_id, brother_id, position = 1 }) {
  db.run(
    'INSERT INTO assignments (week_id, slot_id, brother_id, position) VALUES (?, ?, ?, ?)',
    [week_id, slot_id, brother_id, position]
  )
  await persist()
}

export async function deleteAssignment(db, persist, id) {
  db.run('DELETE FROM assignments WHERE id = ?', [id])
  await persist()
}

export function getLatestWeekBefore(db, weekStart) {
  const result = db.exec(
    'SELECT * FROM schedule_weeks WHERE week_start < ? ORDER BY week_start DESC LIMIT 1',
    [weekStart]
  )
  if (!result.length || !result[0].values.length) return null
  const [{ columns, values }] = result
  return Object.fromEntries(columns.map((col, i) => [col, values[0][i]]))
}

export async function copyWeekAssignments(db, persist, sourceWeekId, targetWeekId) {
  // Copia apenas designações de slots e irmãos que ainda estão ativos
  db.run(
    `INSERT OR IGNORE INTO assignments (week_id, slot_id, brother_id, position)
     SELECT ?, slot_id, brother_id, position
     FROM assignments
     WHERE week_id = ?
       AND slot_id   IN (SELECT id FROM slots   WHERE active = 1)
       AND brother_id IN (SELECT id FROM brothers WHERE active = 1)`,
    [targetWeekId, sourceWeekId]
  )
  await persist()
}

export async function getOrCreateWeek(db, persist, weekStart) {
  const existing = db.exec(
    'SELECT * FROM schedule_weeks WHERE week_start = ?',
    [weekStart]
  )
  if (existing.length && existing[0].values.length) {
    const [{ columns, values }] = existing
    return Object.fromEntries(columns.map((col, i) => [col, values[0][i]]))
  }
  db.run('INSERT INTO schedule_weeks (week_start) VALUES (?)', [weekStart])
  const result = db.exec(
    'SELECT * FROM schedule_weeks WHERE week_start = ?',
    [weekStart]
  )
  await persist()
  const [{ columns, values }] = result
  return Object.fromEntries(columns.map((col, i) => [col, values[0][i]]))
}
