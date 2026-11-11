import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useBlocker } from 'react-router'
import {
  createPlace,
  deletePlace,
  geocodeAddress,
  setPlaceVisible,
  updatePlace,
} from '../../api/places.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Field from '../../components/form/Field.jsx'
import HoursInput from '../../components/form/HoursInput.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LinkListInput from '../../components/form/LinkListInput.jsx'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import MemberPicker from '../../components/form/MemberPicker.jsx'
import PeriodInput from '../../components/form/PeriodInput.jsx'
import PhotoListInput from '../../components/form/PhotoListInput.jsx'
import PinMap from '../../components/form/PinMap.jsx'
import Switch from '../../components/Switch.jsx'
import { errorText } from '../../lib/errorText.js'
import { LANGUAGES } from '../../lib/languages.js'
import {
  ALWAYS_OPEN,
  DEFAULT_DAY,
  everyDay,
  formatDateWithWeekday,
  hoursError,
  MAX_PHOTOS,
  MAX_VIDEOS,
  operatingError,
  operatingStatus,
  PLACE_PHOTO,
  videoUrlsError,
} from '../../lib/places.js'
import { isHttpUrl } from '../../lib/validate.js'

// Korean first: it's what 좌표 찾기 reads.
const ADDRESS_LANGUAGES = ['ko', 'en', 'zh', 'ja'].map((id) =>
  LANGUAGES.find((l) => l.id === id),
)

const emptyPlace = () => ({
  name: {},
  topic: {},
  address: {},
  lat: null,
  lng: null,
  naverMapUrl: '',
  phone: '',
  website: '',
  videoUrls: [],
  photos: [],
  memberIds: [],
  keywordIds: [],
  operating: { ...ALWAYS_OPEN },
  hours: everyDay(DEFAULT_DAY),
})

const OPERATING_STATE = {
  upcoming: {
    label: '운영 예정',
    tone: 'bg-info-soft text-info',
    detail: (n) => `시작까지 ${n}일`,
  },
  open: {
    label: '운영 중',
    tone: 'bg-ok-soft text-ok',
    detail: (n) => (n === 0 ? '오늘 종료' : `종료까지 ${n}일`),
  },
  ended: { label: '운영 종료', tone: 'bg-chip text-muted', detail: () => null },
}

// 운영 일정: 상시 운영 체크박스 + 기간(시작~종료)과 오늘(한국) 기준 상태.
function OperatingInput({ value, onChange, error }) {
  const status = operatingStatus(value)
  const state = status && OPERATING_STATE[status.state]
  const detail = state?.detail(status.daysLeft)

  return (
    <div className="flex flex-col gap-4">
      <label className="flex w-fit cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={value.always}
          onChange={(event) =>
            onChange({ ...value, always: event.target.checked })
          }
          className="mt-0.5 size-4 accent-point-strong"
        />
        <span>
          <span className="block text-sm font-medium">상시 운영</span>
          <span className="block text-xs text-sub">
            음식점·공연장처럼 끝나는 날이 없는 곳
          </span>
        </span>
      </label>
      <Field
        label="운영 기간"
        required={!value.always}
        error={value.always ? undefined : error}
        hint={
          value.always
            ? '상시 운영 중에는 기간을 정하지 않아요. 체크를 풀면 기간을 입력할 수 있어요.'
            : undefined
        }
      >
        <PeriodInput
          value={value}
          onChange={({ startDate, endDate }) =>
            onChange({ ...value, startDate, endDate })
          }
          invalid={!value.always && Boolean(error)}
          disabled={value.always}
        />
      </Field>
      {!value.always &&
        (status ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border bg-panel px-4 py-3">
            <Chip tone={state.tone}>{state.label}</Chip>
            {detail && <span className="text-sm font-semibold">{detail}</span>}
            <span className="text-sm text-muted tabular-nums">
              {formatDateWithWeekday(value.startDate)} ~{' '}
              {formatDateWithWeekday(value.endDate)} · {status.totalDays}일간
            </span>
          </div>
        ) : (
          (!value.startDate || !value.endDate) && (
            <p className="text-xs text-sub">
              시작일과 종료일을 입력하면 오늘(한국) 기준 운영 상태가 보여요.
            </p>
          )
        ))}
    </div>
  )
}

