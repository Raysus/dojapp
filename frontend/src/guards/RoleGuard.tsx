import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { JSX } from 'react';

type Role = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

type Props = {
  role: Role | Role[];
  children: JSX.Element;
};

export default function RoleGuard({ role, children }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const allowed = Array.isArray(role) ? role : [role];

  if (!allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
