import H1 from "../components/Typography/H1";

interface HomeInterface {
  user: any;
}

const Home = ({ user }: HomeInterface) => {
  return (
    <div>
      <H1>Welcome {user}</H1>
    </div>
  );
};

export default Home;
