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
