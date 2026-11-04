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

// 화면의 url → 백엔드 s3 key (imageKey·imageKeys 로 보낼 때). 이번에 새로
// 올린 이미지면 업로드 때 받은 key, 백엔드에서 받은 URL 이면 앞의
// VITE_IMAGE_BASE_URL 을 떼어 낸 key. 둘 다 아니면(빈 값, mock URL) null.
export function keyForUrl(url) {
  if (!url) return null
  const uploaded = uploadedFile(url)
  if (uploaded) return uploaded.s3Key
  const prefix = `${IMAGE_BASE_URL}/`
  return url.startsWith(prefix) && url.length > prefix.length
    ? url.slice(prefix.length)
    : null
}

// 화면이 들고 있는 url 이 이번에 새로 업로드한 이미지면 그 fileId, 기존
// 이미지(백엔드에서 받은 URL)면 null — 요청에서 생략해 기존 값을 유지한다.
export function fileIdForUrl(url) {
  return (url && uploadedFile(url)?.fileId) || null
}
