import { useCallback, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { getGroups } from '../../api/artists.js'
import {
  createCalendarEntry,
  getCalendarEntry,
  updateCalendarEntry,
} from '../../api/events.js'
import ColorPicker from '../../components/form/ColorPicker.jsx'
import Field from '../../components/form/Field.jsx'
import FormCard from '../../components/form/FormCard.jsx'
import GroupPicker from '../../components/form/GroupPicker.jsx'
import ImageInput from '../../components/form/ImageInput.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import PeriodInput from '../../components/form/PeriodInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Switch from '../../components/Switch.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { todayKey } from '../../lib/dates.js'
import { EVENT_IMAGE, pickText, TAG_COLORS } from '../../lib/events.js'
import { isHttpUrl, periodError } from '../../lib/validate.js'

const DEFAULT_COLOR = TAG_COLORS[0].id

// New entries are on the fan calendar by default (an event too; its switch
// can turn it off).
function emptyEntry(date) {
  return {
    groupIds: [],
    title: {},
    startDate: date ?? todayKey(),
    endDate: '',
    inCalendar: true,
    color: DEFAULT_COLOR,
    imageUrl: '',
    venue: {},
    targetUrl: '',
  }
}

function validate(form, isEventForm) {
  const errors = {}
  if (form.groupIds.length === 0) {
    errors.groupIds = '그룹을 하나 이상 고르거나 ALL을 선택해 주세요.'
  }
  if (!form.title.en?.trim()) errors.title = '영어 제목은 꼭 입력해 주세요.'
  if (!isEventForm && !form.startDate) errors.date = '날짜를 입력해 주세요.'
  if (form.inCalendar && !form.color) errors.color = '태그 색을 골라 주세요.'
  // The Event coming up card's fields: with a photo, or always in the
  // event form.
  if (form.imageUrl || isEventForm) {
    const period = periodError(form)
    if (period) {
      errors.period =
        !isEventForm && !form.endDate ? '종료일을 입력해 주세요.' : period
    }
    if (!form.imageUrl) errors.imageUrl = '사진을 올려 주세요.'
    if (!form.venue.en?.trim()) errors.venue = '영어 장소는 꼭 입력해 주세요.'
    if (!isHttpUrl(form.targetUrl)) {
      errors.targetUrl = 'https://로 시작하는 주소를 입력해 주세요.'
    }
  }
  return errors
}

function toFields(form) {
  const fields = {
    groupIds: form.groupIds,
    title: form.title,
    startDate: form.startDate,
    inCalendar: form.inCalendar,
    color: form.inCalendar ? form.color : null,
  }
  if (!form.imageUrl) {
    return { ...fields, endDate: null, imageUrl: '', venue: {}, targetUrl: '' }
  }
  return {
    ...fields,
    endDate: form.endDate,
    imageUrl: form.imageUrl,
    venue: form.venue,
    targetUrl: form.targetUrl.trim(),
  }
}

// 일정 추가 from the calendar (/events/new?date=…): on the fan calendar, and
// also an Event coming up card when it has a photo. 이벤트 추가 from the
// Event coming up tab (/events/new?only=event): the card (period, photo,
// venue, link), with a 팬캘린더에도 표시 switch (on for a new event).
// Edit: /events/:entryId/edit — the event form with ?only=event (the
// Event coming up tab's edit link) or for an entry not on the calendar,
// otherwise the calendar form.
function EntryFormPage() {
  const { entryId } = useParams()
  const fetcher = useCallback(
    () =>
      Promise.all([
        entryId ? getCalendarEntry(entryId) : null,
        getGroups(),
      ]).then(([entry, groups]) => ({ entry, groups })),
    [entryId],
  )
  const { data, error, reload } = useFetch(fetcher)
  const [searchParams] = useSearchParams()
  const isEventForm =
    searchParams.get('only') === 'event' ||
    (data?.entry ? !data.entry.inCalendar : false)
  const title = `${isEventForm ? '이벤트' : '일정'} ${entryId ? '수정' : '추가'}`

  return (
    <>
      <PageHeader title={`이벤트 관리 · ${title}`} />
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <EntryForm
            key={entryId ?? 'new'}
            initial={{
              ...emptyEntry(searchParams.get('date')),
              ...data.entry,
              endDate: data.entry?.endDate ?? '',
              // Off-calendar entries have no color; the default is only
              // preselected for when the switch is turned on.
              color: data.entry?.color ?? DEFAULT_COLOR,
            }}
            isEventForm={isEventForm}
            groups={data.groups}
          />
        )}
      </main>
    </>
  )
}

