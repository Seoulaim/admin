import { useState } from 'react'
import {
  createKeyword,
  deleteKeyword,
  getKeywords,
  reorderKeywords,
  updateKeyword,
} from '../../api/places.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import Toast from '../../components/Toast.jsx'
import { useDragSort } from '../../hooks/useDragSort.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { moveItem } from '../../lib/arrays.js'
import { allNames } from '../../lib/artists.js'
import PlacesLayout from './PlacesLayout.jsx'

// One keyword's names being written (a new one when id is missing).
function KeywordEditor({ keyword, onSave, onCancel }) {
  const [name, setName] = useState(keyword.name)
  const [invalid, setInvalid] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.en?.trim()) return setInvalid(true)
    setSaving(true)
    const ok = await onSave(name)
    if (!ok) setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3 bg-panel/70 px-4 py-4 sm:px-6">
      <LocalizedInput
        id={`keyword-${keyword.id ?? 'new'}`}
        required
        columns
        value={name}
        onChange={setName}
        invalid={invalid}
        maxLength={30}
      />
      {invalid && (
        <p role="alert" className="text-xs font-medium text-danger">
          영어 이름은 꼭 입력해 주세요.
        </p>
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

// 장소 관리 › 키워드: the HC05 keyword list — names in 4 languages, the
// order members see them in, and how many places use each.
function KeywordsPage() {
  const { data: keywords, error, reload, update } = useFetch(getKeywords)
  const { toast, showToast } = useToast()
  const [editing, setEditing] = useState(null) // keyword id or 'new'
  const [ordering, setOrdering] = useState(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const move = (from, to) => setOrdering((list) => moveItem(list, from, to))
  const dragProps = useDragSort(move)

  async function saveKeyword(keyword, name) {
    try {
      if (keyword.id) {
        await updateKeyword(keyword.id, { name })
        update((list) =>
          list.map((k) => (k.id === keyword.id ? { ...k, name } : k)),
        )
      } else {
        const created = await createKeyword({ name })
        update((list) => [...list, { ...created, placeCount: 0 }])
      }
      setEditing(null)
      showToast('저장했어요.')
      return true
    } catch {
      showToast('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  async function saveOrder() {
    setSavingOrder(true)
    try {
      await reorderKeywords(ordering.map((k) => k.id))
      update(() => ordering)
      setOrdering(null)
      showToast('순서를 저장했어요.')
    } catch {
      showToast('순서를 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setSavingOrder(false)
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await deleteKeyword(deleting.id)
      update((list) => list.filter((k) => k.id !== deleting.id))
      showToast('삭제했어요.')
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  const list = ordering ?? keywords

  return (
    <PlacesLayout>
      <main className="flex max-w-4xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            회원이 플랜을 만들 때(HC05) 고르는 키워드예요. 이 순서대로 보여요.
          </p>
          <div className="ml-auto flex gap-2">
            {ordering ? (
              <>
                <Button
                  onClick={() => setOrdering(null)}
                  disabled={savingOrder}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={saveOrder}
                  disabled={savingOrder}
                >
                  {savingOrder ? '저장 중…' : '저장'}
                </Button>
              </>
            ) : (
              keywords && (
                <>
                  <Button
                    onClick={() => {
                      setEditing(null)
                      setOrdering(keywords)
                    }}
                    disabled={keywords.length < 2}
                  >
                    순서 수정
                  </Button>
                  <Button variant="primary" onClick={() => setEditing('new')}>
                    + 키워드 추가
                  </Button>
                </>
              )
            )}
          </div>
        </div>

        <Card className="overflow-hidden">
          {error ? (
            <LoadError onRetry={reload} className="py-20" />
          ) : !list ? (
            <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
          ) : (
            <ol className="divide-y divide-border">
              {list.map((keyword, index) => (
                <li
                  key={keyword.id}
                  {...(ordering ? dragProps(index) : {})}
                  className={
                    ordering ? 'cursor-grab active:cursor-grabbing' : ''
                  }
                >
                  {editing === keyword.id ? (
                    <KeywordEditor
                      keyword={keyword}
                      onSave={(name) => saveKeyword(keyword, name)}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
                      <span className="w-6 text-sm font-bold text-sub tabular-nums">
                        {ordering ? '⋮⋮' : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {keyword.name.en}
                        </p>
                        <p className="truncate text-xs text-sub">
                          {allNames({ ...keyword.name, en: '' }) ||
                            '다른 언어 없음 (영어로 보여요)'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-sub tabular-nums">
                        장소 {keyword.placeCount}곳
                      </span>
                      {ordering ? (
                        <MoveButtons
                          index={index}
                          count={list.length}
                          onMove={(to) => move(index, to)}
                        />
                      ) : (
                        <div className="flex shrink-0 gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => setEditing(keyword.id)}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleting(keyword)}
                          >
                            삭제
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {editing === 'new' && (
                <li>
                  <KeywordEditor
                    keyword={{ name: {} }}
                    onSave={(name) => saveKeyword({}, name)}
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
        title="키워드를 삭제할까요?"
        message={
          deleting &&
          `'${deleting.name.en}'을(를) 삭제하면 회원이 고를 수 없게 되고${deleting.placeCount > 0 ? `, 장소 ${deleting.placeCount}곳에서도 빠져요` : ''}.`
        }
        confirmLabel="삭제"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <Toast toast={toast} />
    </PlacesLayout>
  )
}

export default KeywordsPage
