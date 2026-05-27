import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LoadingCard from '../components/ui/LoadingCard';
import type { JSX } from 'react';

type Props = {
    children: JSX.Element;
};

export default function AuthGuard({ children }: Props) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingCard />;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

