import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";

const Admin = () => {
  return (
    <div>
      <H1>Admin Control Panel</H1>
      <H2>Players</H2>
      <CharacterList include="admin" action="link"></CharacterList>
    </div>
  );
};

export default Admin;
