import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";

import { useCharacter } from "../../CharacterContext";

const Parking = () => {
  const { character } = useCharacter();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <H1>{character?.location} Parking</H1>
        <p>
          This is an overview of your parking lot and all the cars you own in{" "}
          {character?.location}
        </p>
      </div>
      <div>
        <H2>Simple parking space</H2>
        <div className="flex gap-4">
          <p>Slots: 1</p>
          <p>Security: 0</p>
          <p>Upgrade</p>
        </div>
      </div>
      <table className="w-full table-auto border border-collapse text-left">
        <tr className="border border-neutral-700 bg-neutral-950 text-stone-200">
          <th className="px-2 py-1">Car</th>
          <th className="px-2 py-1">Power</th>
          <th className="px-2 py-1">Value</th>
          <th></th>
        </tr>
        <tr className="border bg-neutral-800 border-neutral-700">
          <td className="px-2 py-1">Toyota RAV4</td>
          <td className="px-2 py-1">203 hp</td>
          <td className="px-2 py-1">{"$" + (15000).toLocaleString()}</td>
          <td className="px-2 py-1">sell</td>
        </tr>
      </table>
      <p>
        <strong className="text-white">1</strong> of{" "}
        <strong className="text-white">1</strong> parking slots used
      </p>
    </section>
  );
};

export default Parking;
