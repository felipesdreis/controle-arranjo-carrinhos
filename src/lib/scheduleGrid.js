export function getThisMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getPeriodFromTime(time) {
  if (time < '12:00') return 'MANHÃ'
  if (time < '18:00') return 'TARDE'
  return 'NOITE'
}

// Classifica cada célula dia×período: `matches` = turnos que batem com TODOS os filtros (usado);
// `conflicts` = turnos que ocupam o carrinho OU o local filtrado (livre se vazio).
export function buildAvailability(slots, { cartId, locationId }) {
  const cells = {}
  for (const s of slots) {
    const key = `${s.day_of_week}-${getPeriodFromTime(s.start_time)}`
    const cell = (cells[key] ??= { matches: [], conflicts: [] })
    if ((!cartId || s.cart_id === cartId) && (!locationId || s.location_id === locationId)) cell.matches.push(s)
    if ((!cartId && !locationId) || s.cart_id === cartId || s.location_id === locationId) cell.conflicts.push(s)
  }
  return cells
}
