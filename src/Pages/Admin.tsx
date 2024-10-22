// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";
import SidebarLink from "../components/SidebarLink";

import { useAuth } from "../AuthContext";

import { Navigate } from "react-router-dom";

const Admin = () => {
  const { userData } = useAuth();

  if (userData && userData.type !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <Main>
      <H1>Kontrollpanel</H1>
      <div className="border p-4 border-neutral-600 mb-4">
        <H2>Handlinger</H2>
        <SidebarLink to="/selectcharacater" icon="people-group">
          Velg spillkarakter
        </SidebarLink>
        <SidebarLink to="/createcharacter" icon="user-plus">
          Ny spillkarakter
        </SidebarLink>
      </div>

      <H2>Spillere</H2>
      <CharacterList type="admin"></CharacterList>
    </Main>
  );
};

export default Admin;
