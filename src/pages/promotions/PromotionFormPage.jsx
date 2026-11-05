import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  createPromotion,
  getPromotion,
  updatePromotion,
} from '../../api/promotions.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import ChoiceGroup from '../../components/form/ChoiceGroup.jsx'
import Field from '../../components/form/Field.jsx'
import ImageInput from '../../components/form/ImageInput.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { todayKey } from '../../lib/dates.js'
import { isHttpUrl } from '../../lib/validate.js'
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  PLACEMENTS,
  TARGET_TYPES,
} from '../../lib/promotions.js'
import PromotionPreview from './PromotionPreview.jsx'

const ASPECT = { width: BANNER_WIDTH, height: BANNER_HEIGHT }

function emptyPromotion(placement) {
  return {
    placement,
    adminTitle: '',
    imageUrl: '',
    title: {},
    description: {},
    ctaLabel: {},
    targetType: 'DIARY',
    targetUrl: '',
    startDate: todayKey(),
    endDate: '',
    isDefault: false,
  }
}

// Field → message for what has to be fixed before saving.
function validate(form) {
  const errors = {}
  if (!form.adminTitle.trim())
    errors.adminTitle = '관리자용 제목을 입력해 주세요.'
  if (!form.imageUrl) errors.imageUrl = '배너 이미지를 올려 주세요.'
  if (!form.title.en?.trim()) errors.title = '영어 제목은 꼭 입력해 주세요.'
  if (form.targetType === 'URL' && !isHttpUrl(form.targetUrl)) {
    errors.targetUrl = 'https://로 시작하는 주소를 입력해 주세요.'
  }
  if (!form.isDefault) {
    if (!form.startDate || !form.endDate) {
      errors.period = '게시 시작일과 종료일을 입력해 주세요.'
    } else if (form.endDate < form.startDate) {
      errors.period = '종료일이 시작일보다 빨라요.'
    }
  }
  return errors
}

// "새 프로모션 추가" (/promotions/new?placement=HOME) and its edit form
// (/promotions/:id/edit), same screen.
function PromotionFormPage() {
  const { promotionId } = useParams()
  const fetcher = useCallback(
    () => (promotionId ? getPromotion(promotionId) : Promise.resolve(null)),
    [promotionId],
  )
  const { data, error, reload } = useFetch(fetcher)
  const [searchParams] = useSearchParams()
  const placement =
    PLACEMENTS.find((p) => p.id === searchParams.get('placement'))?.id ?? 'HOME'

  return (
    <>
      <PageHeader title={promotionId ? '프로모션 수정' : '새 프로모션 추가'} />
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : data === undefined ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <PromotionForm
            key={promotionId ?? 'new'}
            initial={
              data
                ? {
                    ...data,
                    startDate: data.startDate ?? '',
                    endDate: data.endDate ?? '',
                  }
                : emptyPromotion(placement)
            }
          />
        )}
      </main>
    </>
  )
}

