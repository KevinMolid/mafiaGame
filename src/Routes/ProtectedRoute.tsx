import { Navigate } from "react-router-dom";
import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { character, loading } = useCharacter();
  const { userData } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <Navigate to="/logginn" />;
  }

  if (!character || character.status === "dead") {
    return <Navigate to="/nyspiller" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
