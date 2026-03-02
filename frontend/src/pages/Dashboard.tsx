import ProfessorDashboard from '../components/ProfessorDashboard';
import StudentDashboard from '../components/StudentDashboard';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.role === 'PROFESSOR') return <ProfessorDashboard />;
  if (user.role === 'STUDENT') return <StudentDashboard />;

  return null;
}
