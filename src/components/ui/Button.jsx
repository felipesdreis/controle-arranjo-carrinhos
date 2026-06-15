const variants = {
  primary: 'bg-brand text-white hover:bg-brand/90 border-transparent',
  subtle:  'bg-surface-subtle text-ink border-surface-border hover:bg-surface-border',
  ghost:   'bg-transparent text-ink hover:bg-surface-subtle border-transparent',
}

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
