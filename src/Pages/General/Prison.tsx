import H1 from "../../components/Typography/H1";

import { useCharacter } from "../../CharacterContext";

const Prison = () => {
  const { character } = useCharacter();

  return (
    <section>
      <H1>{character?.location} Prison</H1>
      <img
        className="border border-neutral-400 rounded-lg"
        src="RioDeJaneiroPrison.png"
        alt=""
      />
    </section>
  );
};

export default Prison;
