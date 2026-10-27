import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/common/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { FormTeamsPage } from './pages/FormTeamsPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { JoinTeamsPage } from './pages/JoinTeamsPage';
import { CreateTeamPage } from './pages/CreateTeamPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { MyTeamsPage } from './pages/MyTeamsPage';
import { MyConnectionsPage } from './pages/MyConnectionsPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Visitor Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="/register" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Onboarding Wizard (Protected) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Application Routes with Sidebar & Navbar */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<FormTeamsPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/teams" element={<JoinTeamsPage />} />
            <Route path="/teams/create" element={<CreateTeamPage />} />
            <Route path="/teams/:id" element={<TeamDetailPage />} />
            <Route path="/my-teams" element={<MyTeamsPage />} />
            <Route path="/connections" element={<MyConnectionsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
