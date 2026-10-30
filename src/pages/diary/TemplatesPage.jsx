import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import {
  deleteTemplate,
  getTemplates,
  reorderTemplates,
  setTemplateVisible,
} from '../../api/diary.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import LoadError from '../../components/LoadError.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import Switch from '../../components/Switch.jsx'
import Toast from '../../components/Toast.jsx'
import { useDragSort } from '../../hooks/useDragSort.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { moveItem } from '../../lib/arrays.js'
import { aspectWarning } from '../../lib/templateSvg.js'
import DiaryLayout from './DiaryLayout.jsx'
import TemplateThumb from './TemplateThumb.jsx'

// 다이어리 관리 › 템플릿: templates in the order the editor's template
// picker (DD05-3) shows them.
function TemplatesPage() {
  const { data: templates, error, reload, update } = useFetch(getTemplates)
  const location = useLocation()
  const { toast, showToast } = useToast(location.state?.toast)
  const [ordering, setOrdering] = useState(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const move = (from, to) => setOrdering((list) => moveItem(list, from, to))
  const dragProps = useDragSort(move)

  async function toggle(template, visible) {
    const set = (value) =>
      update((list) =>
        list.map((t) => (t.id === template.id ? { ...t, visible: value } : t)),
      )
    set(visible)
    try {
      await setTemplateVisible(template.id, visible)
    } catch {
      set(!visible)
      showToast('바꾸지 못했어요. 다시 시도해 주세요.')
    }
  }

  async function saveOrder() {
    setSavingOrder(true)
    try {
      await reorderTemplates(ordering.map((t) => t.id))
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
      await deleteTemplate(deleting.id)
      update((list) => list.filter((t) => t.id !== deleting.id))
      showToast('삭제했어요.')
    } catch (e) {
      showToast(
        e.code === 'TEMPLATE_IN_USE'
          ? '편집 중인 다이어리가 쓰고 있어 삭제할 수 없어요. 숨기기만 할 수 있어요.'
          : '삭제하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  const list = ordering ?? templates

  return (
    <DiaryLayout
      actions={
        <Link to="/diary/templates/new" className={buttonClass('primary')}>
          새 템플릿 추가
        </Link>
      }
    >
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            편집기의 템플릿 목록(DD05-3)에 이 순서대로 보여요. 끄면 목록에서만
            빠져요. 완성한 다이어리는 영향이 없고, 편집 중인 페이지에
            사진·스티커·글·펜을 넣었으면 그대로 남아요. 템플릿만 적용한 페이지는
            템플릿이 자동으로 빠져요.
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
              templates && (
                <Button
                  onClick={() => setOrdering(templates)}
                  disabled={templates.length < 2}
                >
                  순서 수정
                </Button>
              )
            )}
          </div>
        </div>

        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !list ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : list.length === 0 ? (
          <p className="py-24 text-center text-sm text-sub">
            등록된 템플릿이 없어요.
          </p>
        ) : (
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {list.map((template, index) => {
              const ratio = aspectWarning(template.aspect)
              return (
                <Card
                  as="li"
                  key={template.id}
                  className={`overflow-hidden ${ordering ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <div {...(ordering ? dragProps(index) : {})}>
                    <TemplateThumb
                      template={template}
                      className={template.visible ? '' : 'opacity-40'}
                    />
                    <div className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">
                          <span className="mr-1.5 text-sub tabular-nums">
                            {index + 1}
                          </span>
                          {template.name.ko || template.name.en}
                        </p>
                        <p className="text-xs text-sub">
                          사진 칸 {template.frames.length}개
                          {template.usedBy > 0 &&
                            ` · 편집 중인 다이어리 ${template.usedBy}개에서 사용 중`}
                          {template.overlayUrl && ' · 장식 있음'}
                        </p>
                        {ratio && (
                          <p className="truncate text-xs font-medium text-warn">
                            비율이 A4 가로가 아니에요
                          </p>
                        )}
                        {template.usedBy > 0 && (
                          <p className="text-xs text-muted">
                            쓰는 다이어리가 있어 삭제할 수 없어요. 숨기기만
                            돼요.
                          </p>
                        )}
                      </div>
                      {ordering ? (
                        <MoveButtons
                          index={index}
                          count={list.length}
                          onMove={(to) => move(index, to)}
                        />
                      ) : (
                        <>
                          <Switch
                            checked={template.visible}
                            onChange={(on) => toggle(template, on)}
                            label={`${template.name.en} 노출`}
                          />
                          <Link
                            to={`/diary/templates/${template.id}`}
                            className={buttonClass('outline', 'sm')}
                          >
                            수정
                          </Link>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleting(template)}
                            disabled={template.usedBy > 0}
                            title={
                              template.usedBy > 0
                                ? '편집 중인 다이어리가 쓰는 템플릿은 숨기기만 할 수 있어요.'
                                : undefined
                            }
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </ol>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="템플릿을 삭제할까요?"
        message="삭제하면 되돌릴 수 없어요."
        confirmLabel="삭제"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <Toast toast={toast} />
    </DiaryLayout>
  )
}

export default TemplatesPage
