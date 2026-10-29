import { useState } from 'react'
import { uploadImage } from '../../api/uploads.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Dialog from '../../components/Dialog.jsx'
import Field from '../../components/form/Field.jsx'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import { checkStickerFile, STICKER_TYPES } from '../../lib/stickerFile.js'
import { CHECKERBOARD } from './stickers.js'

// Editing one sticker: names, categories, its file; or deleting it.
function StickerDialog({ sticker, categories, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(sticker)
  const [invalid, setInvalid] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fileNote, setFileNote] = useState(null)

  async function replace(file) {
    if (!file) return
    const check = await checkStickerFile(file)
    if (!check.ok) return setFileNote(check.warnings)
    setBusy(true)
    try {
      const image = await uploadImage(file)
      setForm((prev) => ({ ...prev, imageUrl: image.url }))
      setFileNote(check.warnings)
    } catch {
      setFileNote(['올리지 못했어요. 다시 시도해 주세요.'])
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!form.name.en?.trim()) return setInvalid(true)
    setBusy(true)
    if (!(await onSave(form))) setBusy(false)
  }

  const toggle = (id) =>
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }))

  return (
    <Dialog
      open
      title="스티커 수정"
      onClose={onClose}
      footer={
        <>
          <Button variant="danger" className="mr-auto" onClick={onDelete}>
            삭제
          </Button>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-end gap-3">
          <div
            className={`flex size-32 shrink-0 items-center justify-center rounded-xl border border-border p-2 ${CHECKERBOARD}`}
          >
            <img src={form.imageUrl} alt="" className="max-h-full max-w-full" />
          </div>
          <label className={`${buttonClass('outline', 'sm')} cursor-pointer`}>
            파일 바꾸기
            <input
              type="file"
              accept={STICKER_TYPES}
              className="hidden"
              onChange={(event) => {
                replace(event.target.files[0])
                event.target.value = ''
              }}
            />
          </label>
        </div>
        {fileNote?.map((note) => (
          <p key={note} className="-mt-3 text-xs font-medium text-warn">
            {note}
          </p>
        ))}
        <Field
          label="이름"
          required
          hint="앱에서는 화면 낭독기용으로만 쓰여요."
        >
          <LocalizedInput
            id="stickerName"
            required
            columns
            value={form.name}
            onChange={(name) => setForm((prev) => ({ ...prev, name }))}
            invalid={invalid}
          />
        </Field>
        <Field label="카테고리" hint="여러 개 고를 수 있어요.">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => {
              const on = form.categoryIds.includes(category.id)
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(category.id)}
                  className={`h-8 rounded-full border px-3 text-[13px] font-semibold ${on ? 'border-point bg-point-soft text-point-strong' : 'border-border text-muted hover:bg-chip'}`}
                >
                  {category.name.ko || category.name.en}
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </Dialog>
  )
}

export default StickerDialog
