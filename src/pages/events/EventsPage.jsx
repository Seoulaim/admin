import { useCallback, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { getGroups } from '../../api/artists.js'
import {
  deleteBirthdayCafe,
  deleteCalendarEntry,
  getBirthdayCafes,
  getCalendarEntries,
} from '../../api/events.js'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { fromDateKey, todayKey } from '../../lib/dates.js'
import { ALL_GROUPS, calendarDays, pickText } from '../../lib/events.js'
import EventsPanel from './EventsPanel.jsx'
import MonthCalendar from './MonthCalendar.jsx'

const loadAll = () =>
  Promise.all([getCalendarEntries(), getBirthdayCafes(), getGroups()]).then(
    ([entries, cafes, groups]) => ({ entries, cafes, groups }),
  )

// 이벤트 관리: the fan calendar on the left (with 일정 추가 on top), and on
// the right the selected day, Event coming up cards and birthday cafes.
// The day, tab and group filter are kept in the URL so coming back from a
// form lands where you were.
function EventsPage() {
  const { data, error, reload, update } = useFetch(loadAll)
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.get('date') ?? todayKey()
  const tab = searchParams.get('tab') ?? 'day'
  const groupFilter = searchParams.get('group') ?? ''
  const [month, setMonth] = useState(() => {
    const date = fromDateKey(selected)
    return { year: date.getFullYear(), month: date.getMonth() }
  })
  const location = useLocation()
  const { toast, showToast } = useToast(location.state?.toast)
  const [deleting, setDeleting] = useState(null) // { kind, item, label }
  const [deleteBusy, setDeleteBusy] = useState(false)

  const setParam = useCallback(
    (changes) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      ),
    [setSearchParams],
  )

  function shiftMonth(delta) {
    setMonth(({ year, month }) => {
      const date = new Date(year, month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  function goToday() {
    const date = fromDateKey(todayKey())
    setMonth({ year: date.getFullYear(), month: date.getMonth() })
    setParam({ date: null, tab: null })
  }

  async function confirmDelete() {
    const { kind, item } = deleting
    setDeleteBusy(true)
    try {
      if (kind === 'cafe') {
        await deleteBirthdayCafe(item.id)
        update((d) => ({
          ...d,
          cafes: d.cafes.filter((c) => c.id !== item.id),
        }))
      } else {
        await deleteCalendarEntry(item.id)
        update((d) => ({
          ...d,
          entries: d.entries.filter((e) => e.id !== item.id),
        }))
      }
      showToast('삭제했어요.')
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="이벤트 관리" />
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        )}
      </>
    )
  }

  const memberGroup = (memberId) =>
    data.groups.find((g) => g.members.some((m) => m.id === memberId))
  const entries = data.entries.filter(
    (e) =>
      !groupFilter ||
      e.groupIds.includes(ALL_GROUPS) ||
      e.groupIds.includes(groupFilter),
  )
  const cafes = data.cafes.filter(
    (c) => !groupFilter || memberGroup(c.memberId)?.id === groupFilter,
  )

  return (
    <>
      <PageHeader title="이벤트 관리" />
      <main className="grid items-start gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="이전 달"
                onClick={() => shiftMonth(-1)}
                className="flex size-9 items-center justify-center rounded-lg text-lg hover:bg-chip"
              >
                ‹
              </button>
              <h2 className="min-w-28 text-center text-lg font-bold tabular-nums">
                {month.year}년 {month.month + 1}월
              </h2>
              <button
                type="button"
                aria-label="다음 달"
                onClick={() => shiftMonth(1)}
                className="flex size-9 items-center justify-center rounded-lg text-lg hover:bg-chip"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              onClick={goToday}
              className={buttonClass('outline', 'sm')}
            >
              오늘
            </button>
            <select
              aria-label="그룹별로 보기"
              value={groupFilter}
              onChange={(event) => setParam({ group: event.target.value })}
              className="ml-auto h-10 rounded-lg border border-border bg-white px-3 text-sm font-medium outline-none focus:border-point"
            >
              <option value="">모든 그룹</option>
              {data.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name.en} 팬에게 보이는 것
                </option>
              ))}
            </select>
            <Link
              to={`/events/new?date=${selected}`}
              className={buttonClass('primary')}
            >
              일정 추가
            </Link>
          </div>

          <MonthCalendar
            month={month}
            days={calendarDays(entries)}
            selected={selected}
            onSelect={(date) => {
              const picked = fromDateKey(date)
              if (picked.getMonth() !== month.month) {
                setMonth({
                  year: picked.getFullYear(),
                  month: picked.getMonth(),
                })
              }
              setParam({ date, tab: null })
            }}
          />
          <p className="text-xs text-sub">
            앱의 팬캘린더와 같아요. 사진을 넣은 일정은 Event coming up에도
            보여요(달력에는 사진이 나오지 않아요).
            {groupFilter && ' 선택한 그룹과 ALL 항목만 보여요.'}
          </p>
        </Card>

        <EventsPanel
          tab={tab}
          onTab={(next) => setParam({ tab: next === 'day' ? null : next })}
          selected={selected}
          entries={entries}
          cafes={cafes}
          groups={data.groups}
          memberGroup={memberGroup}
          onDelete={(kind, item) =>
            setDeleting({
              kind,
              item,
              label:
                kind === 'cafe' ? pickText(item.venue) : pickText(item.title),
            })
          }
        />
      </main>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={
          deleting?.kind === 'cafe' ? '생일카페를 삭제할까요?' : '삭제할까요?'
        }
        message={
          deleting && `'${deleting.label}'을(를) 삭제하면 되돌릴 수 없어요.`
        }
        confirmLabel="삭제"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <Toast toast={toast} />
    </>
  )
}

export default EventsPage
