// 다이어리 관리 data, moved from the member app (mocks/db.js), in the admin
// order. Templates now have photo frames only: writing spots (notes) were
// dropped — post-its are drawn in the background and members add their own
// text.

const frame = (id, x, y, width, height, rotation = 0) => ({
  id,
  x,
  y,
  width,
  height,
  rotation,
})

// usedBy: how many member diaries use it (from the backend) — their photos
// are tied to its frame ids.
export const templates = [
  {
    id: 'tpl-a',
    name: { en: 'Template A', zh: '模板 A' },
    imageUrl: '/mock/template-a.png',
    overlayUrl: '/mock/template-a-overlay.png',
    aspect: 1270 / 894,
    frames: [
      frame('a1', 0.0591, 0.2315, 0.3835, 0.406),
      frame('a2', 0.5378, 0.0996, 0.2142, 0.3915, -5),
      frame('a3', 0.7677, 0.2528, 0.1913, 0.3859, 5),
    ],
    visible: true,
    usedBy: 12,
  },
  {
    id: 'tpl-b',
    name: { en: 'Template B', zh: '模板 B' },
    imageUrl: '/mock/template-b.png',
    overlayUrl: '',
    aspect: 1144 / 812,
    frames: [
      frame('b1', 0.0402, 0.1527, 0.4143, 0.702),
      frame('b2', 0.5341, 0.0456, 0.1678, 0.2365),
      frame('b3', 0.8007, 0.3227, 0.1678, 0.234),
      frame('b4', 0.5341, 0.5985, 0.1678, 0.234),
    ],
    visible: true,
    usedBy: 3,
  },
  {
    id: 'tpl-c',
    name: { en: 'Template C' },
    imageUrl: '/mock/template-c.png',
    overlayUrl: '',
    aspect: 1316 / 934,
    frames: [
      frame('c1', 0.0821, 0.394, 0.1216, 0.1724, 13),
      frame('c2', 0.0448, 0.5835, 0.1185, 0.1799, 15),
      frame('c3', 0.0091, 0.7794, 0.117, 0.1831, 15),
      frame('c4', 0.2302, 0.5482, 0.212, 0.2976),
      frame('c5', 0.7044, 0.0996, 0.1292, 0.1981),
      frame('c6', 0.8146, 0.2441, 0.1292, 0.1734, 4),
      frame('c7', 0.5281, 0.7066, 0.2226, 0.2227),
    ],
    visible: true,
    usedBy: 0,
  },
  {
    id: 'tpl-d',
    name: { en: 'Template D' },
    imageUrl: '/mock/template-d.png',
    overlayUrl: '',
    aspect: 1050 / 742,
    frames: [
      frame('d1', 0.5019, 0, 0.4981, 0.3329),
      frame('d2', 0.5019, 0.3356, 0.4981, 0.3329),
      frame('d3', 0.5019, 0.6712, 0.4981, 0.3288),
    ],
    visible: true,
    usedBy: 0,
  },
]

export const stickerCategories = [
  { id: 'hand-drawing', name: { en: 'Hand-drawing', zh: '手绘' } },
  { id: 'cute', name: { en: 'Cute', zh: '可爱' } },
  { id: 'pink', name: { en: 'Pink', zh: '粉色' } },
  { id: 'blue', name: { en: 'Blue', zh: '蓝色' } },
]

const sticker = (id, name, file, categoryIds) => ({
  id,
  name: { en: name },
  imageUrl: `/mock/editor-stickers/${file}.svg`,
  categoryIds,
})

export const stickers = [
  sticker('es-star', 'Star', 'star', ['cute', 'pink']),
  sticker('es-heart', 'Heart', 'heart', ['cute', 'pink']),
  sticker('es-sparkle', 'Sparkle', 'sparkle', ['hand-drawing']),
  sticker('es-cloud', 'Cloud', 'cloud', ['blue']),
  sticker('es-plane', 'Plane', 'plane', ['hand-drawing', 'blue']),
  sticker('es-ribbon', 'Ribbon', 'ribbon', ['cute', 'pink']),
]

const googleFont = (name) =>
  `https://fonts.googleapis.com/css2?family=${name.replaceAll(' ', '+')}&display=swap`

export const fonts = [
  {
    id: 'gothic',
    name: { en: 'Gothic', zh: '黑体' },
    family: "'Nanum Gothic', sans-serif",
    stylesheetUrl: googleFont('Nanum Gothic'),
    previewScale: 1,
  },
  {
    id: 'serif',
    name: { en: 'Serif', zh: '宋体' },
    family: "'Nanum Myeongjo', serif",
    stylesheetUrl: googleFont('Nanum Myeongjo'),
    previewScale: 1,
  },
  {
    id: 'handwriting',
    name: { en: 'Handwriting', zh: '手写体' },
    family: "'Nanum Pen Script', cursive",
    stylesheetUrl: googleFont('Nanum Pen Script'),
    previewScale: 1.15,
  },
  {
    id: 'rounded',
    name: { en: 'Rounded', zh: '圆体' },
    family: "'Jua', sans-serif",
    stylesheetUrl: googleFont('Jua'),
    previewScale: 1,
  },
]
