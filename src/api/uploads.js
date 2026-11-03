import { ApiError, handle } from '../mocks/server.js'
import { API_BASE_URL, request } from './client.js'

const UPLOAD_DELAY_MS = 500 // mock: long enough to see the uploading state

// 백엔드 어드민 업로드가 받는 이미지 형식 (SVG·HEIC 는 거부).
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// 업로드한 이미지의 url → { fileId, s3Key }. 템플릿·스티커 저장 때
// 어댑터(adapters/image.js)가 꺼내 imageFileId 등으로 보낸다.
const uploaded = new Map()

export function uploadedFile(url) {
  return uploaded.get(url) ?? null
}

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
// options.domain: 백엔드 FileDomain — 'DIARY_STICKER'(기본) | 'DIARY_TEMPLATE'
//   | 'PRODUCT'.
// VITE_API_BASE_URL 이 있으면 어드민 presigned 업로드(POST
// /api/v1/admin/files/presigned-upload → S3 PUT), 없으면 mock (브라우저
// object URL, 새로고침하면 사라짐). 실제 업로드도 url 은 미리보기용 object
// URL 이고, 저장된 이미지는 다음 조회부터 VITE_IMAGE_BASE_URL/s3Key 로 온다.
export async function uploadImage(file, { domain = 'DIARY_STICKER' } = {}) {
  let size
  try {
    size = await imageSize(file)
  } catch {
    throw new ApiError('INVALID_IMAGE')
  }
  if (!API_BASE_URL) {
    return handle(
      () => ({ url: URL.createObjectURL(file), ...size }),
      UPLOAD_DELAY_MS,
    )
  }

  const contentType = file.type
  if (!ACCEPTED_TYPES.includes(contentType)) throw new ApiError('INVALID_IMAGE')

  let presigned
  try {
    presigned = await request('/api/v1/admin/files/presigned-upload', {
      method: 'POST',
      body: { domain, contentType, sizeBytes: file.size },
    })
  } catch (error) {
    if (error.code === 'FILE_INVALID_CONTENT_TYPE') {
      throw new ApiError('INVALID_IMAGE', { status: error.status })
    }
    throw error
  }

  // 서명에 Content-Type·Content-Length 가 들어 있어 요청값과 같아야 한다.
  // Content-Length 는 브라우저가 body(file.size 바이트)로 직접 채운다
  // (fetch 에서 지정할 수 없는 헤더).
  let response
  try {
    response = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      credentials: 'omit',
      headers: { 'Content-Type': contentType },
      body: file,
    })
  } catch {
    throw new ApiError('NETWORK_ERROR')
  }
  if (!response.ok) {
    throw new ApiError('UPLOAD_FAILED', { status: response.status })
  }

  const url = URL.createObjectURL(file)
  uploaded.set(url, { fileId: presigned.fileId, s3Key: presigned.s3Key })
  return { url, ...size }
}
