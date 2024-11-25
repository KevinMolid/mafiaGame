import { Navigate } from "react-router-dom";
import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { userCharacter, loading } = useCharacter();
  const { userData } = useAuth();

  if (loading) {
    return <div>Laster...</div>;
  }

  if (!userData) {
    return <Navigate to="/logginn" />;
  }

  if (!userCharacter) {
    return <Navigate to="/nyspiller" />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
