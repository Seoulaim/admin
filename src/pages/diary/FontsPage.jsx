import { useState } from 'react'
import {
  createFont,
  deleteFont,
  getFonts,
  reorderFonts,
  updateFont,
} from '../../api/diary.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Field from '../../components/form/Field.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { moveItem } from '../../lib/arrays.js'
import { isHttpUrl } from '../../lib/validate.js'
import DiaryLayout from './DiaryLayout.jsx'
import FontPreview from './FontPreview.jsx'

const emptyFont = () => ({
  name: {},
  family: '',
  stylesheetUrl: '',
  previewScale: 1,
})

function FontEditor({ font, onSave, onCancel }) {
  const [form, setForm] = useState(font)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function save() {
    const found = {}
    if (!form.name.en?.trim()) found.name = '영어 이름은 꼭 입력해 주세요.'
    if (!form.family.trim()) found.family = 'font-family를 입력해 주세요.'
    if (!isHttpUrl(form.stylesheetUrl)) {
      found.stylesheetUrl = 'https://로 시작하는 CSS 주소를 입력해 주세요.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    if (!(await onSave(form))) setSaving(false)
  }

  return (
    <div className="flex flex-col gap-4 bg-panel/70 px-4 py-5 sm:px-6">
      <Field
        label="CSS 주소"
        required
        htmlFor="stylesheetUrl"
        hint="Google Fonts의 ‘Embed code’에 있는 https://fonts.googleapis.com/css2?family=… 주소. PDF에 폰트가 들어가야 해서 CORS가 허용된 주소여야 해요."
        error={errors.stylesheetUrl}
      >
        <input
          id="stylesheetUrl"
          type="url"
          value={form.stylesheetUrl}
          onChange={(event) => set('stylesheetUrl')(event.target.value.trim())}
          placeholder="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap"
          aria-invalid={Boolean(errors.stylesheetUrl)}
          className={`${inputClass} h-10`}
        />
      </Field>
      <Field
        label="font-family"
        required
        htmlFor="family"
        hint="CSS에 적힌 이름 그대로, 대체 글꼴과 함께. 예: 'Nanum Pen Script', cursive"
        error={errors.family}
      >
        <input
          id="family"
          value={form.family}
          onChange={(event) => set('family')(event.target.value)}
          placeholder="'Nanum Pen Script', cursive"
          aria-invalid={Boolean(errors.family)}
          className={`${inputClass} h-10`}
        />
      </Field>
      <Field
        label="이름"
        required
        hint="편집기 폰트 목록에 보이는 이름"
        error={errors.name}
      >
        <LocalizedInput
          id="fontName"
          required
          columns
          value={form.name}
          onChange={set('name')}
          invalid={Boolean(errors.name)}
          maxLength={20}
        />
      </Field>
      <Field
        label={`미리보기 크기 ×${form.previewScale.toFixed(2)}`}
        hint="폰트마다 같은 크기라도 작거나 커 보여요. 목록에서 비슷해 보이게 맞춰요."
      >
        <input
          type="range"
          min="0.8"
          max="1.4"
          step="0.05"
          value={form.previewScale}
          onChange={(event) => set('previewScale')(Number(event.target.value))}
          className="w-full max-w-xs accent-point-strong"
        />
      </Field>
      {form.family && form.stylesheetUrl && (
        <div className="rounded-lg bg-white p-4">
          <FontPreview
            family={form.family}
            stylesheetUrl={form.stylesheetUrl}
            previewScale={form.previewScale}
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={onCancel} disabled={saving}>
          취소
        </Button>
        <Button size="sm" variant="primary" onClick={save} disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  )
}

// 다이어리 관리 › 폰트: the text tool's fonts (DD05-6), by CSS URL and
// font-family, in the order it lists them. The first one is the default.
function FontsPage() {
  const { data: fonts, error, reload, update } = useFetch(getFonts)
  const { toast, showToast } = useToast()
  const [editing, setEditing] = useState(null) // font id or 'new'
  const [deleting, setDeleting] = useState(null)

  async function save(font) {
    const { id, name, family, stylesheetUrl, previewScale } = font
    const fields = { name, family: family.trim(), stylesheetUrl, previewScale }
    try {
      if (id) {
        await updateFont(id, fields)
        update((list) =>
          list.map((f) => (f.id === id ? { ...f, ...fields } : f)),
        )
      } else {
        const created = await createFont(fields)
        update((list) => [...list, created])
      }
      setEditing(null)
      showToast('저장했어요.')
      return true
    } catch {
      showToast('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  async function move(from, to) {
    const next = moveItem(fonts, from, to)
    update(() => next)
    try {
      await reorderFonts(next.map((f) => f.id))
    } catch {
      showToast('순서를 저장하지 못했어요.')
      reload()
    }
  }

  async function confirmDelete() {
    try {
      await deleteFont(deleting.id)
      update((list) => list.filter((f) => f.id !== deleting.id))
      showToast('삭제했어요.')
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <DiaryLayout
      actions={
        <Button variant="primary" onClick={() => setEditing('new')}>
          폰트 추가
        </Button>
      }
    >
      <main className="flex max-w-5xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted">
          편집기 텍스트 도구(DD05-6)에 이 순서대로 보여요. 맨 위 폰트가
          기본이에요. 상업적 사용과 PDF 삽입이 허용된 폰트인지 확인해 주세요.
        </p>
        <Card className="overflow-hidden">
          {error ? (
            <LoadError onRetry={reload} className="py-20" />
          ) : !fonts ? (
            <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
          ) : (
            <ol className="divide-y divide-border">
              {fonts.map((font, index) => (
                <li key={font.id}>
                  {editing === font.id ? (
                    <FontEditor
                      font={font}
                      onSave={save}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
                      <div className="w-36 shrink-0">
                        <p className="truncate text-sm font-bold">
                          {font.name.ko || font.name.en}
                          {index === 0 && (
                            <span className="ml-1.5 rounded-full bg-point-soft px-1.5 py-0.5 text-[10px] font-bold text-point-strong">
                              기본
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-sub">
                          {font.family}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <FontPreview
                          family={font.family}
                          stylesheetUrl={font.stylesheetUrl}
                          previewScale={font.previewScale}
                        />
                      </div>
                      <MoveButtons
                        index={index}
                        count={fonts.length}
                        onMove={(to) => move(index, to)}
                      />
                      <div className="flex shrink-0 gap-1.5">
                        <Button size="sm" onClick={() => setEditing(font.id)}>
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleting(font)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {editing === 'new' && (
                <li>
                  <FontEditor
                    font={emptyFont()}
                    onSave={save}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              )}
            </ol>
          )}
        </Card>
      </main>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="폰트를 삭제할까요?"
        message="편집기에서 빠지고, 이 폰트로 쓴 글은 기본(맨 위) 폰트로 보여요."
        confirmLabel="삭제"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <Toast toast={toast} />
    </DiaryLayout>
  )
}

export default FontsPage
