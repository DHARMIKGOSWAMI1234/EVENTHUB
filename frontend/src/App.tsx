// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute, RoleRoute } from './components/common/RouteGuards'

// Layouts
import { PublicLayout } from './layouts/PublicLayout'
import { CustomerLayout } from './layouts/CustomerLayout'
import { OrganizerLayout } from './layouts/OrganizerLayout'
import { AdminLayout } from './layouts/AdminLayout'

// Public Pages
import { HomePage } from './pages/public/HomePage'
import { EventsPage } from './pages/public/EventsPage'
import { EventDetailPage } from './pages/public/EventDetailPage'
import { CategoriesPage } from './pages/public/CategoriesPage'
import { VenuesPage } from './pages/public/VenuesPage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { DatabasePortalPage } from './pages/database/DatabasePortalPage'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Customer Pages
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage'
import { MyBookingsPage } from './pages/customer/MyBookingsPage'
import { BookingDetailPage } from './pages/customer/BookingDetailPage'
import { BookingFlowPage } from './pages/customer/BookingFlowPage'
import { MyTicketsPage } from './pages/customer/MyTicketsPage'
import { TicketDetailPage } from './pages/customer/TicketDetailPage'
import { FavoritesPage } from './pages/customer/FavoritesPage'
import { NotificationsPage } from './pages/customer/NotificationsPage'
import { ProfilePage } from './pages/customer/ProfilePage'

// Organizer Pages
import { OrganizerDashboardPage } from './pages/organizer/OrganizerDashboardPage'
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage'
import { CreateEventPage } from './pages/organizer/CreateEventPage'
import { OrganizerEventDetailPage } from './pages/organizer/OrganizerEventDetailPage'
import { OrganizerAnalyticsPage } from './pages/organizer/OrganizerAnalyticsPage'
import { OrganizerProfilePage } from './pages/organizer/OrganizerProfilePage'

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminVenuesPage } from './pages/admin/AdminVenuesPage'
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage'
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage'
import { AdminTicketValidationPage } from './pages/admin/AdminTicketValidationPage'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Layout & Discovery Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:eventId" element={<EventDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/database" element={<DatabasePortalPage />} />
              <Route path="/database/:tab" element={<DatabasePortalPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Booking Flow (Requires Customer Auth) */}
              <Route
                path="/booking/:eventId"
                element={
                  <ProtectedRoute>
                    <BookingFlowPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Customer Portal Layout (Protected for logged in users) */}
            <Route
              element={
                <ProtectedRoute>
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/booking/detail/:bookingId" element={<BookingDetailPage />} />
              <Route path="/my-tickets" element={<MyTicketsPage />} />
              <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Organizer Portal Layout (Protected for ORGANIZER & ADMIN) */}
            <Route
              element={
                <RoleRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                  <OrganizerLayout />
                </RoleRoute>
              }
            >
              <Route path="/organizer" element={<OrganizerDashboardPage />} />
              <Route path="/organizer/events" element={<OrganizerEventsPage />} />
              <Route path="/organizer/events/new" element={<CreateEventPage />} />
              <Route path="/organizer/events/:eventId" element={<OrganizerEventDetailPage />} />
              <Route path="/organizer/analytics" element={<OrganizerAnalyticsPage />} />
              <Route path="/organizer/profile" element={<OrganizerProfilePage />} />
            </Route>

            {/* Admin Management Layout (Protected for ADMIN only) */}
            <Route
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </RoleRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/venues" element={<AdminVenuesPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/tickets/validate" element={<AdminTicketValidationPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