// Field → message for what has to be fixed before saving.
function validate(form) {
  const errors = {}
  if (!form.name.en?.trim()) errors.name = '영어 장소명은 꼭 입력해 주세요.'
  if (!form.topic.en?.trim()) errors.topic = '영어 주제는 꼭 입력해 주세요.'
  if (!form.address.ko?.trim() || !form.address.en?.trim()) {
    errors.address = '한국어 주소와 영어 주소는 꼭 입력해 주세요.'
  } else if (form.lat == null || form.lng == null) {
    errors.address = '‘좌표 찾기’로 지도 위치를 정해 주세요.'
  }
  const operating = operatingError(form.operating)
  if (operating) errors.operating = operating
  const hours = hoursError(form.hours)
  if (hours) errors.hours = hours
  if (form.photos.length === 0) errors.photos = '사진을 한 장 이상 올려 주세요.'
  if (form.memberIds.length === 0)
    errors.members = '멤버를 한 명 이상 태그해 주세요.'
  const videos = videoUrlsError(form.videoUrls)
  if (videos) errors.videos = videos
  for (const key of ['naverMapUrl', 'website']) {
    if (form[key].trim() && !isHttpUrl(form[key])) {
      errors[key] = 'https://로 시작하는 주소를 입력해 주세요.'
    }
  }
  return errors
}

