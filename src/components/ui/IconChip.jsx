export default function IconChip({ icon: Icon, color = 'green', size = 40 }) {
  const palette = {
    blue:   { bg: 'bg-accent-blue-soft',   text: 'text-accent-blue' },
    green:  { bg: 'bg-accent-green-soft',  text: 'text-accent-green' },
    purple: { bg: 'bg-accent-purple-soft', text: 'text-accent-purple' },
    orange: { bg: 'bg-accent-orange-soft', text: 'text-accent-orange' },
  }
  const { bg, text } = palette[color] || palette.green
  return (
    <div
      className={`flex items-center justify-center rounded-[10px] ${bg} ${text}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      <Icon size={20} />
    </div>
  )
}
