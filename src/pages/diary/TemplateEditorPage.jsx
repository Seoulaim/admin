import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useBlocker, useNavigate, useParams } from 'react-router'
import { createTemplate, getTemplate, updateTemplate } from '../../api/diary.js'
import { uploadImage } from '../../api/uploads.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Field from '../../components/form/Field.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { moveItem } from '../../lib/arrays.js'
import {
  aspectWarning,
  readTemplateSvg,
  SPREAD_ASPECT,
} from '../../lib/templateSvg.js'
import DiaryLayout from './DiaryLayout.jsx'
import FrameEditor from './FrameEditor.jsx'

const BACK_TO = '/diary/templates'

const emptyTemplate = () => ({
  name: {},
  imageUrl: '',
  overlayUrl: '',
  aspect: SPREAD_ASPECT,
  frames: [],
})

// photo-N with the next free N.
function nextFrameId(frames) {
  const numbers = frames.map((f) =>
    Number(f.id.match(/^photo-(\d+)$/)?.[1] ?? 0),
  )
  return `photo-${Math.max(frames.length, ...numbers) + 1}`
}

const percent = (fraction) => Math.round(fraction * 1000) / 10

// 새 템플릿 추가 (/diary/templates/new) and edit (/diary/templates/:id).
function TemplateEditorPage() {
  const { templateId } = useParams()
  const fetcher = useCallback(
    () => (templateId ? getTemplate(templateId) : Promise.resolve(null)),
    [templateId],
  )
  const { data, error, reload } = useFetch(fetcher)

  return (
    <DiaryLayout title={templateId ? '템플릿 수정' : '새 템플릿 추가'}>
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : data === undefined ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <TemplateForm
            key={templateId ?? 'new'}
            initial={data ?? emptyTemplate()}
          />
        )}
      </main>
    </DiaryLayout>
  )
}