function PromotionForm({ initial }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const editing = Boolean(initial.id)
  const diary = form.placement === 'DIARY'
  const listUrl = `/promotions?tab=${form.placement}`

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function save(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const fields = {
      placement: form.placement,
      adminTitle: form.adminTitle.trim(),
      imageUrl: form.imageUrl,
      title: form.title,
      description: form.description,
      ctaLabel: diary ? form.ctaLabel : {},
      targetType: form.targetType,
      targetUrl: form.targetType === 'URL' ? form.targetUrl.trim() : '',
      startDate: form.isDefault ? null : form.startDate,
      endDate: form.isDefault ? null : form.endDate,
      ...(!editing && { isDefault: form.isDefault }),
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      if (editing) await updatePromotion(initial.id, fields)
      else await createPromotion(fields)
      navigate(listUrl, { state: { toast: '저장했어요.' } })
    } catch {
      setSaveFailed(true)
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={save}
      noValidate
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_425px]"
    >
      <Card className="flex flex-col">
        <div className="flex flex-col gap-7 p-5 sm:p-8">
          <Field
            label="노출 위치"
            required
            hint={
              editing ? '등록한 뒤에는 노출 위치를 바꿀 수 없어요.' : undefined
            }
          >
            <ChoiceGroup
              name="placement"
              options={PLACEMENTS.map((p) => ({
                id: p.id,
                label: `${p.label} · ${p.screen}`,
              }))}
              value={form.placement}
              onChange={set('placement')}
              disabled={editing}
            />
          </Field>

          <Field
            label="관리자용 제목"
            required
            htmlFor="adminTitle"
            hint="목록에서만 보여요. 앱에는 나오지 않아요."
            error={errors.adminTitle}
          >
            <input
              id="adminTitle"
              value={form.adminTitle}
              onChange={(event) => set('adminTitle')(event.target.value)}
              maxLength={50}
              aria-invalid={Boolean(errors.adminTitle)}
              className={`${inputClass} h-10`}
            />
          </Field>

          <Field
            label="배너 이미지"
            required
            htmlFor="imageUrl"
            error={errors.imageUrl}
          >
            <ImageInput
              id="imageUrl"
              value={form.imageUrl}
              onChange={set('imageUrl')}
              aspect={ASPECT}
              uploadDomain="CONTENT"
              invalid={Boolean(errors.imageUrl)}
            />
          </Field>

          <Field
            label="제목"
            required
            hint={diary ? 'Enter로 줄을 바꿀 수 있어요.' : '한 줄로 보여요.'}
            error={errors.title}
          >
            <LocalizedInput
              id="title"
              required
              value={form.title}
              onChange={set('title')}
              multiline={diary}
              invalid={Boolean(errors.title)}
            />
          </Field>

          <Field
            label="설명"
            hint={diary ? 'Enter로 줄을 바꿀 수 있어요.' : '한 줄로 보여요.'}
          >
            <LocalizedInput
              id="description"
              value={form.description}
              onChange={set('description')}
              multiline={diary}
            />
          </Field>

          {diary && (
            <Field label="버튼 문구" hint="비우면 버튼이 보이지 않아요.">
              <LocalizedInput
                id="ctaLabel"
                value={form.ctaLabel}
                onChange={set('ctaLabel')}
                maxLength={20}
              />
            </Field>
          )}

          <Field label="배너를 누르면" required error={errors.targetUrl}>
            <ChoiceGroup
              name="targetType"
              options={TARGET_TYPES}
              value={form.targetType}
              onChange={set('targetType')}
            />
            {form.targetType === 'URL' && (
              <input
                type="url"
                aria-label="링크 주소"
                value={form.targetUrl}
                onChange={(event) => set('targetUrl')(event.target.value)}
                placeholder="https://"
                aria-invalid={Boolean(errors.targetUrl)}
                className={`${inputClass} h-10`}
              />
            )}
          </Field>

          {!editing && (
            <label className="-mb-3 flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => set('isDefault')(event.target.checked)}
                className="size-4 accent-point-strong"
              />
              이 배너를 기본 배너로 설정
            </label>
          )}

          <Field
            label="게시 기간"
            required={!form.isDefault}
            error={form.isDefault ? undefined : errors.period}
          >
            {editing && form.isDefault ? (
              <p className="text-sm text-muted">
                기본 배너는 기간 없이 항상 게시돼요.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    aria-label="게시 시작일"
                    value={form.startDate}
                    disabled={form.isDefault}
                    onChange={(event) => set('startDate')(event.target.value)}
                    aria-invalid={Boolean(errors.period)}
                    className={`${inputClass} h-10 max-w-44`}
                  />
                  <span className="text-sub">~</span>
                  <input
                    type="date"
                    aria-label="게시 종료일"
                    value={form.endDate}
                    disabled={form.isDefault}
                    min={form.startDate}
                    onChange={(event) => set('endDate')(event.target.value)}
                    aria-invalid={Boolean(errors.period)}
                    className={`${inputClass} h-10 max-w-44`}
                  />
                </div>
                {form.isDefault ? (
                  <p className="text-xs text-sub">
                    기본 배너는 기간 없이 항상 게시돼요. 지금 기본 배너는 켜진
                    일반 배너로 남아요.
                  </p>
                ) : (
                  !errors.period && (
                    <p className="text-xs text-sub">
                      한국 시간 기준, 종료일 23:59까지 게시되고 그 뒤에는
                      자동으로 내려가요.
                    </p>
                  )
                )}
              </>
            )}
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-8">
          {saveFailed && (
            <p role="alert" className="mr-auto text-sm font-medium text-danger">
              저장하지 못했어요. 다시 시도해 주세요.
            </p>
          )}
          <Link to={listUrl} className={buttonClass()}>
            취소
          </Link>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
      </Card>

      <PromotionPreview promotion={form} />
    </form>
  )
}

export default PromotionFormPage
