import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getGroups } from '../../api/artists.js'
import {
  createBirthdayCafe,
  getBirthdayCafe,
  updateBirthdayCafe,
} from '../../api/events.js'
import Field from '../../components/form/Field.jsx'
import FormCard from '../../components/form/FormCard.jsx'
import ImageInput from '../../components/form/ImageInput.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import PeriodInput from '../../components/form/PeriodInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { todayKey } from '../../lib/dates.js'
import { CAFE_IMAGE } from '../../lib/events.js'
import { isHttpUrl, periodError } from '../../lib/validate.js'

const BACK_TO = '/events?tab=cafes'

const emptyCafe = () => ({
  memberId: '',
  venue: {},
  startDate: todayKey(),
  endDate: '',
  imageUrl: '',
  linkUrl: '',
})

function validate(form) {
  const errors = {}
  if (!form.memberId) errors.memberId = '생일인 멤버를 골라 주세요.'
  if (!form.venue.en?.trim())
    errors.venue = '영어 카페 이름은 꼭 입력해 주세요.'
  const period = periodError(form)
  if (period) errors.period = period
  if (!form.imageUrl) errors.imageUrl = '이미지를 올려 주세요.'
  if (!isHttpUrl(form.linkUrl)) {
    errors.linkUrl = 'https://로 시작하는 주소를 입력해 주세요.'
  }
  return errors
}

// 생일카페 추가 (/events/cafes/new) and edit (/events/cafes/:cafeId/edit).
function CafeFormPage() {
  const { cafeId } = useParams()
  const fetcher = useCallback(
    () =>
      Promise.all([cafeId ? getBirthdayCafe(cafeId) : null, getGroups()]).then(
        ([cafe, groups]) => ({ cafe, groups }),
      ),
    [cafeId],
  )
  const { data, error, reload } = useFetch(fetcher)

  return (
    <>
      <PageHeader
        title={`이벤트 관리 · ${cafeId ? '생일카페 수정' : '생일카페 추가'}`}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <CafeForm
            key={cafeId ?? 'new'}
            initial={data.cafe ?? emptyCafe()}
            groups={data.groups}
          />
        )}
      </main>
    </>
  )
}

function CafeForm({ initial, groups }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [groupId, setGroupId] = useState(
    () =>
      groups.find((g) => g.members.some((m) => m.id === initial.memberId))
        ?.id ?? '',
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))
  const members = groups.find((g) => g.id === groupId)?.members ?? []

  async function save(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const fields = {
      memberId: form.memberId,
      venue: form.venue,
      startDate: form.startDate,
      endDate: form.endDate,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl.trim(),
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      if (initial.id) await updateBirthdayCafe(initial.id, fields)
      else await createBirthdayCafe(fields)
      navigate(BACK_TO, { state: { toast: '저장했어요.' } })
    } catch {
      setSaveFailed(true)
      setSaving(false)
    }
  }

  const select = `${inputClass} h-10 max-w-56`

  return (
    <form onSubmit={save} noValidate className="max-w-3xl">
      <FormCard cancelTo={BACK_TO} saving={saving} saveFailed={saveFailed}>
        <Field
          label="생일인 멤버"
          required
          hint="이 멤버의 그룹을 최애로 고른 회원에게 보여요."
          error={errors.memberId}
        >
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="그룹"
              value={groupId}
              onChange={(event) => {
                setGroupId(event.target.value)
                set('memberId')('')
              }}
              className={select}
            >
              <option value="">그룹 선택</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name.en}
                </option>
              ))}
            </select>
            <select
              aria-label="멤버"
              value={form.memberId}
              onChange={(event) => set('memberId')(event.target.value)}
              disabled={!groupId}
              aria-invalid={Boolean(errors.memberId)}
              className={select}
            >
              <option value="">멤버 선택</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name.en}
                  {member.name.ko && ` (${member.name.ko})`}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="카페 이름" required error={errors.venue}>
          <LocalizedInput
            id="venue"
            required
            value={form.venue}
            onChange={set('venue')}
            invalid={Boolean(errors.venue)}
          />
        </Field>

        <Field label="기간" required error={errors.period}>
          <PeriodInput
            value={form}
            onChange={(period) => setForm((prev) => ({ ...prev, ...period }))}
            invalid={Boolean(errors.period)}
          />
        </Field>

        <Field
          label="이미지"
          required
          htmlFor="imageUrl"
          error={errors.imageUrl}
        >
          <ImageInput
            id="imageUrl"
            value={form.imageUrl}
            onChange={set('imageUrl')}
            aspect={CAFE_IMAGE}
            invalid={Boolean(errors.imageUrl)}
            sizeClass="w-full max-w-xs"
          />
        </Field>

        <Field
          label="카드를 누르면 열 링크"
          required
          htmlFor="linkUrl"
          error={errors.linkUrl}
        >
          <input
            id="linkUrl"
            type="url"
            value={form.linkUrl}
            onChange={(event) => set('linkUrl')(event.target.value)}
            placeholder="https://"
            aria-invalid={Boolean(errors.linkUrl)}
            className={`${inputClass} h-10`}
          />
        </Field>
      </FormCard>
    </form>
  )
}

export default CafeFormPage
