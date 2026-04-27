import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/ui/Navbar';
import { ServerStatusBanner } from './components/ui/ServerStatusBanner';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminScannerPage } from './pages/admin/AdminScannerPage';
import { AdminRevenuePage } from './pages/admin/AdminRevenuePage';
import { AdminAttendeesPage } from './pages/admin/AdminAttendeesPage';

// Protected route wrapper
const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
};

const Layout = () => (
  <div className="min-h-screen">
    <Navbar />
    <main className="pb-16">
      <Outlet />
    </main>
    <ServerStatusBanner />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected user routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/my-tickets" element={<MyTicketsPage />} />
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/events" element={<AdminEventsPage />} />
                <Route path="/admin/scanner" element={<AdminScannerPage />} />
                <Route path="/admin/revenue" element={<AdminRevenuePage />} />
                <Route path="/admin/attendees/:eventId" element={<AdminAttendeesPage />} />
              </Route>

              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <div className="text-6xl">404</div>
                  <h2 className="text-xl font-semibold text-gray-900">Page not found</h2>
                  <a href="/" className="text-violet-600 hover:underline">Go home</a>
                </div>
              } />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
