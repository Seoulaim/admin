// "mina@example.com" → "mi**@example.com": lists show personal details
// partly hidden; the full value is on the detail screen (whose opening is
// logged).
export function maskEmail(email) {
  const [user, domain] = email.split('@')
  const shown = user.slice(0, Math.min(2, Math.max(1, user.length - 1)))
  return `${shown}${'*'.repeat(Math.max(2, user.length - shown.length))}@${domain}`
}

// "Mina Choi" → "M*** C***", "김다미" → "김*미".
export function maskName(name) {
  if (/^[\p{Script=Hangul}]+$/u.test(name) && name.length >= 3) {
    return name[0] + '*'.repeat(name.length - 2) + name.at(-1)
  }
  return name
    .split(' ')
    .map((part) => part[0] + '*'.repeat(Math.max(1, part.length - 1)))
    .join(' ')
}
