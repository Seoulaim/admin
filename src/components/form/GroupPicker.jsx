import { ALL_GROUPS } from '../../lib/events.js'

// Groups an entry is about: one or more groups, or "all" (everyone) alone.
function GroupPicker({ groups, value, onChange, invalid = false }) {
  const isAll = value.includes(ALL_GROUPS)

  function toggle(id) {
    if (id === ALL_GROUPS) return onChange(isAll ? [] : [ALL_GROUPS])
    const without = value.filter((v) => v !== ALL_GROUPS && v !== id)
    onChange(value.includes(id) ? without : [...without, id])
  }

  const chip = (id, label, checked) => (
    <button
      key={id}
      type="button"
      aria-pressed={checked}
      onClick={() => toggle(id)}
      className={`h-9 rounded-full border px-3.5 text-sm font-semibold ${checked ? 'border-point bg-point-soft text-point-strong' : invalid ? 'border-danger/60 text-muted hover:bg-chip' : 'border-border text-muted hover:bg-chip'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap gap-2">
      {chip(ALL_GROUPS, 'ALL · 모두에게', isAll)}
      <span className="mx-1 w-px self-stretch bg-border" />
      {groups.map((group) =>
        chip(group.id, group.name.en, value.includes(group.id)),
      )}
    </div>
  )
}

export default GroupPicker
