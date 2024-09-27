// Context
import { useAuth } from "../AuthContext";

// Components
import H1 from "../components/Typography/H1";

const Home = () => {
  const { userData } = useAuth();

  return (
    <div>
      {userData ? <H1>Welcome {userData.email}</H1> : <H1>Welcome!</H1>}
    </div>
  );
};

export default Home;
