import Card from './Card'
import IconChip from './IconChip'

export default function StatCard({ icon, color, value, label, accent }) {
  return (
    <Card accent={accent} className="p-5 flex flex-col gap-3">
      <IconChip icon={icon} color={color} />
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-sm text-ink/60 mt-0.5">{label}</p>
      </div>
    </Card>
  )
}
