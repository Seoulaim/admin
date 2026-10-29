// Small rounded label (status, type). tone: Tailwind color classes.
function Chip({ tone = 'bg-chip text-muted', className = '', children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tone} ${className}`}
    >
      {children}
    </span>
  )
}

export default Chip
