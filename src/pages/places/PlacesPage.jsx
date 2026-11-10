import { useLocation, useNavigate, useParams } from 'react-router'
import { getGroups } from '../../api/artists.js'
import { getKeywords, getPlaces } from '../../api/places.js'
import Card from '../../components/Card.jsx'
import LoadError from '../../components/LoadError.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import PlaceForm from './PlaceForm.jsx'
import PlaceList from './PlaceList.jsx'
import PlacesLayout from './PlacesLayout.jsx'

const loadAll = () =>
  Promise.all([getPlaces(), getGroups(), getKeywords()]).then(
    ([places, groups, keywords]) => ({ places, groups, keywords }),
  )

// 장소 관리 (Figma: list left, editor right). /places: nothing open,
// /places/new: a new place, /places/:placeId: that place.
function PlacesPage() {
  const { placeId } = useParams()
  const isNew = useLocation().pathname === '/places/new'
  const navigate = useNavigate()
  const { data, error, reload, update } = useFetch(loadAll)
  const { toast, showToast } = useToast()

  function saved(place, message = '저장했어요.') {
    update((d) => ({
      ...d,
      places: [place, ...d.places.filter((p) => p.id !== place.id)],
    }))
    showToast(message)
    if (place.id !== placeId) navigate(`/places/${place.id}`, { replace: true })
  }

  function deleted(id) {
    update((d) => ({ ...d, places: d.places.filter((p) => p.id !== id) }))
    showToast('삭제했어요.')
    navigate('/places', { replace: true })
  }

  const place = data?.places.find((p) => p.id === placeId)

  return (
    <PlacesLayout>
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:gap-6">
            <PlaceList
              places={data.places}
              groups={data.groups}
              selectedId={placeId}
            />
            {isNew || place ? (
              <PlaceForm
                key={placeId ?? 'new'}
                initial={place ?? null}
                groups={data.groups}
                keywords={data.keywords}
                onSaved={saved}
                onDeleted={deleted}
                onError={showToast}
              />
            ) : (
              <Card className="px-6 py-24 text-center text-sm text-sub">
                {placeId
                  ? '없는 장소예요. 삭제됐을 수 있어요.'
                  : '왼쪽에서 장소를 고르거나 ‘새 장소 추가’를 누르세요.'}
              </Card>
            )}
          </div>
        )}
      </main>
      <Toast toast={toast} />
    </PlacesLayout>
  )
}

export default PlacesPage
