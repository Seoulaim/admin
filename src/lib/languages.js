// Member app languages, in its order. Text the admin writes is saved as
// { en, ko, zh, ja }; English is required, the app falls back to it.
export const LANGUAGES = [
  { id: 'en', label: 'EN', name: '영어' },
  { id: 'ko', label: 'KO', name: '한국어' },
  { id: 'zh', label: 'ZH', name: '중국어' },
  { id: 'ja', label: 'JA', name: '일본어' },
]

// "영어" for 'en'.
export const languageName = (id) =>
  LANGUAGES.find((l) => l.id === id)?.name ?? id
