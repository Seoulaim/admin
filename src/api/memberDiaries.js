import { admin, payments } from '../mocks/db.js'
import { fonts, stickers, templates } from '../mocks/diary.js'
import { diarySpreads, diaryViews } from '../mocks/memberDiaries.js'
import { ApiError, handle } from '../mocks/server.js'

// Reading a member's diary in the admin. Only for checking a request — a
// refund outside the policy, or reopening a paid diary finished by
// mistake — and every opening is logged (who, when, why); the privacy
// policy says so. purpose: 'refund-review' | 'reopen-review'.
//
// Resolves with { diary, spreads, templates, stickers, fonts, views }:
// - spreads: the member app's saved spreads (see mocks/memberDiaries.js);
// - templates / stickers / fonts: what's needed to draw them;
// - views: this diary's access log, newest first.
// Rejects with 'NOT_FOUND' (e.g. a deleted diary).
export function openMemberDiary(diaryId, purpose) {
  return handle(() => {
    const spreads = diarySpreads[diaryId]
    const payment = payments.find((p) => p.diary.id === diaryId)
    if (!spreads || !payment) throw new ApiError('NOT_FOUND')
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
    return {
      diary: payment.diary,
      spreads,
      templates,
      stickers,
      fonts,
      views: diaryViews.filter((v) => v.diaryId === diaryId).reverse(),
    }
  })
}

// Lets the member edit a finished, paid diary again (Done pressed too
// early). reason: kept with the diary and emailed to the member. The
// refund period doesn't restart. Rejects with 'NOT_FINISHED' or
// 'NOT_PAID'.
export function reopenDiary(paymentId, reason) {
  return handle(() => {
    const payment = payments.find((p) => p.id === paymentId)
    if (!payment) throw new ApiError('NOT_FOUND')
    if (!payment.diary.finishedAt) throw new ApiError('NOT_FINISHED')
    const entry = {
      at: new Date().toISOString(),
      adminName: admin.name,
      reason,
    }
    // Every payment of this diary shares the diary.
    for (const p of payments.filter((p) => p.diary.id === payment.diary.id)) {
      p.diary.finishedAt = null
      p.diary.reopened = [...p.diary.reopened, entry]
    }
    return payment.diary
  }, 600)
}
