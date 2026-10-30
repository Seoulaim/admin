import { admin, payments } from '../mocks/db.js'
import { fonts, stickers, templates } from '../mocks/diary.js'
import {
  diarySpreads,
  diaryViews,
  finishedPages,
} from '../mocks/memberDiaries.js'
import { ApiError, handle } from '../mocks/server.js'

// Reading a member's diary in the admin. Only for checking a refund request
// outside the policy (개인정보처리방침 제11조 4호), and every opening is
// logged (who, when, why). purpose: 'refund-review'.
//
// Done turns a diary into page images for good: the server keeps those and
// deletes the spreads and registered photos, and it can never be edited
// again. So this resolves with
// - finished: { diary, pages, views } — pages: image URLs, in order;
// - being edited: { diary, spreads, templates, stickers, fonts, views } —
//   spreads: the member app's saved spreads (see mocks/memberDiaries.js);
//   templates / stickers / fonts: what's needed to draw them.
// A diary whose images haven't arrived yet still has its spreads (the app
// uploads them again) and comes back like one being edited.
// views: this diary's access log, newest first.
// Rejects with 'NOT_FOUND' (e.g. a deleted diary).
export function openMemberDiary(diaryId, purpose) {
  return handle(() => {
    const pages = finishedPages[diaryId]
    const spreads = diarySpreads[diaryId]
    const payment = payments.find((p) => p.diary.id === diaryId)
    if ((!pages && !spreads) || !payment) throw new ApiError('NOT_FOUND')
    // One opening = one entry (the mock can be asked twice in a row in
    // development).
    const last = diaryViews.at(-1)
    const now = new Date()
    if (!(
      last?.diaryId === diaryId &&
      last.purpose === purpose &&
      now - new Date(last.at) < 2000
    )) {
      diaryViews.push({
        diaryId,
        at: now.toISOString(),
        adminName: admin.name,
        purpose,
      })
    }
    const opened = {
      diary: payment.diary,
      views: diaryViews.filter((v) => v.diaryId === diaryId).reverse(),
    }
    return pages
      ? { ...opened, pages }
      : { ...opened, spreads, templates, stickers, fonts }
  })
}
