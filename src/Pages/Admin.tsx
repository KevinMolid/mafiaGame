// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";
import { Link } from "react-router-dom";

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
      <div className="border p-4 border-neutral-600 mb-4 gap-2">
        <H2>Handlinger</H2>
        <div className="flex flex-wrap gap-2">
          <Link to="/velgspiller">
            <div className="flex gap-2 items-center bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg w-[max-content]">
              <i className="fa-solid fa-user-group"></i>
              <p>Velg spillkarakter</p>
            </div>
          </Link>
          <Link to="/nyspiller">
            <div className="flex gap-2 items-center bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg w-[max-content]">
              <i className="fa-solid fa-user-plus"></i>
              <p>Ny spillkarakter</p>
            </div>
          </Link>
        </div>
      </div>

      <H2>Spillere</H2>
      <CharacterList type="admin"></CharacterList>
    </Main>
  );
};

export default Admin;
