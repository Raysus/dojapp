import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ProfessorDashboard from './components/ProfessorDashboard';
import StudentDashboard from './components/StudentDashboard';
import StudentDetail from './pages/StudentDetail';
import RoleGuard from './guards/RoleGuard';
import Unauthorized from './pages/Unauthorized';
import AuthGuard from './guards/AuthGuard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

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
        path="/students/:id"
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

      <Route path="/unauthorized" element={<Unauthorized />} />

    </Routes>
  );
}
