import { Navigate } from "react-router-dom";
import { useCharacter } from "../CharacterContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { activeCharacter } = useCharacter();

  if (!activeCharacter) {
    // Redirect to CreateCharacter page if no active character
    return <Navigate to="/createcharacter" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
