// Naver Cloud Platform Maps, same Client ID as the member app. It's public
// by design but only works on the web service URLs registered in the NCP
// console — add the admin's domain there (and localhost for development).
// The geocoder submodule turns addresses into coordinates with the same
// Client ID (the application needs Geocoding enabled in the NCP console);
// the Client Secret is never used here.
const CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'mbfoehcpmn'

let loading = null
// Naver reports a refused Client ID after the script has loaded, so maps
// already made are broken too: they listen here and stop using the map.
let authFailed = false
const authListeners = new Set()

export function onNaverMapsAuthFailure(listener) {
  if (authFailed) listener()
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

// Resolves with window.naver.maps; rejects when the script can't load or the
// Client ID is refused (e.g. a domain that isn't registered).
export function loadNaverMaps() {
  if (authFailed) return Promise.reject(new Error('NAVER_MAPS_AUTH_FAILED'))
  if (window.naver?.maps) return Promise.resolve(window.naver.maps)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}&language=ko&submodules=geocoder`
    script.async = true
    script.onload = () =>
      window.naver?.maps
        ? resolve(window.naver.maps)
        : reject(new Error('NAVER_MAPS_UNAVAILABLE'))
    script.onerror = () => reject(new Error('NAVER_MAPS_UNAVAILABLE'))
    window.navermap_authFailure = () => {
      authFailed = true
      reject(new Error('NAVER_MAPS_AUTH_FAILED'))
      for (const listener of authListeners) listener()
    }
    document.head.append(script)
  }).catch((error) => {
    loading = null
    throw error
  })
  return loading
}

// The geocoder submodule arrives a moment after the map script; resolves
// with window.naver.maps once maps.Service is ready (rejects after ~5 s).
export async function loadNaverGeocoder() {
  const maps = await loadNaverMaps()
  for (let waited = 0; !maps.Service?.geocode; waited += 100) {
    if (waited >= 5000) throw new Error('NAVER_GEOCODER_UNAVAILABLE')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return maps
}
