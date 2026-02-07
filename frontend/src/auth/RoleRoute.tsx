import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RoleRoute({ allowed, children }: any) {
    const { user } = useAuth();

    if (!user) return null;

    return allowed.includes(user.role)
        ? children
        : <Navigate to="/login" />;
}

