import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleGuard from './guards/RoleGuard';
import AuthGuard from './guards/AuthGuard';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import LoadingCard from './components/ui/LoadingCard';

const ProfessorDashboard = lazy(() => import('./components/ProfessorDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const StudentDetail = lazy(() => import('./pages/StudentDetail'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ContentViewer = lazy(() => import('./pages/ContentViewer'));
const DojoStats = lazy(() => import('./pages/DojoStats'));
const DojoAttendance = lazy(() => import('./pages/DojoAttendance'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ProfessorAttendanceHub = lazy(() => import('./pages/ProfessorAttendanceHub'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingCard message="Cargando…" />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/privacy"
        element={
          <LazyPage>
            <PrivacyPage />
          </LazyPage>
        }
      />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route
          path="/admin"
          element={
            <AuthGuard>
              <RoleGuard role="ADMIN">
                <LazyPage>
                  <AdminDashboard />
                </LazyPage>
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/professor"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <LazyPage>
                  <ProfessorDashboard />
                </LazyPage>
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/professor/attendance"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <LazyPage>
                  <ProfessorAttendanceHub />
                </LazyPage>
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/students/:studentId"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <LazyPage>
                  <StudentDetail />
                </LazyPage>
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/student"
          element={
            <AuthGuard>
              <RoleGuard role="STUDENT">
                <LazyPage>
                  <StudentDashboard />
                </LazyPage>
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/account"
          element={
            <AuthGuard>
              <LazyPage>
                <AccountPage />
              </LazyPage>
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/contents/:contentId"
          element={
            <AuthGuard>
              <LazyPage>
                <ContentViewer />
              </LazyPage>
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/stats"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <LazyPage>
                  <DojoStats />
                </LazyPage>
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/attendance"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <LazyPage>
                  <DojoAttendance />
                </LazyPage>
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/unauthorized"
          element={
            <LazyPage>
              <Unauthorized />
            </LazyPage>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
