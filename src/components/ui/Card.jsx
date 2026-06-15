export default function Card({ children, accent, className = '' }) {
  return (
    <div className={`bg-surface-card rounded-card shadow-card ${className}`}>
      {accent && (
        <div className="h-[3px] rounded-t-card" style={{ backgroundColor: accent }} />
      )}
      {children}
    </div>
  )
}
