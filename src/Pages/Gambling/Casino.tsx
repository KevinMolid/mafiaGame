import Main from "../../components/Main";
import Jackpot from "./Jackpot";
import BlackJack from "./BlackJack";

const Casino = () => {
  return (
    <Main>
      <div className="grid grid-cols-2 gap-8">
        <Jackpot />
        <BlackJack />
      </div>
    </Main>
  );
};

export default Casino;
