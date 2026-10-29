import { useEffect, useRef, useState } from 'react'
import { loadNaverMaps, onNaverMapsAuthFailure } from '../../lib/naverMaps.js'

const ZOOM = 16

// Naver map with one draggable pin at lat / lng; dragging it calls
// onChange(lat, lng). Without a position yet, or when the map can't load
// (unregistered domain, no network), it says so instead.
function PinMap({ lat, lng, onChange, className = '' }) {
  const boxRef = useRef(null)
  const mapRef = useRef(null) // { maps, map, marker } once made
  const onChangeRef = useRef(onChange)
  const position = useRef({ lat, lng }) // latest, for when the map loads
  const [failed, setFailed] = useState(false)
  const hasPin = lat != null && lng != null

  useEffect(() => {
    onChangeRef.current = onChange
    position.current = { lat, lng }
  })

  useEffect(
    () =>
      onNaverMapsAuthFailure(() => {
        mapRef.current = null // Naver's objects are broken now; leave them
        setFailed(true)
      }),
    [],
  )

  // Make the map once there's a position (and destroy it on the way out).
  useEffect(() => {
    if (!hasPin) return
    let ignore = false
    loadNaverMaps().then(
      (maps) => {
        if (ignore || !boxRef.current) return
        const { lat, lng } = position.current
        const center = new maps.LatLng(lat, lng)
        const map = new maps.Map(boxRef.current, { center, zoom: ZOOM })
        const marker = new maps.Marker({
          position: center,
          map,
          draggable: true,
        })
        maps.Event.addListener(marker, 'dragend', () => {
          const p = marker.getPosition()
          onChangeRef.current(
            Number(p.lat().toFixed(6)),
            Number(p.lng().toFixed(6)),
          )
        })
        mapRef.current = { maps, map, marker }
      },
      () => !ignore && setFailed(true),
    )
    return () => {
      ignore = true
      try {
        mapRef.current?.map.destroy()
      } catch {
        // A map Naver refused can't clean itself up; nothing to do.
      }
      mapRef.current = null
    }
  }, [hasPin])

  // Move the pin when the position changes from outside (e.g. 좌표 찾기).
  useEffect(() => {
    const current = mapRef.current
    if (!current || !hasPin) return
    const next = new current.maps.LatLng(lat, lng)
    if (!current.marker.getPosition().equals(next)) {
      current.marker.setPosition(next)
      current.map.setCenter(next)
    }
  }, [hasPin, lat, lng])

  return (
    <div
      className={`relative isolate overflow-hidden rounded-xl border border-border bg-[#eef0f2] ${className}`}
    >
      {/* Not absolutely placed: Naver sets position: relative on it. */}
      <div ref={boxRef} className={`size-full ${failed ? 'invisible' : ''}`} />
      {(!hasPin || failed) && (
        <p className="absolute inset-0 flex items-center justify-center bg-[#eef0f2] px-6 text-center text-sm text-sub">
          {!hasPin
            ? '한국어 주소를 넣고 ‘좌표 찾기’를 누르면 지도에 핀이 보여요.'
            : `지도를 불러오지 못했어요. 어드민 주소를 네이버 클라우드 콘솔의 Web 서비스 URL에 등록해야 해요. 지금 좌표: ${lat}, ${lng} (아래에서 직접 고칠 수 있어요)`}
        </p>
      )}
    </div>
  )
}

export default PinMap
