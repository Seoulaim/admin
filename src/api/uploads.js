import { ApiError, handle } from '../mocks/server.js'

const UPLOAD_DELAY_MS = 500 // mock: long enough to see the uploading state

// { width, height } of an image file. SVG (which createImageBitmap can't
// read) is measured by loading it.
async function imageSize(file) {
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      return { width: image.naturalWidth, height: image.naturalHeight }
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

// Image upload (banners, places, stickers, templates …): { url, width,
// height }. Rejects with 'INVALID_IMAGE' when the file isn't an image.
// The mock keeps the browser's object URL (gone after a reload); the real
// API sends the file as multipart/form-data and returns the stored URL,
// which must allow CORS (the member app draws images into PDFs).
export async function uploadImage(file) {
  let size
  try {
    size = await imageSize(file)
  } catch {
    throw new ApiError('INVALID_IMAGE')
  }
  return handle(
    () => ({ url: URL.createObjectURL(file), ...size }),
    UPLOAD_DELAY_MS,
  )
}
