import { inputClass } from './inputClass.js'

// Start ~ end date ('YYYY-MM-DD'). value: { startDate, endDate }.
function PeriodInput({ value, onChange, invalid = false, disabled = false }) {
  const input = (key, label) => (
    <input
      type="date"
      aria-label={label}
      value={value[key]}
      min={key === 'endDate' ? value.startDate : undefined}
      onChange={(event) => onChange({ ...value, [key]: event.target.value })}
      aria-invalid={invalid}
      disabled={disabled}
      className={`${inputClass} h-10 max-w-44 disabled:cursor-not-allowed`}
    />
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      {input('startDate', '시작일')}
      <span className="text-sub">~</span>
      {input('endDate', '종료일')}
    </div>
  )
}

export default PeriodInput
