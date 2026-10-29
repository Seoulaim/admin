import { LANGUAGES } from '../../lib/languages.js'
import { inputClass } from './inputClass.js'

// One input per member app language; value is { en, ko, zh, ja }.
// The app shows English when a language is empty; required: English must
// be filled in.
// multiline: Enter makes a line break, kept in the app. columns: two per
// row on wider screens (for compact rows like members).
function LocalizedInput({
  id,
  value,
  onChange,
  required = false,
  multiline = false,
  columns = false,
  invalid = false,
  maxLength,
}) {
  const Input = multiline ? 'textarea' : 'input'

  return (
    <div
      className={
        columns ? 'grid gap-1.5 sm:grid-cols-2' : 'flex flex-col gap-1.5'
      }
    >
      {LANGUAGES.map((language) => (
        <div key={language.id} className="flex items-start gap-2">
          <label
            htmlFor={`${id}-${language.id}`}
            title={language.name}
            className="mt-2 w-9 shrink-0 rounded-md bg-chip py-0.5 text-center text-[11px] font-bold text-muted"
          >
            {language.label}
          </label>
          <Input
            id={`${id}-${language.id}`}
            value={value[language.id] ?? ''}
            onChange={(event) =>
              onChange({ ...value, [language.id]: event.target.value })
            }
            placeholder={
              language.id !== 'en'
                ? '비우면 영어로 표시'
                : required
                  ? '영어 (필수)'
                  : '영어'
            }
            aria-invalid={language.id === 'en' && invalid}
            maxLength={maxLength}
            rows={multiline ? 2 : undefined}
            className={`${inputClass} ${multiline ? 'resize-y py-2 leading-snug' : 'h-10'}`}
          />
        </div>
      ))}
    </div>
  )
}

export default LocalizedInput
