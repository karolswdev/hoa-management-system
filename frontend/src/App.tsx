import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ThemeWrapper } from './theme/ThemeWrapper';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import Layout from './components/layout/Layout';

// Create a React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 seconds default
    },
  },
});

// Public Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ResendVerificationPage from './pages/auth/ResendVerificationPage';
import PublicHomePage from './pages/public/PublicHomePage';

// Member Pages
import DashboardPage from './pages/member/DashboardPage';
import AnnouncementsPage from './pages/member/AnnouncementsPage';
import EventsPage from './pages/member/EventsPage';
import DocumentsPage from './pages/member/DocumentsPage';
import DiscussionsPage from './pages/member/DiscussionsPage';
import DiscussionThreadPage from './pages/member/DiscussionThreadPage';
import ProfilePage from './pages/member/ProfilePage';
import BoardPage from './pages/BoardPage';
import PollsPage from './pages/Polls';
import PollDetailPage from './pages/PollDetail';
import PollReceiptPage from './pages/PollReceipt';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminConfigPage from './pages/admin/AdminConfigPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ThemeWrapper>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <NotificationProvider>
              <AuthProvider>
                <Router>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/public"
                element={
                  <PublicRoute>
                    <PublicHomePage />
                  </PublicRoute>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <PublicRoute>
                    <VerifyEmailPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/resend-verification"
                element={
                  <PublicRoute>
                    <ResendVerificationPage />
                  </PublicRoute>
                }
              />

              {/* Public Poll Receipt Verification Route */}
              <Route
                path="/polls/:pollId/receipts/:hash"
                element={<PollReceiptPage />}
              />

              {/* Protected Member Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="discussions" element={<DiscussionsPage />} />
                <Route path="discussions/:id" element={<DiscussionThreadPage />} />
                <Route path="board" element={<BoardPage />} />
                <Route path="polls" element={<PollsPage />} />
                <Route path="polls/:id" element={<PollDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* Admin Routes */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Navigate to="/admin/dashboard" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/announcements"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminAnnouncementsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/events"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminEventsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/documents"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDocumentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/config"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminConfigPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/audit"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminAuditPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
                </Router>
              </AuthProvider>
            </NotificationProvider>
          </LocalizationProvider>
        </ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

export default App;
