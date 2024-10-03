import { Navigate } from "react-router-dom";
import { useCharacter } from "../CharacterContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { character, loading } = useCharacter();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!character) {
    return <Navigate to="/createcharacter" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
