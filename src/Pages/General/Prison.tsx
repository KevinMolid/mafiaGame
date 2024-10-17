// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";

import { useCharacter } from "../../CharacterContext";

const Prison = () => {
  const { character } = useCharacter();

  return (
    <Main img="PrisonBg">
      <H1>{character?.location} Prison</H1>
      <div className="grid grid-cols-2">
        <div>
          <H2>You are in prison</H2>
          <p>
            Remaining time: <strong>482</strong>
          </p>
        </div>
      </div>
    </Main>
  );
};

export default Prison;
