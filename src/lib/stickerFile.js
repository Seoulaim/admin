// Checks a sticker file before it's uploaded. Stickers are cut-outs: a PNG
// / WebP with a transparent background (photos cut out), or a plain vector
// SVG (drawn illustrations — stays sharp at any size).

export const STICKER_TYPES = 'image/png,image/webp,image/svg+xml,.svg'
export const MIN_STICKER_SIDE = 1000 // px, long side, for PNG / WebP

const isSvg = (file) =>
  file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')

// Whether the image's edge has transparent pixels (a cut-out has).
function hasTransparentEdge(bitmap) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  context.drawImage(bitmap, 0, 0, size, size)
  const { data } = context.getImageData(0, 0, size, size)
  for (let i = 0; i < size; i++) {
    for (const [x, y] of [
      [i, 0],
      [i, size - 1],
      [0, i],
      [size - 1, i],
    ]) {
      if (data[(y * size + x) * 4 + 3] < 250) return true
    }
  }
  return false
}

// Resolves with { ok, warnings: [message] }; ok false means it can't be used.
export async function checkStickerFile(file) {
  if (isSvg(file)) {
    const text = await file.text()
    const warnings = []
    if (/<text[\s>]/.test(text)) {
      warnings.push(
        '글자가 들어 있어요. Figma에서 윤곽선으로 바꿔(Outline) 다시 내보내 주세요.',
      )
    }
    if (/<image[\s>]/.test(text)) {
      warnings.push(
        '안에 사진(비트맵)이 들어 있어요. 이런 스티커는 PNG로 올리는 게 좋아요.',
      )
    }
    return { ok: text.includes('<svg'), warnings }
  }
  if (!/^image\/(png|webp)$/.test(file.type)) {
    return {
      ok: false,
      warnings: [
        'PNG, WebP, SVG만 올릴 수 있어요. (JPG는 배경이 투명하지 않아요)',
      ],
    }
  }
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { ok: false, warnings: ['이미지를 읽지 못했어요.'] }
  }
  const warnings = []
  const side = Math.max(bitmap.width, bitmap.height)
  if (side < MIN_STICKER_SIDE) {
    warnings.push(
      `긴 변이 ${side}px예요. 크게 붙이면 흐려질 수 있어 ${MIN_STICKER_SIDE}px 이상을 권장해요.`,
    )
  }
  if (!hasTransparentEdge(bitmap)) {
    warnings.push(
      '가장자리가 투명하지 않아요. 누끼(배경 지우기)가 됐는지 확인해 주세요.',
    )
  }
  bitmap.close()
  return { ok: true, warnings }
}

// "heart-pink.png" → "heart pink", the starting English name.
export const nameFromFile = (file) =>
  file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