function EntryForm({ initial, isEventForm, groups }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))
  const backTo = isEventForm
    ? '/events?tab=events'
    : `/events?date=${form.startDate || todayKey()}`

  async function save(event) {
    event.preventDefault()
    const found = validate(form, isEventForm)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSaveFailed(false)
    try {
      if (initial.id) await updateCalendarEntry(initial.id, toFields(form))
      else await createCalendarEntry(toFields(form))
      navigate(backTo, { state: { toast: '저장했어요.' } })
    } catch {
      setSaveFailed(true)
      setSaving(false)
    }
  }

  // The Event coming up card's own fields (period end, venue, link).
  const cardFields = (
    <>
      <Field label="장소" required error={errors.venue}>
        <LocalizedInput
          id="venue"
          required
          value={form.venue}
          onChange={set('venue')}
          invalid={Boolean(errors.venue)}
        />
      </Field>
      <Field
        label="카드를 누르면 열 링크"
        required
        htmlFor="targetUrl"
        error={errors.targetUrl}
      >
        <input
          id="targetUrl"
          type="url"
          value={form.targetUrl}
          onChange={(event) => set('targetUrl')(event.target.value)}
          placeholder="https://"
          aria-invalid={Boolean(errors.targetUrl)}
          className={`${inputClass} h-10`}
        />
      </Field>
    </>
  )

  return (
    <form onSubmit={save} noValidate className="max-w-3xl">
      <FormCard cancelTo={backTo} saving={saving} saveFailed={saveFailed}>
        <p className="-mb-2 rounded-lg bg-panel px-4 py-3 text-sm text-muted">
          {!isEventForm
            ? '팬캘린더에 보여요. 사진을 넣으면 Event coming up에도 보여요 (달력에는 사진이 나오지 않아요).'
            : form.inCalendar
              ? 'Event coming up 카드와 팬캘린더(시작일)에 보여요. 달력에는 사진이 나오지 않아요.'
              : 'Event coming up 카드로만 보여요. 팬캘린더에는 나오지 않아요.'}
        </p>

        <Field
          label="그룹"
          required
          hint="최애가 이 그룹에 있는 회원에게 보여요. ALL은 모두에게 보여요."
          error={errors.groupIds}
        >
          <GroupPicker
            groups={groups}
            value={form.groupIds}
            onChange={set('groupIds')}
            invalid={Boolean(errors.groupIds)}
          />
        </Field>

        <Field label="제목" required error={errors.title}>
          <LocalizedInput
            id="title"
            required
            value={form.title}
            onChange={set('title')}
            invalid={Boolean(errors.title)}
          />
        </Field>

        {!isEventForm ? (
          <>
            <Field label="날짜" required htmlFor="date" error={errors.date}>
              <input
                id="date"
                type="date"
                value={form.startDate}
                onChange={(event) => set('startDate')(event.target.value)}
                aria-invalid={Boolean(errors.date)}
                className={`${inputClass} h-10 max-w-44`}
              />
            </Field>
            <Field label="태그 색" required error={errors.color}>
              <ColorPicker
                value={form.color}
                onChange={set('color')}
                sample={pickText(form.title)}
              />
            </Field>
            <Field
              label="사진"
              htmlFor="imageUrl"
              hint="선택이에요. 넣으면 Event coming up 카드에도 보여요."
              error={errors.imageUrl}
            >
              <ImageInput
                id="imageUrl"
                value={form.imageUrl}
                onChange={set('imageUrl')}
                aspect={EVENT_IMAGE}
                uploadDomain="CONTENT"
                sizeClass="w-full max-w-40"
              />
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => set('imageUrl')('')}
                  className="w-fit text-xs font-semibold text-muted underline underline-offset-2"
                >
                  사진 빼기 (팬캘린더에만 표시)
                </button>
              )}
            </Field>
            {form.imageUrl && (
              <section className="flex flex-col gap-7 rounded-xl border border-info/30 bg-info-soft/40 p-5">
                <h3 className="text-sm font-bold text-info">
                  Event coming up 카드
                </h3>
                <Field
                  label="종료일"
                  required
                  htmlFor="endDate"
                  hint="시작일은 위의 날짜예요. 카드에 기간으로 보여요."
                  error={errors.period}
                >
                  <input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(event) => set('endDate')(event.target.value)}
                    aria-invalid={Boolean(errors.period)}
                    className={`${inputClass} h-10 max-w-44`}
                  />
                </Field>
                {cardFields}
              </section>
            )}
          </>
        ) : (
          <>
            <Field label="기간" required error={errors.period}>
              <PeriodInput
                value={form}
                onChange={(period) =>
                  setForm((prev) => ({ ...prev, ...period }))
                }
                invalid={Boolean(errors.period)}
              />
            </Field>
            <Field
              label="사진"
              required
              htmlFor="imageUrl"
              error={errors.imageUrl}
            >
              <ImageInput
                id="imageUrl"
                value={form.imageUrl}
                onChange={set('imageUrl')}
                aspect={EVENT_IMAGE}
                uploadDomain="CONTENT"
                invalid={Boolean(errors.imageUrl)}
                sizeClass="w-full max-w-40"
              />
            </Field>
            {cardFields}
            <Field label="팬캘린더에도 표시" error={errors.color}>
              <div className="flex items-center gap-2.5 text-sm text-muted">
                <Switch
                  checked={form.inCalendar}
                  onChange={set('inCalendar')}
                  label="팬캘린더에도 표시"
                />
                {form.inCalendar
                  ? '시작일에 팬캘린더 태그로 보여요. 태그 색을 골라 주세요.'
                  : '팬캘린더에는 나오지 않아요.'}
              </div>
              {form.inCalendar && (
                <ColorPicker
                  value={form.color}
                  onChange={set('color')}
                  sample={pickText(form.title)}
                />
              )}
            </Field>
          </>
        )}
      </FormCard>
    </form>
  )
}

export default EntryFormPage
