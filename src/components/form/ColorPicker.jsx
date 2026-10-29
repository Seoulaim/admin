import { TAG_COLORS } from '../../lib/events.js'

// Fan calendar tag color, shown as the member app draws it.
function ColorPicker({ value, onChange, sample }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {TAG_COLORS.map((color) => (
        <label
          key={color.id}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm font-semibold text-muted has-checked:border-point has-checked:text-text"
        >
          <input
            type="radio"
            name="tag-color"
            checked={value === color.id}
            onChange={() => onChange(color.id)}
            className="sr-only"
          />
          <span
            className={`max-w-28 truncate rounded-[3px] px-1.5 py-0.5 text-xs text-text ${color.className}`}
          >
            {sample || color.label}
          </span>
        </label>
      ))}
    </div>
  )
}

export default ColorPicker
