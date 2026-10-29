import { isNight } from '../lib/mailRules.js'
import { admin } from '../mocks/db.js'
import { autoMails, campaigns } from '../mocks/mail.js'
import { members } from '../mocks/members.js'
import { ApiError, handle } from '../mocks/server.js'

// 공지 관리: mail the admin writes, and the automatic mails' templates.
// The backend sends everything (AWS SES planned) from MAIL_SENDER
// (lib/business.js). Sending "from" a gmail.com address through SES fails
// Gmail's DMARC check, so mail lands in spam: use an address on our own
// domain (e.g. no-reply@seoulaim.com, with SPF / DKIM / DMARC set up) as
// the sender and seoulaimkr@gmail.com as Reply-To.
// Every member mail goes out in the member's app language (English when
// that language is empty).
//
// Campaign kinds:
// - 'marketing' (홍보): only to members who opted in (notifications.
//   marketing). The backend adds "(광고)" before the subject, and the
//   sender's name / contact and an unsubscribe link at the bottom
//   (정보통신망법 제50조); unsubscribing turns notifications.marketing off.
//   Not sent between 21:00 and 08:00 (Seoul) — that needs a separate
//   consent we don't ask for.
// - 'notice' (서비스 공지): information every affected member needs (policy
//   changes, outages …), whatever their mail settings — so no ads in it.
// Campaign: { id, kind, subject, body, audience, status, scheduledAt,
//   sentAt, recipients, createdAt } — see mocks/mail.js.
// audience: { type: 'all' | 'groups' | 'members', groupIds, memberIds };
//   'members' (specific people) is for notices only.

function recipientsOf(kind, audience) {
  return members.filter(
    (m) =>
      (kind !== 'marketing' || m.marketing) &&
      (audience.type === 'all' ||
        (audience.type === 'groups' &&
          m.biasGroupIds.some((g) => audience.groupIds.includes(g))) ||
        (audience.type === 'members' && audience.memberIds.includes(m.id))),
  )
}

// How many would get it: { count, byLanguage: { en: n, … } }.
export function countRecipients(kind, audience) {
  return handle(() => {
    const list = recipientsOf(kind, audience)
    const byLanguage = {}
    for (const m of list)
      byLanguage[m.language] = (byLanguage[m.language] ?? 0) + 1
    return { count: list.length, byLanguage }
  }, 100)
}

// Members matching a nickname / email, for a notice to specific people.
export function searchMembers(query) {
  return handle(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return members
      .filter(
        (m) => m.nickname.toLowerCase().includes(q) || m.email.includes(q),
      )
      .slice(0, 8)
      .map(({ id, nickname, email }) => ({ id, nickname, email }))
  }, 100)
}

// Newest first.
export function getCampaigns() {
  return handle(() =>
    [...campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
}

export function getCampaign(id) {
  return handle(() => {
    const campaign = campaigns.find((c) => c.id === id)
    if (!campaign) throw new ApiError('NOT_FOUND')
    return campaign
  })
}

// fields: { kind, subject, body, audience }. mode: 'draft' (임시저장),
// 'send' (now) or 'schedule' (at scheduledAt). id: an existing draft.
// Rejects with 'NIGHT_MARKETING' for marketing at night, 'NO_RECIPIENTS'.
export function saveCampaign(id, fields, mode, scheduledAt = null) {
  return handle(() => {
    const when = mode === 'schedule' ? scheduledAt : new Date().toISOString()
    if (mode !== 'draft' && fields.kind === 'marketing' && isNight(when)) {
      throw new ApiError('NIGHT_MARKETING')
    }
    const recipients = recipientsOf(fields.kind, fields.audience).length
    if (mode !== 'draft' && recipients === 0)
      throw new ApiError('NO_RECIPIENTS')
    const existing = campaigns.find((c) => c.id === id)
    const campaign = {
      ...fields,
      id: existing?.id ?? `mc-${Date.now()}`,
      status: { draft: 'draft', send: 'sent', schedule: 'scheduled' }[mode],
      scheduledAt: mode === 'schedule' ? scheduledAt : null,
      sentAt: mode === 'send' ? when : null,
      recipients: mode === 'draft' ? 0 : recipients,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    if (existing) Object.assign(existing, campaign)
    else campaigns.push(campaign)
    return campaign
  }, 700)
}

// Scheduled → canceled (sent mail can't be taken back).
export function cancelCampaign(id) {
  return handle(() => {
    const campaign = campaigns.find((c) => c.id === id)
    if (campaign?.status !== 'scheduled') throw new ApiError('NOT_SCHEDULED')
    campaign.status = 'canceled'
    return campaign
  })
}

// Sends the mail as it would look (in `language`) to the admin's address.
export function sendTestMail(fields, language) {
  return handle(() => ({ to: admin.email, language, kind: fields.kind }), 500)
}

// --- Automatic mails ---

// [{ id, name, trigger, variables, subject, body, sentLast30Days }]
export function getAutoMails() {
  return handle(() => autoMails)
}

// fields: { subject, body } ({ en, ko, zh, ja }; {variable}s kept).
export function updateAutoMail(id, fields) {
  return handle(() => {
    const mail = autoMails.find((m) => m.id === id)
    if (!mail) throw new ApiError('NOT_FOUND')
    return Object.assign(mail, fields)
  })
}
