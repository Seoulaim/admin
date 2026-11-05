import { useCallback, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import {
  deletePromotion,
  getPromotions,
  reorderPromotions,
  setDefaultPromotion,
  setPromotionEnabled,
} from '../../api/promotions.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Toast from '../../components/Toast.jsx'
import { useDragSort } from '../../hooks/useDragSort.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { moveItem } from '../../lib/arrays.js'
import { PLACEMENTS } from '../../lib/promotions.js'
import PromotionRow from './PromotionRow.jsx'

const TABS = [{ id: null, label: '전체' }, ...PLACEMENTS]

// The tab is kept in the URL (?tab=HOME) so coming back from editing
// lands on the same tab. 전체: newest first; HOME / DIARY: the order the
// member app shows, which "순서 수정" changes by dragging.
function PromotionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const placement =
    PLACEMENTS.find((p) => p.id === searchParams.get('tab'))?.id ?? null
  const fetcher = useCallback(() => getPromotions(placement), [placement])
  const { data: promotions, error, reload, update } = useFetch(fetcher)
  const location = useLocation()
  const { toast, showToast } = useToast(location.state?.toast)
  const [ordering, setOrdering] = useState(null) // promotions while reordering
  const [savingOrder, setSavingOrder] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [defaulting, setDefaulting] = useState(null)
  const [defaultBusy, setDefaultBusy] = useState(false)

  function selectTab(id) {
    setSearchParams(id ? { tab: id } : {}, { replace: true })
  }

  async function toggle(promotion, enabled) {
    const set = (value) =>
      update((list) =>
        list.map((p) => (p.id === promotion.id ? { ...p, enabled: value } : p)),
      )
    set(enabled)
    try {
      await setPromotionEnabled(promotion.id, enabled)
    } catch {
      set(!enabled)
      showToast('바꾸지 못했어요. 다시 시도해 주세요.')
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await deletePromotion(deleting.id)
      update((list) => list.filter((p) => p.id !== deleting.id))
      showToast('삭제했어요.')
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  // The server answers with that placement's list. On a placement tab it
  // replaces the list; on 전체 (other placement mixed in) reload instead.
  async function confirmDefault() {
    setDefaultBusy(true)
    try {
      const list = await setDefaultPromotion(defaulting.id)
      if (placement) update(() => list)
      else reload()
      showToast('기본 배너를 바꿨어요.')
    } catch {
      showToast('기본 배너를 바꾸지 못했어요. 다시 시도해 주세요.')
    } finally {
      setDefaultBusy(false)
      setDefaulting(null)
    }
  }

  async function saveOrder() {
    setSavingOrder(true)
    try {
      await reorderPromotions(
        placement,
        ordering.map((p) => p.id),
      )
      update(() => ordering)
      setOrdering(null)
      showToast('순서를 저장했어요.')
    } catch {
      showToast('순서를 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setSavingOrder(false)
    }
  }

  const move = (from, to) => setOrdering((list) => moveItem(list, from, to))
  const dragProps = useDragSort(move)

  const list = ordering ?? promotions

  return (
    <>
      <PageHeader title="프로모션 관리">
        <Link
          to={`/promotions/new${placement ? `?placement=${placement}` : ''}`}
          className={buttonClass('primary')}
        >
          새 프로모션 추가
        </Link>
      </PageHeader>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={tab.id === placement}
                disabled={Boolean(ordering)}
                onClick={() => selectTab(tab.id)}
                className={`h-9 rounded-full px-4 text-sm font-semibold disabled:cursor-not-allowed ${tab.id === placement ? 'bg-point-soft text-point-strong' : 'text-muted hover:bg-chip disabled:hover:bg-transparent'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {placement &&
            promotions &&
            (ordering ? (
              <div className="flex gap-2">
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
              </div>
            ) : (
              <Button
                onClick={() => setOrdering(promotions)}
                disabled={promotions.length < 2}
              >
                순서 수정
              </Button>
            ))}
        </div>

        {ordering && (
          <p className="text-sm text-muted">
            끌어서 순서를 바꾸세요. 위에 있을수록 앱에서 앞에 보여요.
          </p>
        )}

        <Card className="overflow-hidden">
          {error ? (
            <LoadError onRetry={reload} className="py-20" />
          ) : !list ? (
            <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
          ) : list.length === 0 ? (
            <p className="py-20 text-center text-sm text-sub">
              등록된 프로모션이 없어요.
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {list.map((promotion, index) => (
                <PromotionRow
                  key={promotion.id}
                  promotion={promotion}
                  showPlacement={!placement}
                  ordering={
                    ordering && {
                      index,
                      count: ordering.length,
                      move: (to) => move(index, to),
                      drag: dragProps(index),
                    }
                  }
                  onToggle={(enabled) => toggle(promotion, enabled)}
                  onDelete={() => setDeleting(promotion)}
                  onMakeDefault={() => setDefaulting(promotion)}
                />
              ))}
            </ol>
          )}
        </Card>
      </main>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="프로모션을 삭제할까요?"
        message={
          deleting &&
          `'${deleting.adminTitle}'을(를) 삭제하면 되돌릴 수 없어요.`
        }
        confirmLabel="삭제"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <ConfirmDialog
        open={Boolean(defaulting)}
        title="이 배너를 기본 배너로 바꿀까요?"
        message={
          defaulting &&
          `'${defaulting.adminTitle}' — 기본 배너는 항상 켜지고 기간이 없어져요. 지금 기본 배너는 켜진 일반 배너로 남아요.`
        }
        confirmLabel="기본으로 설정"
        busy={defaultBusy}
        onConfirm={confirmDefault}
        onCancel={() => setDefaulting(null)}
      />
      <Toast toast={toast} />
    </>
  )
}

export default PromotionsPage
