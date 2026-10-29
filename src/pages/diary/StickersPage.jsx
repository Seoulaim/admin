import { useRef, useState } from 'react'
import {
  createSticker,
  createStickerCategory,
  deleteSticker,
  deleteStickerCategory,
  getStickers,
  reorderStickerCategories,
  reorderStickers,
  updateSticker,
  updateStickerCategory,
} from '../../api/diary.js'
import { uploadImage } from '../../api/uploads.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import LoadError from '../../components/LoadError.jsx'
import Toast from '../../components/Toast.jsx'
import { useDragSort } from '../../hooks/useDragSort.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { moveItem } from '../../lib/arrays.js'
import {
  checkStickerFile,
  nameFromFile,
  STICKER_TYPES,
} from '../../lib/stickerFile.js'
import CategoryPanel from './CategoryPanel.jsx'
import DiaryLayout from './DiaryLayout.jsx'
import StickerDialog from './StickerDialog.jsx'
import { ALL, CHECKERBOARD, NONE } from './stickers.js'

// 다이어리 관리 › 스티커: cut-out stickers for the editor (DD05-4), in the
// order it shows them, with their categories. Upload several files at once;
// they go into the category being viewed.
function StickersPage() {
  const { data, error, reload, update } = useFetch(getStickers)
  const { toast, showToast } = useToast()
  const fileInput = useRef(null)
  const [filter, setFilter] = useState(ALL)
  const [uploading, setUploading] = useState(0)
  const [report, setReport] = useState([]) // [{ name, warnings, failed }]
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null) // { kind, item }
  const [ordering, setOrdering] = useState(null)
  const moveSticker = (from, to) =>
    setOrdering((list) => moveItem(list, from, to))
  const dragProps = useDragSort(moveSticker)

  const set = (key, fn) => update((d) => ({ ...d, [key]: fn(d[key]) }))

  async function upload(files) {
    const picked = [...files]
    if (picked.length === 0) return
    setReport([])
    setUploading(picked.length)
    const categoryIds = filter !== ALL && filter !== NONE ? [filter] : []
    const results = []
    for (const file of picked) {
      const check = await checkStickerFile(file)
      if (!check.ok) {
        results.push({
          name: file.name,
          warnings: check.warnings,
          failed: true,
        })
      } else {
        try {
          const image = await uploadImage(file)
          const created = await createSticker({
            name: { en: nameFromFile(file) },
            imageUrl: image.url,
            categoryIds,
          })
          set('stickers', (list) => [...list, created])
          results.push({ name: file.name, warnings: check.warnings })
        } catch {
          results.push({
            name: file.name,
            warnings: ['올리지 못했어요.'],
            failed: true,
          })
        }
      }
      setUploading((n) => n - 1)
    }
    setReport(results.filter((r) => r.failed || r.warnings.length > 0))
    const added = results.filter((r) => !r.failed).length
    if (added > 0) showToast(`스티커 ${added}개를 올렸어요.`)
  }

  async function saveSticker(sticker) {
    try {
      const { id, name, imageUrl, categoryIds } = sticker
      await updateSticker(id, { name, imageUrl, categoryIds })
      set('stickers', (list) => list.map((s) => (s.id === id ? sticker : s)))
      setEditing(null)
      showToast('저장했어요.')
      return true
    } catch {
      showToast('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  async function saveCategory(category, name) {
    try {
      if (category) {
        await updateStickerCategory(category.id, { name })
        set('categories', (list) =>
          list.map((c) => (c.id === category.id ? { ...c, name } : c)),
        )
      } else {
        const created = await createStickerCategory({ name })
        set('categories', (list) => [...list, created])
      }
      return true
    } catch {
      showToast('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  async function moveCategory(from, to) {
    const next = moveItem(data.categories, from, to)
    set('categories', () => next)
    try {
      await reorderStickerCategories(next.map((c) => c.id))
    } catch {
      showToast('순서를 저장하지 못했어요.')
      reload()
    }
  }

  async function saveOrder() {
    try {
      await reorderStickers(ordering.map((s) => s.id))
      set('stickers', () => ordering)
      setOrdering(null)
      showToast('순서를 저장했어요.')
    } catch {
      showToast('순서를 저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  async function confirmDelete() {
    const { kind, item } = deleting
    try {
      if (kind === 'category') {
        await deleteStickerCategory(item.id)
        update((d) => ({
          categories: d.categories.filter((c) => c.id !== item.id),
          stickers: d.stickers.map((s) => ({
            ...s,
            categoryIds: s.categoryIds.filter((c) => c !== item.id),
          })),
        }))
        if (filter === item.id) setFilter(ALL)
      } else {
        await deleteSticker(item.id)
        set('stickers', (list) => list.filter((s) => s.id !== item.id))
        setEditing(null)
      }
      showToast('삭제했어요.')
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setDeleting(null)
    }
  }

  if (error || !data) {
    return (
      <DiaryLayout>
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        )}
      </DiaryLayout>
    )
  }

  const counts = { [ALL]: data.stickers.length, [NONE]: 0 }
  for (const sticker of data.stickers) {
    if (sticker.categoryIds.length === 0) counts[NONE]++
    for (const id of sticker.categoryIds) counts[id] = (counts[id] ?? 0) + 1
  }
  const shown = (ordering ?? data.stickers).filter(
    (s) =>
      filter === ALL ||
      (filter === NONE
        ? s.categoryIds.length === 0
        : s.categoryIds.includes(filter)),
  )
  const categoryName = (id) => {
    const category = data.categories.find((c) => c.id === id)
    return category ? category.name.ko || category.name.en : id
  }

  return (
    <DiaryLayout
      actions={
        <Button variant="primary" onClick={() => fileInput.current.click()}>
          스티커 올리기
        </Button>
      }
    >
      <input
        ref={fileInput}
        type="file"
        accept={STICKER_TYPES}
        multiple
        className="hidden"
        onChange={(event) => {
          upload(event.target.files)
          event.target.value = ''
        }}
      />
      <main className="grid items-start gap-4 p-4 sm:p-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 lg:p-8">
        <CategoryPanel
          categories={data.categories}
          counts={counts}
          selected={filter}
          onSelect={(id) => !ordering && setFilter(id)}
          onSave={saveCategory}
          onDelete={(category) =>
            setDeleting({ kind: 'category', item: category })
          }
          onMove={moveCategory}
        />

        <div className="flex flex-col gap-4">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              if (event.dataTransfer.files.length)
                upload(event.dataTransfer.files)
            }}
            className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-border bg-white px-4 py-3 text-sm text-muted"
          >
            {uploading > 0 ? (
              <span className="font-semibold">
                올리는 중… ({uploading}개 남음)
              </span>
            ) : (
              <span>
                파일을 여기에 끌어다 놓아도 돼요 (여러 개 가능). 누끼 PNG·WebP
                또는 SVG.
                {filter !== ALL && filter !== NONE && (
                  <b className="ml-1 text-text">
                    &lsquo;{categoryName(filter)}&rsquo;에 들어가요.
                  </b>
                )}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              {ordering ? (
                <>
                  <Button size="sm" onClick={() => setOrdering(null)}>
                    취소
                  </Button>
                  <Button size="sm" variant="primary" onClick={saveOrder}>
                    순서 저장
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setFilter(ALL)
                    setOrdering(data.stickers)
                  }}
                  disabled={data.stickers.length < 2}
                >
                  순서 수정
                </Button>
              )}
            </div>
          </div>

          {report.length > 0 && (
            <Card className="flex flex-col gap-1.5 p-4 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">올린 파일 점검</h2>
                <button
                  type="button"
                  onClick={() => setReport([])}
                  className="text-xs font-semibold text-muted"
                >
                  닫기
                </button>
              </div>
              {report.map((r) => (
                <p key={r.name} className="text-xs">
                  <b className={r.failed ? 'text-danger' : 'text-warn'}>
                    {r.name} {r.failed ? '— 올리지 않았어요' : '— 올렸어요'}
                  </b>
                  <span className="ml-1 text-muted">
                    {r.warnings.join(' ')}
                  </span>
                </p>
              ))}
            </Card>
          )}

          {ordering && (
            <p className="text-sm text-muted">
              끌어서 순서를 바꾸세요. 편집기의 스티커 목록이 이 순서예요.
            </p>
          )}

          {shown.length === 0 ? (
            <Card className="py-20 text-center text-sm text-sub">
              이 카테고리에 스티커가 없어요.
            </Card>
          ) : (
            <ol className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
              {shown.map((sticker, index) => (
                <li
                  key={sticker.id}
                  {...(ordering ? dragProps(index) : {})}
                  className={
                    ordering ? 'cursor-grab active:cursor-grabbing' : ''
                  }
                >
                  <button
                    type="button"
                    onClick={() => !ordering && setEditing(sticker)}
                    className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-white text-left hover:border-point"
                  >
                    <span
                      className={`flex aspect-square items-center justify-center p-3 ${CHECKERBOARD}`}
                    >
                      <img
                        src={sticker.imageUrl}
                        alt=""
                        draggable={false}
                        className="size-full object-contain"
                      />
                    </span>
                    <span className="flex flex-col gap-0.5 border-t border-border px-2.5 py-2">
                      <span className="truncate text-[13px] font-semibold">
                        {sticker.name.ko || sticker.name.en}
                      </span>
                      <span className="truncate text-[11px] text-sub">
                        {sticker.categoryIds.length
                          ? sticker.categoryIds.map(categoryName).join(', ')
                          : '미분류'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>

      {editing && (
        <StickerDialog
          sticker={editing}
          categories={data.categories}
          onSave={saveSticker}
          onDelete={() => setDeleting({ kind: 'sticker', item: editing })}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={
          deleting?.kind === 'category'
            ? '카테고리를 삭제할까요?'
            : '스티커를 삭제할까요?'
        }
        message={
          deleting?.kind === 'category'
            ? '카테고리만 지워지고, 그 안의 스티커는 남아요.'
            : '편집기에서 빠져요. 이미 붙인 다이어리에서는 그 스티커가 보이지 않게 돼요.'
        }
        confirmLabel="삭제"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <Toast toast={toast} />
    </DiaryLayout>
  )
}

export default StickersPage
