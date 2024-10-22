// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";

import { useCharacter } from "../../CharacterContext";

const Prison = () => {
  const { character } = useCharacter();

  return (
    <Main img="PrisonBg">
      <H1>Fengsel</H1>
      <p className="mb-4">
        Her havner du dersom du blir tatt for kriminelle handlinger i{" "}
        {character?.location}.
      </p>

      <H2>Du er i fengsel</H2>
      <p>
        Du må vente <strong>482</strong> sekunder før du slipper ut.
      </p>
    </Main>
  );
};

export default Prison;
