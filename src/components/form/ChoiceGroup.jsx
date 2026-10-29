// Radio buttons in a row. options: [{ id, label }].
function ChoiceGroup({ name, options, value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option.id}
          className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold has-checked:border-point has-checked:bg-point-soft has-checked:text-point-strong ${disabled ? 'cursor-not-allowed border-border text-sub' : 'cursor-pointer border-border hover:bg-chip'}`}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            disabled={disabled}
            className="accent-point-strong"
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

export default ChoiceGroup
