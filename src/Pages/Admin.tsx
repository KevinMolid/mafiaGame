// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";

import { useAuth } from "../AuthContext";

import { Navigate } from "react-router-dom";

const Admin = () => {
  const { userData } = useAuth();

  if (userData && userData.type !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <Main>
      <H1>Admin Control Panel</H1>
      <H2>Players</H2>
      <CharacterList include="admin" action="link"></CharacterList>
    </Main>
  );
};

export default Admin;
