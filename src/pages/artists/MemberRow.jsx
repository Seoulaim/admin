import Button from '../../components/Button.jsx'
import ImageInput from '../../components/form/ImageInput.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import { PHOTO_ASPECT } from '../../lib/artists.js'

// One member in the group form: photo, names, birthday. Drag or ↑↓ to
// change the order the app lists members in.
function MemberRow({
  member,
  index,
  count,
  onChange,
  onMove,
  onRemove,
  drag,
  invalid,
}) {
  const set = (key) => (value) => onChange({ ...member, [key]: value })
  const id = `member-${member.key}`
  // Only the handle starts a drag, so text in the inputs stays selectable.
  const { draggable, onDragStart, onDragEnd, ...dropTarget } = drag

  return (
    <li
      {...dropTarget}
      className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 sm:flex-row"
    >
      <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-center">
        <span
          aria-hidden="true"
          draggable={draggable}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          title="끌어서 순서 바꾸기"
          className="cursor-grab text-sm font-bold text-sub tabular-nums active:cursor-grabbing"
        >
          ⋮⋮ {index + 1}
        </span>
        <ImageInput
          id={`${id}-photo`}
          value={member.imageUrl}
          onChange={set('imageUrl')}
          aspect={PHOTO_ASPECT}
          sizeClass="w-24"
          compact
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-muted">
            이름<span className="ml-0.5 text-point-strong">*</span>
          </p>
          <LocalizedInput
            id={`${id}-name`}
            required
            columns
            value={member.name}
            onChange={set('name')}
            invalid={invalid}
          />
          {invalid && (
            <p role="alert" className="text-xs font-medium text-danger">
              영어 이름은 꼭 입력해 주세요.
            </p>
          )}
        </div>
        <label className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          생일
          <input
            type="date"
            value={member.birthDate ?? ''}
            onChange={(event) => set('birthDate')(event.target.value || null)}
            className={`${inputClass} h-9 max-w-44 font-normal text-text`}
          />
        </label>
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
        <MoveButtons index={index} count={count} onMove={onMove} />
        <Button size="sm" variant="danger" onClick={onRemove}>
          빼기
        </Button>
      </div>
    </li>
  )
}

export default MemberRow
