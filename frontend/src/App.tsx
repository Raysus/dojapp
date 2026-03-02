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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Navigate to="/" replace />} />

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
          path="/dojos/:dojoId/contents/:contentId"
          element={
            <AuthGuard>
              <ContentViewer />
            </AuthGuard>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>
    </Routes>
  );
}
