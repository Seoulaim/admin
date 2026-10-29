// Reads a template exported from Figma as SVG (member app
// docs/diary-templates.md): rectangles with ids photo-1, photo-2 … are the
// photo frames, the group with id overlay is drawn over the photos, and
// everything else is the background. Text should be outlined on export
// (members write their own text; post-its are just drawn).

// Spreads are two A5 pages: A4 landscape.
export const SPREAD_ASPECT = 297 / 210
// Within 1% counts as the right ratio.
export const ASPECT_TOLERANCE = 0.01
// Background / overlay PNGs are rendered at least this wide.
const MIN_RENDER_WIDTH = 2970

const PHOTO_ID = /^photo-(\d+)$/
const round = (n, digits = 4) => Number(n.toFixed(digits))

export function aspectWarning(aspect) {
  return Math.abs(aspect / SPREAD_ASPECT - 1) > ASPECT_TOLERANCE
    ? `비율이 ${round(aspect, 3)}:1이에요. 펼침면은 A4 가로(297:210 ≈ 1.414:1)라서 편집기와 PDF에서 가장자리가 조금 잘려요.`
    : null
}

function renderPng(svgText, width, height) {
  const scale = Math.max(1, MIN_RENDER_WIDTH / width)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      new Blob([svgText], { type: 'image/svg+xml' }),
    )
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      canvas
        .getContext('2d')
        .drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('RENDER_FAILED'))),
        'image/png',
      )
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('RENDER_FAILED'))
    }
    image.src = url
  })
}

// The box of `element` in the image's coordinates: center, size and
// rotation, from its bounding box and every transform above it.
function placedBox(element) {
  const box = element.getBBox()
  const m = element.getCTM()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  return {
    centerX: m.a * cx + m.c * cy + m.e,
    centerY: m.b * cx + m.d * cy + m.f,
    width: box.width * Math.hypot(m.a, m.b),
    height: box.height * Math.hypot(m.c, m.d),
    rotation: (Math.atan2(m.b, m.a) * 180) / Math.PI,
  }
}

// file: the .svg. Resolves with { aspect, frames, background (PNG Blob),
// overlay (PNG Blob | null), warnings: [message] }; rejects with
// Error('NOT_SVG') when it can't be read.
export async function readTemplateSvg(file) {
  const text = await file.text()
  const parsed = new DOMParser().parseFromString(text, 'image/svg+xml')
  const root = parsed.documentElement
  if (root.nodeName !== 'svg' || parsed.querySelector('parsererror')) {
    throw new Error('NOT_SVG')
  }
  const viewBox = (root.getAttribute('viewBox') ?? '')
    .split(/[\s,]+/)
    .map(Number)
  const [minX, minY, width, height] =
    viewBox.length === 4
      ? viewBox
      : [
          0,
          0,
          Number.parseFloat(root.getAttribute('width')),
          Number.parseFloat(root.getAttribute('height')),
        ]
  if (!width || !height) throw new Error('NOT_SVG')

  // Measure in the page (getBBox / getCTM need a rendered SVG).
  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden'
  const live = document.importNode(root, true)
  live.setAttribute('width', width)
  live.setAttribute('height', height)
  holder.append(live)
  document.body.append(holder)

  try {
    const photos = [...live.querySelectorAll('[id]')]
      .map((element) => ({ element, match: element.id.match(PHOTO_ID) }))
      .filter(({ match }) => match)
      .sort((a, b) => Number(a.match[1]) - Number(b.match[1]))
    const frames = photos.map(({ element }) => {
      const b = placedBox(element)
      return {
        id: element.id,
        x: round((b.centerX - b.width / 2) / width),
        y: round((b.centerY - b.height / 2) / height),
        width: round(b.width / width),
        height: round(b.height / height),
        rotation: round(b.rotation, 1),
      }
    })

    // Background: everything but the frames and the overlay.
    const background = root.cloneNode(true)
    for (const element of background.querySelectorAll('[id]')) {
      if (PHOTO_ID.test(element.id) || element.id === 'overlay') {
        element.remove()
      }
    }

    // Overlay: only that group, placed where it was.
    const liveOverlay = live.querySelector('#overlay')
    let overlaySvg = null
    if (liveOverlay) {
      const m = liveOverlay.getCTM()
      const overlay = root.cloneNode(true)
      const group = overlay.querySelector('#overlay').cloneNode(true)
      group.removeAttribute('transform')
      for (const child of [...overlay.children]) {
        if (child.nodeName !== 'defs' && child.nodeName !== 'style')
          child.remove()
      }
      const wrap = parsed.createElementNS('http://www.w3.org/2000/svg', 'g')
      wrap.setAttribute(
        'transform',
        `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e + minX} ${m.f + minY})`,
      )
      wrap.append(group)
      overlay.append(wrap)
      overlaySvg = overlay
    }

    // Image needs an intrinsic size to draw the SVG.
    const serialize = (svg) => {
      svg.setAttribute('width', width)
      svg.setAttribute('height', height)
      return new XMLSerializer().serializeToString(svg)
    }
    const warnings = []
    if (frames.length === 0) {
      warnings.push(
        'photo-1, photo-2 … 레이어를 찾지 못했어요. 아래에서 사진 칸을 직접 그려 주세요.',
      )
    }
    const aspect = width / height
    const ratio = aspectWarning(aspect)
    if (ratio) warnings.push(ratio)
    if (root.querySelector('text')) {
      warnings.push(
        '글자가 남아 있어요. Figma에서 내보낼 때 ‘Outline text’를 켜야 글꼴이 바뀌지 않아요.',
      )
    }
    const external = [...root.querySelectorAll('image')].some(
      (image) =>
        !(
          image.getAttribute('href') ??
          image.getAttribute('xlink:href') ??
          ''
        ).startsWith('data:'),
    )
    if (external) {
      warnings.push(
        '파일 밖의 이미지를 가리키는 곳이 있어 배경에서 빠질 수 있어요.',
      )
    }

    return {
      aspect,
      frames,
      background: await renderPng(serialize(background), width, height),
      overlay:
        overlaySvg && (await renderPng(serialize(overlaySvg), width, height)),
      warnings,
    }
  } finally {
    holder.remove()
  }
}
