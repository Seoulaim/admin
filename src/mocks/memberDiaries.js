import { payments } from './db.js'
import { templates } from './diary.js'

// What members put in their diaries (the member app's saveDiarySpreads /
// finalizeDiary data), made up from the example templates and photos.
// Only diaries being edited have this; a finished one is page images.
// spread: { templateId, frames: { [frameId]: { photoUrl, x, y, zoom } },
//   stickers: [{ stickerId, x, y, width, rotation }],
//   texts: [{ text, fontId, x, y, size, rotation }],
//   strokes: [{ color, size, points: [[x, y] …] }] — 1000 units wide }
const PHOTOS = [
  '/mock/event-billboard.jpg',
  '/mock/banner-dejavu.jpg',
  '/mock/event-birthday.jpg',
  '/mock/goods-photocards.jpg',
  '/mock/bias-san.png',
  '/mock/bias-hongjoong.png',
  '/mock/bias-yunho.png',
  '/mock/bias-seonghwa.png',
]
const STICKERS = ['es-heart', 'es-star', 'es-sparkle', 'es-ribbon']
const NOTES = [
  'Best day ever!',
  '오늘 너무 좋았다 ♡',
  'See you again Seoul',
  '최애 만난 날',
]

const inUse = templates.filter((t) => t.usedBy > 0)

function makeSpreads(seed, pages) {
  return Array.from({ length: pages }, (_, page) => {
    const template = inUse[(seed + page) % inUse.length]
    const frames = {}
    template.frames.forEach((frame, i) => {
      if ((seed + page + i) % 5 === 4) return // a frame left empty
      frames[frame.id] = {
        photoUrl: PHOTOS[(seed * 3 + page * 2 + i) % PHOTOS.length],
        x: 0,
        y: 0,
        zoom: 1 + ((page + i) % 3) * 0.15,
      }
    })
    return {
      templateId: template.id,
      frames,
      stickers: [
        {
          stickerId: STICKERS[(seed + page) % STICKERS.length],
          x: 0.44,
          y: 0.06 + (page % 3) * 0.25,
          width: 0.08,
          rotation: -10 + page * 7,
        },
      ],
      texts:
        page % 2 === 0
          ? [
              {
                text: NOTES[(seed + page) % NOTES.length],
                fontId: 'handwriting',
                x: 0.56,
                y: 0.8,
                size: 0.05,
                rotation: -3,
              },
            ]
          : [],
      strokes:
        page === 0
          ? [
              {
                color: '#ff6b9c',
                size: 4,
                points: [
                  [560, 640],
                  [600, 620],
                  [640, 650],
                  [680, 625],
                ],
              },
            ]
          : [],
    }
  })
}

const withPages = payments.filter((p) => p.diary.pages > 0)

// diary id → spreads (as many as the payment says it has pages).
export const diarySpreads = Object.fromEntries(
  withPages
    .filter((p) => !p.diary.completedAt)
    .map((p, i) => [p.diary.id, makeSpreads(i, p.diary.pages)]),
)

// Finished diaries: diary id → page image URLs, in order (the member app's
// saveFinishedPages). The template images stand in for the JPGs.
export const finishedPages = Object.fromEntries(
  withPages
    .filter((p) => p.diary.completedAt)
    .map((p) => [
      p.diary.id,
      Array.from(
        { length: p.diary.pages },
        (_, page) => templates[page % templates.length].imageUrl,
      ),
    ]),
)

// Who opened a member's diary in the admin, when and why (privacy log).
export const diaryViews = []
