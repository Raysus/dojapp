import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { JSX } from 'react';

type Props = {
    role: 'PROFESSOR' | 'STUDENT';
    children: JSX.Element;
};

export default function RoleGuard({ role, children }: Props) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (user.role !== role) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
