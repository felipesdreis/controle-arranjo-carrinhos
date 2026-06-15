import { getBrothers } from './brothers'
import { getCarts } from './carts'
import { getLocations } from './locations'
import { getGroups } from './groups'
import { getSlots } from './slots'
import { getScheduleWeeks } from './scheduleWeeks'
import { getAssignments } from './assignments'
import { getCongregationName } from './userSettings'

export async function exportAllData() {
  const [
    brothersResult,
    cartsResult,
    locationsResult,
    groupsResult,
    slotsResult,
    scheduleWeeksResult,
    assignmentsResult,
    congregationNameResult,
  ] = await Promise.allSettled([
    getBrothers(),
    getCarts(),
    getLocations(),
    getGroups(),
    getSlots(),
    getScheduleWeeks(),
    getAssignments(),
    getCongregationName(),
  ])

  return {
    exported_at: new Date().toISOString(),
    version: '1.0',
    brothers:          brothersResult.status === 'fulfilled'          ? brothersResult.value          : null,
    carts:             cartsResult.status === 'fulfilled'             ? cartsResult.value             : null,
    locations:         locationsResult.status === 'fulfilled'         ? locationsResult.value         : null,
    groups:            groupsResult.status === 'fulfilled'            ? groupsResult.value            : null,
    slots:             slotsResult.status === 'fulfilled'             ? slotsResult.value             : null,
    schedule_weeks:    scheduleWeeksResult.status === 'fulfilled'     ? scheduleWeeksResult.value     : null,
    assignments:       assignmentsResult.status === 'fulfilled'       ? assignmentsResult.value       : null,
    congregation_name: congregationNameResult.status === 'fulfilled'  ? congregationNameResult.value  : null,
  }
}

export function downloadJSON(data, filename = 'backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
