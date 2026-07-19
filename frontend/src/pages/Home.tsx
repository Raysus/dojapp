import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoadingCard from "../components/ui/LoadingCard";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingCard message="Restaurando sesión…" />;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "PROFESSOR") return <Navigate to="/professor" replace />;
  if (user.role === "STUDENT") return <Navigate to="/student" replace />;

  return <Navigate to="/unauthorized" replace />;
}
