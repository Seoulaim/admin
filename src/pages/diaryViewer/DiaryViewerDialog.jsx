import { useCallback, useEffect, useState } from 'react'
import { openMemberDiary } from '../../api/memberDiaries.js'
import Button from '../../components/Button.jsx'
import Dialog from '../../components/Dialog.jsx'
import LoadError from '../../components/LoadError.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatDateTime } from '../../lib/dates.js'
import SpreadView from './SpreadView.jsx'

const PURPOSES = {
  'refund-review': '환불 검토',
}

// Loads each font's CSS once (texts use the editor's fonts).
function useFontStylesheets(fonts) {
  useEffect(() => {
    for (const font of fonts ?? []) {
      if (
        document.querySelector(
          `link[data-font="${CSS.escape(font.stylesheetUrl)}"]`,
        )
      ) {
        continue
      }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = font.stylesheetUrl
      link.dataset.font = font.stylesheetUrl
      document.head.append(link)
    }
  }, [fonts])
}

// A member's diary, page by page, opened for `purpose` (logged): a finished
// one as its page images, one being edited drawn from its spreads.
function DiaryViewerDialog({ diaryId, purpose, onClose }) {
  const fetcher = useCallback(
    () => openMemberDiary(diaryId, purpose),
    [diaryId, purpose],
  )
  const { data, error, reload } = useFetch(fetcher)
  const [page, setPage] = useState(0)
  useFontStylesheets(data?.fonts)
  const pageCount = (data?.pages ?? data?.spreads)?.length ?? 0

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowRight')
        setPage((p) => Math.min(p + 1, pageCount - 1))
      if (event.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pageCount])

  const spread = data?.spreads?.[page]

  return (
    <Dialog
      open
      title={
        data
          ? `${data.diary.name ?? '다이어리'} · 회원 다이어리 열람`
          : '회원 다이어리 열람'
      }
      onClose={onClose}
      className="max-w-5xl"
      footer={
        data && (
          <>
            <span className="mr-auto text-xs text-sub">
              {PURPOSES[purpose]} 목적으로 열람했어요. 열람 기록이 남아요.
            </span>
            <Button onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              ← 이전
            </Button>
            <span className="w-16 text-center text-sm font-semibold tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <Button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pageCount - 1}
            >
              다음 →
            </Button>
          </>
        )
      }
    >
      {error ? (
        <LoadError onRetry={reload} className="py-20" />
      ) : !data ? (
        <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-panel p-3 sm:p-5">
            {data.pages ? (
              <img
                src={data.pages[page]}
                alt={`${page + 1}쪽`}
                className="w-full bg-white shadow-card"
              />
            ) : (
              <SpreadView
                key={page}
                spread={spread}
                template={data.templates.find(
                  (t) => t.id === spread.templateId,
                )}
                stickers={data.stickers}
                fonts={data.fonts}
              />
            )}
          </div>
          <p className="text-xs text-sub">
            {data.pages
              ? `완성할 때 만들어진 페이지 이미지예요. 완성 ${formatDateTime(data.diary.completedAt)}`
              : '앱 편집기와 같은 데이터로 그린 화면이에요. 글자 위치 등은 앱과 조금 다를 수 있어요. 다이어리 상태: 편집 중'}
          </p>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer font-semibold">
              열람 기록 {data.views.length}건
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {data.views.map((view) => (
                <li key={view.at} className="tabular-nums">
                  {formatDateTime(view.at)} · {view.adminName} ·{' '}
                  {PURPOSES[view.purpose]}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </Dialog>
  )
}

export default DiaryViewerDialog
