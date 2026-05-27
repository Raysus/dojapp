import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "PROFESSOR") return <Navigate to="/professor" replace />;
  if (user.role === "STUDENT") return <Navigate to="/student" replace />;

  return <Navigate to="/unauthorized" replace />;
}