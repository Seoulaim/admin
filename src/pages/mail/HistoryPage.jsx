import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getGroups } from '../../api/artists.js'
import { cancelCampaign, getCampaigns } from '../../api/mail.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DateRangeFilter from '../../components/form/DateRangeFilter.jsx'
import LoadError from '../../components/LoadError.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { formatDateTime, isDateInRange, seoulDateKey } from '../../lib/dates.js'
import MailLayout from './MailLayout.jsx'
import { CAMPAIGN_STATUS, MAIL_KINDS } from './mailKinds.js'

const loadAll = () =>
  Promise.all([getCampaigns(), getGroups()]).then(([campaigns, groups]) => ({
    campaigns,
    groups,
  }))

// When it went (or will go): sent / scheduled time, or when it was written.
const timeOf = (c) => c.sentAt ?? c.scheduledAt ?? c.createdAt

// 공지 관리 › 발송 내역: mail written here — sent, scheduled (cancelable)
// and drafts (continue writing).
function HistoryPage() {
  const { data, error, reload, update } = useFetch(loadAll)
  const location = useLocation()
  const { toast, showToast } = useToast(location.state?.toast)
  const [kind, setKind] = useState('all')
  const [range, setRange] = useState({ from: '', to: '' })
  const [canceling, setCanceling] = useState(null)

  async function confirmCancel() {
    try {
      const next = await cancelCampaign(canceling.id)
      update((d) => ({
        ...d,
        campaigns: d.campaigns.map((c) => (c.id === next.id ? next : c)),
      }))
      showToast('예약을 취소했어요.')
    } catch {
      showToast('취소하지 못했어요. 이미 보냈을 수 있어요.')
    } finally {
      setCanceling(null)
    }
  }

  const audienceText = (c) =>
    c.audience.type === 'all'
      ? c.kind === 'marketing'
        ? '수신 동의 회원 전체'
        : '회원 전체'
      : c.audience.type === 'groups'
        ? c.audience.groupIds
            .map((id) => data.groups.find((g) => g.id === id)?.name.en ?? id)
            .join(', ')
        : `특정 회원 ${c.audience.memberIds.length}명`
  const chip = (active) =>
    `h-8 rounded-full px-3 text-sm font-semibold ${active ? 'bg-text text-white' : 'text-muted hover:bg-chip'}`

  return (
    <MailLayout>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex gap-1">
            {[
              ['all', '전체'],
              ...Object.entries(MAIL_KINDS).map(([id, k]) => [id, k.label]),
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={chip(kind === id)}
              >
                {label}
              </button>
            ))}
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </Card>
        <Card className="overflow-hidden">
          {error ? (
            <LoadError onRetry={reload} className="py-20" />
          ) : !data ? (
            <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
          ) : (
            (() => {
              const shown = data.campaigns.filter(
                (c) =>
                  (kind === 'all' || c.kind === kind) &&
                  isDateInRange(seoulDateKey(timeOf(c)), range),
              )
              return shown.length === 0 ? (
                <p className="py-20 text-center text-sm text-sub">
                  보낸 메일이 없어요.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {shown.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
                    >
                      <Chip tone={MAIL_KINDS[c.kind].tone}>
                        {MAIL_KINDS[c.kind].label}
                      </Chip>
                      <div className="min-w-0 flex-1 basis-60">
                        <p className="truncate text-sm font-bold">
                          {c.kind === 'marketing' && '(광고) '}
                          {c.subject.ko || c.subject.en}
                        </p>
                        <p className="truncate text-xs text-sub">
                          {audienceText(c)}
                          {c.recipients > 0 && ` · ${c.recipients}명`}
                        </p>
                      </div>
                      <span className="text-xs text-sub tabular-nums">
                        {c.status === 'scheduled' ? '예약 ' : ''}
                        {formatDateTime(timeOf(c))}
                      </span>
                      <Chip tone={CAMPAIGN_STATUS[c.status].tone}>
                        {CAMPAIGN_STATUS[c.status].label}
                      </Chip>
                      <div className="w-24 text-right">
                        {c.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setCanceling(c)}
                          >
                            예약 취소
                          </Button>
                        )}
                        {c.status === 'draft' && (
                          <Link
                            to={`/mail?draft=${c.id}`}
                            className={buttonClass('outline', 'sm')}
                          >
                            이어 쓰기
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            })()
          )}
        </Card>
        <p className="text-xs text-sub">
          보낸 메일은 회원 메일함에 이미 들어가서 되돌릴 수 없어요. 예약한
          메일만 취소할 수 있어요.
        </p>
      </main>
      <ConfirmDialog
        open={Boolean(canceling)}
        title="예약을 취소할까요?"
        message={
          canceling &&
          `${formatDateTime(canceling.scheduledAt)}에 보낼 메일이 가지 않아요.`
        }
        confirmLabel="예약 취소"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setCanceling(null)}
      />
      <Toast toast={toast} />
    </MailLayout>
  )
}

export default HistoryPage
