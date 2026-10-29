// Group and member photos are shown in circles in the member app.
export const PHOTO_ASPECT = { width: 200, height: 200 }

const normalize = (text) => text.toLowerCase().replace(/[\s-]/g, '')

// Whether any language of a { en, ko, zh, ja } name contains the query
// (spaces, dashes and case ignored, like the member app's search).
export function nameMatches(name, query) {
  const q = normalize(query)
  return Object.values(name).some((value) => normalize(value).includes(q))
}

// "ATEEZ · 에이티즈 · …" — every language that's filled in, English first.
export const allNames = (name) =>
  ['en', 'ko', 'zh', 'ja']
    .map((language) => name[language])
    .filter(Boolean)
    .join(' · ')
