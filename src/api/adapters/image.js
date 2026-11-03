import { uploadedFile } from '../uploads.js'

// 백엔드 이미지는 S3 object key 로 오고, 화면은 URL 을 쓴다.
const IMAGE_BASE_URL = (import.meta.env.VITE_IMAGE_BASE_URL ?? '').replace(
  /\/+$/,
  '',
)

// key → 화면용 URL ('' when there is no key).
export function imageUrlFromKey(key) {
  if (!key) return ''
  return `${IMAGE_BASE_URL}/${key.replace(/^\/+/, '')}`
}

// 화면이 들고 있는 url 이 이번에 새로 업로드한 이미지면 그 fileId, 기존
// 이미지(백엔드에서 받은 URL)면 null — 요청에서 생략해 기존 값을 유지한다.
export function fileIdForUrl(url) {
  return (url && uploadedFile(url)?.fileId) || null
}
