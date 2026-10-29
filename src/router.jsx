import { createBrowserRouter, redirect } from 'react-router'
import AdminLayout from './components/layout/AdminLayout.jsx'
import { MENU_ITEMS } from './menu.js'
import ArtistsPage from './pages/artists/ArtistsPage.jsx'
import GroupFormPage from './pages/artists/GroupFormPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import FontsPage from './pages/diary/FontsPage.jsx'
import StickersPage from './pages/diary/StickersPage.jsx'
import TemplateEditorPage from './pages/diary/TemplateEditorPage.jsx'
import TemplatesPage from './pages/diary/TemplatesPage.jsx'
import CafeFormPage from './pages/events/CafeFormPage.jsx'
import EntryFormPage from './pages/events/EntryFormPage.jsx'
import EventsPage from './pages/events/EventsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import KeywordsPage from './pages/places/KeywordsPage.jsx'
import PlacesPage from './pages/places/PlacesPage.jsx'
import PlannedPage from './pages/PlannedPage.jsx'
import RouteErrorPage from './pages/RouteErrorPage.jsx'
import PromotionFormPage from './pages/promotions/PromotionFormPage.jsx'
import PromotionsPage from './pages/promotions/PromotionsPage.jsx'

// Screens not built yet show their plan (menu.js), detail links included.
const plannedRoutes = MENU_ITEMS.filter((item) => item.plan).map((item) => ({
  path: `${item.path.slice(1)}/*`,
  element: <PlannedPage item={item} />,
}))

export const router = createBrowserRouter([
  {
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'promotions', element: <PromotionsPage /> },
      { path: 'promotions/new', element: <PromotionFormPage /> },
      { path: 'promotions/:promotionId/edit', element: <PromotionFormPage /> },
      { path: 'artists', element: <ArtistsPage /> },
      { path: 'artists/new', element: <GroupFormPage /> },
      { path: 'artists/:groupId/edit', element: <GroupFormPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/new', element: <EntryFormPage /> },
      { path: 'events/:entryId/edit', element: <EntryFormPage /> },
      { path: 'events/cafes/new', element: <CafeFormPage /> },
      { path: 'events/cafes/:cafeId/edit', element: <CafeFormPage /> },
      { path: 'places', element: <PlacesPage /> },
      { path: 'places/new', element: <PlacesPage /> },
      { path: 'places/keywords', element: <KeywordsPage /> },
      { path: 'places/:placeId', element: <PlacesPage /> },
      { path: 'diary', loader: () => redirect('/diary/templates') },
      { path: 'diary/templates', element: <TemplatesPage /> },
      { path: 'diary/templates/new', element: <TemplateEditorPage /> },
      { path: 'diary/templates/:templateId', element: <TemplateEditorPage /> },
      { path: 'diary/stickers', element: <StickersPage /> },
      { path: 'diary/fonts', element: <FontsPage /> },
      ...plannedRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