function TemplateForm({ initial }) {
  const navigate = useNavigate()
  const svgInput = useRef(null)
  const [form, setForm] = useState(() => structuredClone(initial))
  const [dirty, setDirty] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const [reading, setReading] = useState(null) // null | 'busy' | { warnings } | 'failed'
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [removing, setRemoving] = useState(null) // a frame used by diaries
  const used = initial.usedBy > 0
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  const change = (fn) => {
    setDirty(true)
    setForm((prev) => ({ ...prev, ...fn(prev) }))
  }
  const setFrames = (fn) => change((prev) => ({ frames: fn(prev.frames) }))
  const selected = form.frames.find((f) => f.id === selectedId)
  const selectedIndex = form.frames.indexOf(selected)

  async function readSvg(file) {
    if (!file) return
    setReading('busy')
    try {
      const read = await readTemplateSvg(file)
      const [background, overlay] = await Promise.all([
        uploadImage(read.background),
        read.overlay ? uploadImage(read.overlay) : null,
      ])
      // A used template keeps its frame ids, in order (members' photos
      // are tied to them); extra frames get new ids.
      const frames = read.frames.map((frame, i) => ({
        ...frame,
        id: initial.frames[i]?.id ?? frame.id,
      }))
      change(() => ({
        imageUrl: background.url,
        overlayUrl: overlay?.url ?? '',
        aspect: read.aspect,
        frames,
      }))
      setSelectedId(null)
      setReading({ warnings: read.warnings, frames: frames.length })
    } catch {
      setReading('failed')
    }
  }

  async function pickImage(key, file) {
    if (!file) return
    try {
      const image = await uploadImage(file)
      change(() => ({
        [key]: image.url,
        ...(key === 'imageUrl' && { aspect: image.width / image.height }),
      }))
    } catch {
      setReading('failed')
    }
  }

  function addFrame() {
    const id = nextFrameId(form.frames)
    setFrames((frames) => [
      ...frames,
      { id, x: 0.4, y: 0.35, width: 0.2, height: 0.3, rotation: 0 },
    ])
    setSelectedId(id)
  }

  function removeFrame(frame) {
    setFrames((frames) => frames.filter((f) => f.id !== frame.id))
    setSelectedId(null)
  }

  const updateFrame = (next) =>
    setFrames((frames) => frames.map((f) => (f.id === next.id ? next : f)))

  async function save(event) {
    event.preventDefault()
    const found = {}
    if (!form.name.en?.trim()) found.name = '영어 이름은 꼭 입력해 주세요.'
    if (!form.imageUrl) found.image = 'SVG나 배경 이미지를 올려 주세요.'
    if (form.frames.length === 0)
      found.frames = '사진 칸을 하나 이상 만들어 주세요.'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const fields = {
      name: form.name,
      imageUrl: form.imageUrl,
      overlayUrl: form.overlayUrl,
      aspect: form.aspect,
      frames: form.frames,
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      if (initial.id) await updateTemplate(initial.id, fields)
      else await createTemplate(fields)
      flushSync(() => setDirty(false))
      navigate(BACK_TO, { state: { toast: '저장했어요.' } })
    } catch {
      setSaveFailed(true)
      setSaving(false)
    }
  }

  const ratio = aspectWarning(form.aspect)
  const numberField = (label, value, onValue, step = 0.1) => (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onValue(Number(event.target.value))}
        className={`${inputClass} h-9 font-normal text-text tabular-nums`}
      />
    </label>
  )

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4 lg:gap-6">
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-bold">파일</h2>
          <p className="mt-0.5 text-xs text-sub">
            Figma에서 프레임을 SVG로 내보내 올리면 사진 칸(photo-1, photo-2 …)과
            장식(overlay)을 자동으로 찾아요. 내보낼 때 &lsquo;Include id
            attribute&rsquo;와 &lsquo;Outline text&rsquo;를 켜 주세요.
          </p>
        </div>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            readSvg(event.dataTransfer.files[0])
          }}
          className={`flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed p-4 ${errors.image ? 'border-danger' : 'border-border'}`}
        >
          <Button
            variant="primary"
            onClick={() => svgInput.current.click()}
            disabled={reading === 'busy'}
          >
            {reading === 'busy' ? '읽는 중…' : 'SVG 올리기'}
          </Button>
          <span className="text-sm text-sub">또는 여기에 끌어다 놓기</span>
          <span className="mx-2 hidden h-6 w-px bg-border sm:block" />
          <label className={`${buttonClass('outline', 'sm')} cursor-pointer`}>
            배경 PNG로 바꾸기
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                pickImage('imageUrl', event.target.files[0])
                event.target.value = ''
              }}
            />
          </label>
          <label className={`${buttonClass('outline', 'sm')} cursor-pointer`}>
            장식 PNG {form.overlayUrl ? '바꾸기' : '올리기'}
            <input
              type="file"
              accept="image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                pickImage('overlayUrl', event.target.files[0])
                event.target.value = ''
              }}
            />
          </label>
          {form.overlayUrl && (
            <button
              type="button"
              onClick={() => change(() => ({ overlayUrl: '' }))}
              className="text-xs font-semibold text-muted underline underline-offset-2"
            >
              장식 빼기
            </button>
          )}
          <input
            ref={svgInput}
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={(event) => {
              readSvg(event.target.files[0])
              event.target.value = ''
            }}
          />
        </div>
        {errors.image && (
          <p role="alert" className="text-xs font-medium text-danger">
            {errors.image}
          </p>
        )}
        {reading === 'failed' && (
          <p role="alert" className="text-xs font-medium text-danger">
            파일을 읽지 못했어요. Figma에서 SVG로 다시 내보내 주세요.
          </p>
        )}
        {reading?.warnings && (
          <ul className="flex flex-col gap-1 text-xs">
            <li className="font-medium text-ok">
              사진 칸 {reading.frames}개를 찾았어요.
              {used &&
                ' 이 템플릿은 쓰는 다이어리가 있어서 기존 칸 id를 순서대로 이어받았어요.'}
            </li>
            {reading.warnings.map((warning) => (
              <li key={warning} className="font-medium text-warn">
                {warning}
              </li>
            ))}
          </ul>
        )}
        {ratio && !reading?.warnings && (
          <p className="text-xs font-medium text-warn">{ratio}</p>
        )}
      </Card>

      <div className="grid items-start gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-base font-bold">사진 칸</h2>
            {form.overlayUrl && (
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted">
                <input
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(event) => setShowOverlay(event.target.checked)}
                  className="size-4 accent-point-strong"
                />
                장식 보기
              </label>
            )}
            <Button size="sm" onClick={addFrame} disabled={!form.imageUrl}>
              + 사진 칸 추가
            </Button>
          </div>
          {form.imageUrl ? (
            <FrameEditor
              imageUrl={form.imageUrl}
              overlayUrl={form.overlayUrl}
              showOverlay={showOverlay}
              aspect={form.aspect}
              frames={form.frames}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateFrame}
            />
          ) : (
            <div
              style={{ aspectRatio: SPREAD_ASPECT }}
              className="flex items-center justify-center rounded-lg bg-chip text-sm text-sub"
            >
              SVG나 배경 이미지를 올리면 여기에 보여요.
            </div>
          )}
          <p className="text-xs text-sub">
            칸을 끌어서 옮기고, 오른쪽 아래 점으로 크기를, 위쪽 점으로 회전을
            바꿔요(Shift: 15° 단위). 번호 순서대로 사진이 들어가요.
          </p>
          {errors.frames && (
            <p role="alert" className="text-xs font-medium text-danger">
              {errors.frames}
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Card className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-bold">
              칸 목록 ({form.frames.length})
            </h2>
            {form.frames.length === 0 ? (
              <p className="text-xs text-sub">아직 사진 칸이 없어요.</p>
            ) : (
              <ol className="flex flex-col gap-1">
                {form.frames.map((frame, index) => (
                  <li
                    key={frame.id}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 ${frame.id === selectedId ? 'bg-point-soft' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(frame.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm"
                    >
                      <span className="mr-1.5 font-bold tabular-nums">
                        {index + 1}
                      </span>
                      <span className="text-xs text-sub">{frame.id}</span>
                    </button>
                    <MoveButtons
                      index={index}
                      count={form.frames.length}
                      onMove={(to) =>
                        setFrames((frames) => moveItem(frames, index, to))
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {selected && (
            <Card className="flex flex-col gap-3 p-4">
              <h2 className="text-sm font-bold">
                {selectedIndex + 1}번 칸{' '}
                <span className="font-normal text-sub">{selected.id}</span>
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {numberField('X (%)', percent(selected.x), (v) =>
                  updateFrame({ ...selected, x: v / 100 }),
                )}
                {numberField('Y (%)', percent(selected.y), (v) =>
                  updateFrame({ ...selected, y: v / 100 }),
                )}
                {numberField('가로 (%)', percent(selected.width), (v) =>
                  updateFrame({ ...selected, width: v / 100 }),
                )}
                {numberField('세로 (%)', percent(selected.height), (v) =>
                  updateFrame({ ...selected, height: v / 100 }),
                )}
                {numberField('회전 (°)', selected.rotation, (v) =>
                  updateFrame({ ...selected, rotation: v }),
                )}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  used && initial.frames.some((f) => f.id === selected.id)
                    ? setRemoving(selected)
                    : removeFrame(selected)
                }
              >
                이 칸 삭제
              </Button>
            </Card>
          )}

          <Card className="flex flex-col gap-3 p-4">
            <Field label="템플릿 이름" required error={errors.name}>
              <LocalizedInput
                id="templateName"
                required
                value={form.name}
                onChange={(name) => change(() => ({ name }))}
                invalid={Boolean(errors.name)}
              />
            </Field>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {used && (
          <p className="mr-auto text-xs text-muted">
            편집 중인 다이어리 {initial.usedBy}개가 쓰는 템플릿이에요. 칸을
            지우면 그 칸의 사진이 빠져요.
          </p>
        )}
        {saveFailed && (
          <p role="alert" className="mr-auto text-sm font-medium text-danger">
            저장하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <Button onClick={() => navigate(BACK_TO)}>취소</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        title="이 칸을 지울까요?"
        message={`편집 중인 다이어리 ${initial.usedBy}개가 이 템플릿을 쓰고 있어요. 저장하면 그 다이어리에서 이 칸에 넣은 사진이 빠져요.`}
        confirmLabel="지우기"
        danger
        onConfirm={() => {
          removeFrame(removing)
          setRemoving(null)
        }}
        onCancel={() => setRemoving(null)}
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

export default TemplateEditorPage
