export default function Badge({ active }) {
  return active ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-green-soft text-accent-green">
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-subtle text-ink/50">
      Inativo
    </span>
  )
}
