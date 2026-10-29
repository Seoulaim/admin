import Card from '../../components/Card.jsx'

// highlight: something is waiting for the admin (pink number).
function StatCard({ label, value, note, highlight = false }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <h2 className="text-sm font-medium text-muted">{label}</h2>
      <p
        className={`text-[28px] leading-tight font-bold tabular-nums ${highlight ? 'text-point-strong' : ''}`}
      >
        {value}
      </p>
      <p className="truncate text-xs text-sub [&_a]:font-semibold [&_a]:text-muted [&_a:hover]:text-text">
        {note}
      </p>
    </Card>
  )
}

export default StatCard
