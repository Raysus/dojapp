import ProfessorDashboard from '../components/ProfessorDashboard';
import StudentDashboard from '../components/StudentDashboard';
import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();

    if (!user) return null;

    return user.role === 'PROFESSOR'
        ? <ProfessorDashboard />
        : <StudentDashboard />;
}
