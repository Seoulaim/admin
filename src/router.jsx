import { createBrowserRouter, redirect } from 'react-router'
import AdminLayout from './components/layout/AdminLayout.jsx'
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
import InquiriesPage from './pages/inquiries/InquiriesPage.jsx'
import AutoMailsPage from './pages/mail/AutoMailsPage.jsx'
import ComposePage from './pages/mail/ComposePage.jsx'
import MailHistoryPage from './pages/mail/HistoryPage.jsx'
import PaymentsPage from './pages/payments/PaymentsPage.jsx'
import MemberDetailPage from './pages/members/MemberDetailPage.jsx'
import MembersPage from './pages/members/MembersPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SurveyQuestionsPage from './pages/survey/SurveyQuestionsPage.jsx'
import SurveyResultsPage from './pages/survey/SurveyResultsPage.jsx'
import KeywordsPage from './pages/places/KeywordsPage.jsx'
import PlacesPage from './pages/places/PlacesPage.jsx'
import RefundsPage from './pages/refunds/RefundsPage.jsx'
import RouteErrorPage from './pages/RouteErrorPage.jsx'
import PromotionFormPage from './pages/promotions/PromotionFormPage.jsx'
import PromotionsPage from './pages/promotions/PromotionsPage.jsx'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
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
      { path: 'inquiries', element: <InquiriesPage /> },
      { path: 'inquiries/:inquiryId', element: <InquiriesPage /> },
      { path: 'refunds', element: <RefundsPage /> },
      { path: 'refunds/:requestId', element: <RefundsPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'payments/:paymentId', element: <PaymentsPage /> },
      { path: 'mail', element: <ComposePage /> },
      { path: 'mail/history', element: <MailHistoryPage /> },
      { path: 'mail/auto', element: <AutoMailsPage /> },
      { path: 'survey', element: <SurveyResultsPage /> },
      { path: 'survey/questions', element: <SurveyQuestionsPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'members/:memberId', element: <MemberDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