function Section({ title, hint, children }) {
  return (
    <section className="flex flex-col gap-5 border-t border-border px-5 py-6 first:border-t-0 sm:px-7">
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-sub">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

// Right side of 장소 관리: every field of one place (HT02 list, HT07 detail,
// HT09 map), saved together. initial null: a new place.
function PlaceForm({ initial, groups, keywords, onSaved, onDeleted, onError }) {
  const [form, setForm] = useState(() =>
    structuredClone(
      initial ? { operating: { ...ALWAYS_OPEN }, ...initial } : emptyPlace(),
    ),
  )
  // Unsaved edits: leaving asks first.
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  // null | 'busy' | 'failed' | 'unavailable' | the geocodeAddress result
  const [geocoding, setGeocoding] = useState(null)
  const [visible, setVisible] = useState(initial?.visible ?? true)
  const [visibleBusy, setVisibleBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  // value may be a function of the current value (PhotoListInput uploads).
  const set = (key) => (value) => {
    setDirty(true)
    setForm((prev) => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key]) : value,
    }))
  }

  // Fills the pin (and the English address when it's empty) from the
  // Korean address; geocoded keeps what Naver matched, to show it.
  async function findCoordinates() {
    setGeocoding('busy')
    try {
      const found = await geocodeAddress(form.address.ko ?? '')
      setDirty(true)
      setForm((prev) => ({
        ...prev,
        lat: found.lat,
        lng: found.lng,
        address: prev.address.en?.trim()
          ? prev.address
          : { ...prev.address, en: found.englishAddress },
      }))
      setGeocoding(found)
    } catch (error) {
      setGeocoding(
        error.code === 'GEOCODER_UNAVAILABLE' ? 'unavailable' : 'failed',
      )
    }
  }

  async function save(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const fields = {
      name: form.name,
      topic: form.topic,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      naverMapUrl: form.naverMapUrl.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      videoUrls: form.videoUrls.map((u) => u.trim()),
      photos: form.photos,
      memberIds: form.memberIds,
      keywordIds: form.keywordIds,
      operating: form.operating.always
        ? { ...ALWAYS_OPEN }
        : { ...form.operating },
      hours: form.hours,
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      const place = initial
        ? await updatePlace(initial.id, fields)
        : await createPlace(fields)
      // Re-render without the leave guard before the screen moves on.
      flushSync(() => setDirty(false))
      onSaved(place)
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisible(next) {
    setVisible(next)
    setVisibleBusy(true)
    try {
      await setPlaceVisible(initial.id, next)
      onSaved(
        { ...initial, visible: next },
        next ? '앱에 다시 보여요.' : '새 플랜에서 빠져요.',
      )
    } catch (e) {
      setVisible(!next)
      onError(`노출을 바꾸지 못했어요 (${errorText(e)})`)
    } finally {
      setVisibleBusy(false)
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await deletePlace(initial.id)
      flushSync(() => setDirty(false))
      onDeleted(initial.id)
    } catch {
      setDeleteBusy(false)
      setDeleting(false)
      setSaveFailed(true)
    }
  }

  const toggleKeyword = (id) =>
    set('keywordIds')((ids) =>
      ids.includes(id) ? ids.filter((k) => k !== id) : [...ids, id],
    )

  return (
    <form onSubmit={save} noValidate>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4 sm:px-7">
          <h2 className="min-w-0 flex-1 truncate text-lg font-bold">
            {initial ? initial.name.ko || initial.name.en : '새 장소'}
          </h2>
          {initial && (
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
              앱에 노출
              <Switch
                checked={visible}
                onChange={toggleVisible}
                disabled={visibleBusy}
                label="앱에 노출"
              />
            </label>
          )}
          {initial && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleting(true)}
            >
              삭제
            </Button>
          )}
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
        {saveFailed && (
          <p
            role="alert"
            className="bg-danger/5 px-7 py-2 text-sm font-medium text-danger"
          >
            저장하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        {Object.keys(errors).length > 0 && (
          <p
            role="alert"
            className="bg-danger/5 px-7 py-2 text-sm font-medium text-danger"
          >
            빨간 표시가 있는 항목을 확인해 주세요.
          </p>
        )}

        <Section title="기본 정보">
          <Field label="장소명" required error={errors.name}>
            <LocalizedInput
              id="name"
              required
              columns
              value={form.name}
              onChange={set('name')}
              invalid={Boolean(errors.name)}
            />
          </Field>
          <Field
            label="주제"
            required
            hint="플랜 목록에서 장소 이름 아래 한 줄로 보여요. 예: 니키가 브이로그에서 간 카페"
            error={errors.topic}
          >
            <LocalizedInput
              id="topic"
              required
              value={form.topic}
              onChange={set('topic')}
              invalid={Boolean(errors.topic)}
              maxLength={80}
            />
          </Field>
        </Section>

        <Section
          title="위치"
          hint="한국어 주소로 좌표를 찾아요(네이버 Geocoding). 영어 주소가 비어 있으면 함께 채워져요. 핀이 틀리면 지도에서 끌어서 고치세요."
        >
          <Field label="주소" required error={errors.address}>
            <div className="flex flex-col gap-1.5">
              {ADDRESS_LANGUAGES.map((language) => {
                const required = language.id === 'ko' || language.id === 'en'
                return (
                  <div key={language.id} className="flex items-center gap-2">
                    <label
                      htmlFor={`address-${language.id}`}
                      className="w-9 shrink-0 rounded-md bg-chip py-0.5 text-center text-[11px] font-bold text-muted"
                    >
                      {language.label}
                    </label>
                    <input
                      id={`address-${language.id}`}
                      value={form.address[language.id] ?? ''}
                      onChange={(event) =>
                        set('address')((a) => ({
                          ...a,
                          [language.id]: event.target.value,
                        }))
                      }
                      placeholder={
                        language.id === 'ko'
                          ? '서울 성동구 아차산로 9길 8 (좌표 찾기 기준)'
                          : required
                            ? '영어 (필수)'
                            : '비우면 영어로 표시'
                      }
                      aria-invalid={Boolean(errors.address) && required}
                      className={`${inputClass} h-10`}
                    />
                    {language.id === 'ko' && (
                      <Button
                        onClick={findCoordinates}
                        disabled={
                          geocoding === 'busy' || !form.address.ko?.trim()
                        }
                      >
                        {geocoding === 'busy' ? '찾는 중…' : '좌표 찾기'}
                      </Button>
                    )}
                  </div>
                )
              })}
              {geocoding === 'failed' && (
                <p className="text-xs font-medium text-warn">
                  주소로 좌표를 찾지 못했어요. 도로명 주소로 다시 시도하거나
                  아래에 좌표를 직접 넣어 주세요.
                </p>
              )}
              {geocoding === 'unavailable' && (
                <p className="text-xs font-medium text-warn">
                  네이버 지도를 불러오지 못해 좌표를 찾을 수 없어요. 아래에
                  좌표를 직접 넣어 주세요.
                </p>
              )}
              {geocoding?.roadAddress && (
                <p
                  className={`text-xs ${geocoding.inSeoul ? 'text-sub' : 'font-medium text-warn'}`}
                >
                  네이버에서 찾은 주소: {geocoding.roadAddress}
                  {!geocoding.inSeoul &&
                    ' — 서울이 아니에요. 앱 지도는 서울만 보여줘요.'}
                </p>
              )}
            </div>
          </Field>
          <PinMap
            lat={form.lat}
            lng={form.lng}
            onChange={(lat, lng) => {
              setDirty(true)
              setForm((prev) => ({ ...prev, lat, lng }))
            }}
            className="h-64"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
            {['lat', 'lng'].map((key) => (
              <label
                key={key}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                {key === 'lat' ? '위도' : '경도'}
                <input
                  type="number"
                  step="0.000001"
                  value={form[key] ?? ''}
                  onChange={(event) =>
                    set(key)(
                      event.target.value === ''
                        ? null
                        : Number(event.target.value),
                    )
                  }
                  className={`${inputClass} h-9 w-32 font-normal text-text tabular-nums`}
                />
              </label>
            ))}
          </div>
          <Field
            label="네이버 지도 링크"
            htmlFor="naverMapUrl"
            hint="장소 상세의 ‘네이버 지도에서 보기’. 비우면 장소명으로 검색한 링크가 열려요."
            error={errors.naverMapUrl}
          >
            <input
              id="naverMapUrl"
              type="url"
              value={form.naverMapUrl}
              onChange={(event) => set('naverMapUrl')(event.target.value)}
              placeholder="https://naver.me/…"
              aria-invalid={Boolean(errors.naverMapUrl)}
              className={`${inputClass} h-10`}
            />
          </Field>
        </Section>

        <Section
          title="사진"
          hint={`최대 ${MAX_PHOTOS}장. 끌어서 순서를 바꾸고, 첫 사진이 대표 사진이에요.`}
        >
          <PhotoListInput
            value={form.photos}
            onChange={set('photos')}
            max={MAX_PHOTOS}
            aspect={PLACE_PHOTO}
            uploadDomain="PLACE"
          />
          {errors.photos && (
            <p role="alert" className="-mt-3 text-xs font-medium text-danger">
              {errors.photos}
            </p>
          )}
        </Section>

        <Section
          title="운영 일정"
          hint="생일카페·팝업처럼 기간이 정해진 곳은 상시 운영을 풀고 시작일과 종료일을 입력하세요."
        >
          <OperatingInput
            value={form.operating}
            onChange={set('operating')}
            error={errors.operating}
          />
        </Section>

        <Section
          title="영업시간"
          hint="장소 상세에 ‘영업 중 / 영업 종료’가 지금 시간(한국) 기준으로 보여요."
        >
          <HoursInput
            value={form.hours}
            onChange={set('hours')}
            invalid={Boolean(errors.hours)}
          />
          {errors.hours && (
            <p role="alert" className="-mt-3 text-xs font-medium text-danger">
              {errors.hours}
            </p>
          )}
        </Section>

        <Section title="연락처">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="전화번호" htmlFor="phone">
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => set('phone')(event.target.value)}
                placeholder="02-1234-5678"
                className={`${inputClass} h-10`}
              />
            </Field>
            <Field label="홈페이지" htmlFor="website" error={errors.website}>
              <input
                id="website"
                type="url"
                value={form.website}
                onChange={(event) => set('website')(event.target.value)}
                placeholder="https://"
                aria-invalid={Boolean(errors.website)}
                className={`${inputClass} h-10`}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="자료화면 링크"
          hint="이 장소가 팬덤 플레이스인 근거 영상(유튜브 등). 사용자 앱에 보여줄 곳은 아직 정해지지 않았어요."
        >
          <LinkListInput
            value={form.videoUrls}
            onChange={set('videoUrls')}
            max={MAX_VIDEOS}
            invalid={Boolean(errors.videos)}
          />
          {errors.videos && (
            <p role="alert" className="-mt-3 text-xs font-medium text-danger">
              {errors.videos}
            </p>
          )}
        </Section>

        <Section
          title="멤버 태그"
          hint="여러 그룹·여러 멤버를 태그할 수 있어요. 그룹 전체에 해당해도 멤버를 모두 골라 주세요."
        >
          <MemberPicker
            groups={groups}
            value={form.memberIds}
            onChange={set('memberIds')}
          />
          {errors.members && (
            <p role="alert" className="-mt-3 text-xs font-medium text-danger">
              {errors.members}
            </p>
          )}
        </Section>

        <Section
          title="키워드"
          hint="플랜을 만들 때(HC05) 회원이 고른 키워드와 맞춰요. 목록은 ‘키워드’ 탭에서 관리해요."
        >
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => {
              const on = form.keywordIds.includes(keyword.id)
              return (
                <button
                  key={keyword.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleKeyword(keyword.id)}
                  className={`h-8 rounded-full border px-3 text-[13px] font-semibold ${on ? 'border-point bg-point-soft text-point-strong' : 'border-border text-muted hover:bg-chip'}`}
                >
                  {keyword.name.ko || keyword.name.en}
                </button>
              )
            })}
          </div>
        </Section>
      </Card>

      <ConfirmDialog
        open={deleting}
        title="장소를 삭제할까요?"
        message={
          '삭제하면 이 장소가 들어 있는 회원 여행 플랜에서도 빠지고, 되돌릴 수 없어요.\n새 플랜에서만 빼려면 삭제 대신 ‘앱에 노출’을 끄세요.'
        }
        confirmLabel="삭제"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="저장하지 않고 나갈까요?"
        message="고친 내용이 사라져요."
        confirmLabel="나가기"
        danger
        onConfirm={() => blocker.proceed()}
        onCancel={() => blocker.reset()}
      />
    </form>
  )
}

export default PlaceForm
