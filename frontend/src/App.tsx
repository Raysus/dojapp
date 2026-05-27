import { Routes, Route, Navigate } from 'react-router-dom';
import ProfessorDashboard from './components/ProfessorDashboard';
import StudentDashboard from './components/StudentDashboard';
import StudentDetail from './pages/StudentDetail';
import RoleGuard from './guards/RoleGuard';
import Unauthorized from './pages/Unauthorized';
import AuthGuard from './guards/AuthGuard';
import Layout from './components/Layout';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import ContentViewer from './pages/ContentViewer';
import DojoStats from './pages/DojoStats';
import DojoAttendance from './pages/DojoAttendance';
import Login from './pages/Login';
import AccountPage from './pages/AccountPage';
import ProfessorAttendanceHub from './pages/ProfessorAttendanceHub';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route
          path="/admin"
          element={
            <AuthGuard>
              <RoleGuard role="ADMIN">
                <AdminDashboard />
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/professor"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <ProfessorDashboard />
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/professor/attendance"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <ProfessorAttendanceHub />
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/students/:studentId"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <StudentDetail />
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/student"
          element={
            <AuthGuard>
              <RoleGuard role="STUDENT">
                <StudentDashboard />
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/account"
          element={
            <AuthGuard>
              <AccountPage />
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/contents/:contentId"
          element={
            <AuthGuard>
              <ContentViewer />
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/stats"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <DojoStats />
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route
          path="/dojos/:dojoId/attendance"
          element={
            <AuthGuard>
              <RoleGuard role="PROFESSOR">
                <DojoAttendance />
              </RoleGuard>
            </AuthGuard>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
