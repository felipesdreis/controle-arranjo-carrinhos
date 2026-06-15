import { createBrother } from './brothers'
import { createCart } from './carts'
import { createLocation } from './locations'
import { createGroup } from './groups'
import { createSlot } from './slots'
import { createScheduleWeek } from './scheduleWeeks'
import { updateCongregationName } from './userSettings'

const KNOWN_KEYS = ['brothers', 'carts', 'locations', 'groups', 'slots', 'schedule_weeks', 'assignments', 'congregation_name']

export function validateImportData(jsonData) {
  if (typeof jsonData !== 'object' || jsonData === null || Array.isArray(jsonData)) {
    throw new Error('Arquivo inválido: o JSON deve ser um objeto.')
  }

  const hasRequiredKey = ['brothers', 'carts', 'locations'].some(
    (key) => key in jsonData
  )
  if (!hasRequiredKey) {
    throw new Error(
      'Arquivo inválido: o JSON deve conter pelo menos uma das chaves "brothers", "carts" ou "locations".'
    )
  }

  for (const key of ['brothers', 'carts', 'locations', 'groups', 'slots', 'schedule_weeks', 'assignments']) {
    if (key in jsonData && jsonData[key] !== null && !Array.isArray(jsonData[key])) {
      throw new Error(`Arquivo inválido: o campo "${key}" deve ser um array ou null.`)
    }
  }
}

export async function importDataFromJSON(jsonData) {
  validateImportData(jsonData)

  const counts = {}

  // Helper: roda allSettled sobre um array e conta sucessos
  async function insertAll(items, insertFn, entityKey) {
    if (!Array.isArray(items) || items.length === 0) {
      counts[entityKey] = 0
      return
    }
    const results = await Promise.allSettled(items.map(insertFn))
    counts[entityKey] = results.filter((r) => r.status === 'fulfilled').length
  }

  // Brothers — apenas name
  await insertAll(
    jsonData.brothers,
    (item) => createBrother(item.name),
    'brothers'
  )

  // Carts — apenas name (description não existe em createCart)
  await insertAll(
    jsonData.carts,
    (item) => createCart(item.name),
    'carts'
  )

  // Locations — apenas name
  await insertAll(
    jsonData.locations,
    (item) => createLocation(item.name),
    'locations'
  )

  // Groups — apenas name (responsible_id ignorado: UUID do banco antigo)
  await insertAll(
    jsonData.groups,
    (item) => createGroup(item.name),
    'groups'
  )

  // Slots — day_of_week, start_time, end_time, capacity (FKs ignoradas)
  await insertAll(
    jsonData.slots,
    (item) => createSlot({
      day_of_week: item.day_of_week,
      start_time:  item.start_time,
      end_time:    item.end_time,
      capacity:    item.capacity,
    }),
    'slots'
  )

  // ScheduleWeeks — week_start, notes
  await insertAll(
    jsonData.schedule_weeks,
    (item) => createScheduleWeek(item.week_start, item.notes ?? null),
    'schedule_weeks'
  )

  // Assignments — NÃO importar (UUIDs incompatíveis)
  counts.assignments = 0

  // CongregationName
  if (jsonData.congregation_name != null) {
    try {
      await updateCongregationName(jsonData.congregation_name)
      counts.congregation_name = 1
    } catch {
      counts.congregation_name = 0
    }
  } else {
    counts.congregation_name = 0
  }

  return { success: true, counts }
}
