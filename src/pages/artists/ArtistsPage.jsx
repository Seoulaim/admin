import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getGroups, reorderGroups } from '../../api/artists.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import { inputClass } from '../../components/form/inputClass.js'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Toast from '../../components/Toast.jsx'
import { useDragSort } from '../../hooks/useDragSort.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { moveItem } from '../../lib/arrays.js'
import { nameMatches } from '../../lib/artists.js'
import GroupCard from './GroupCard.jsx'

// 그룹·멤버 관리: groups in the order the member app's bias pickers show
// them, each opening to its members. Search finds groups and members in
// any language; "그룹 순서 수정" reorders the groups.
function ArtistsPage() {
  const { data: groups, error, reload, update } = useFetch(getGroups)
  const location = useLocation()
  const { toast, showToast } = useToast(location.state?.toast)
  // Open groups; the one just saved starts open.
  const [openIds, setOpenIds] = useState(
    () => new Set(location.state?.open ? [location.state.open] : []),
  )
  const [query, setQuery] = useState('')
  const [ordering, setOrdering] = useState(null) // groups while reordering
  const [savingOrder, setSavingOrder] = useState(false)
  const move = (from, to) => setOrdering((list) => moveItem(list, from, to))
  const dragProps = useDragSort(move)

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function saveOrder() {
    setSavingOrder(true)
    try {
      await reorderGroups(ordering.map((g) => g.id))
      update(() => ordering)
      setOrdering(null)
      showToast('순서를 저장했어요.')
    } catch {
      showToast('순서를 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setSavingOrder(false)
    }
  }

  // With a search: groups whose name matches (all members), or that have
  // matching members (only those), opened.
  const searching = query.trim() !== '' && !ordering
  const shown = (ordering ?? groups ?? []).flatMap((group) => {
    if (!searching) return [{ group, members: group.members }]
    if (nameMatches(group.name, query))
      return [{ group, members: group.members }]
    const members = group.members.filter((m) => nameMatches(m.name, query))
    return members.length > 0 ? [{ group, members }] : []
  })
  const memberCount = groups?.reduce((sum, g) => sum + g.members.length, 0)

  return (
    <>
      <PageHeader title="그룹·멤버 관리">
        <Link to="/artists/new" className={buttonClass('primary')}>
          새 그룹 추가
        </Link>
      </PageHeader>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            aria-label="그룹·멤버 검색"
            placeholder="그룹·멤버 이름 검색 (모든 언어)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={Boolean(ordering)}
            className={`${inputClass} h-10 max-w-xs`}
          />
          {groups && (
            <p className="text-sm text-sub">
              그룹 {groups.length}개 · 멤버 {memberCount}명
            </p>
          )}
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
              groups && (
                <Button
                  onClick={() => setOrdering(groups)}
                  disabled={groups.length < 2}
                >
                  그룹 순서 수정
                </Button>
              )
            )}
          </div>
        </div>

        {ordering && (
          <p className="text-sm text-muted">
            끌어서 순서를 바꾸세요. 위에 있을수록 앱의 그룹 목록에서 앞에
            보여요. 멤버 순서는 그룹의 수정 화면에서 바꿔요.
          </p>
        )}

        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !groups ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : shown.length === 0 ? (
          <p className="py-24 text-center text-sm text-sub">
            {searching ? '찾는 그룹·멤버가 없어요.' : '등록된 그룹이 없어요.'}
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {shown.map(({ group, members }, index) => (
              <GroupCard
                key={group.id}
                group={group}
                members={members}
                open={searching || openIds.has(group.id)}
                onToggle={() => toggle(group.id)}
                ordering={
                  ordering && {
                    index,
                    count: ordering.length,
                    move: (to) => move(index, to),
                    drag: dragProps(index),
                  }
                }
              />
            ))}
          </ol>
        )}
      </main>
      <Toast toast={toast} />
    </>
  )
}

export default ArtistsPage
