import H2 from "./Typography/H2";
import H3 from "./Typography/H3";

import d1 from "/images/boxes/Diamonds.png";
import d2 from "/images/boxes/Diamonds2.png";
import d3 from "/images/boxes/Diamonds3.png";

import Button from "./Button";

const Diamonds = () => {
  return (
    <>
      <H2>Diamanter</H2>
      <p className="mb-4">
        Her kan du kjøpe diamanter som kan brukes til å kjøpe forskjellige ting
        i spillet.
      </p>
      <ul className="flex gap-4">
        <li>
          <div className="flex flex-col justify-center items-center text-center gap-1">
            <H3>Liten håndfull</H3>
            <img
              src={d1}
              className="w-48 h-28 object-cover border-2 border-neutral-600"
              alt="Diamonds"
            />
            <p className="font-semibold text-sky-400 text-xl">
              <i className="fa-solid fa-gem" /> 150
            </p>
            <p>55 kr</p>
            <Button>Kjøp</Button>
          </div>
        </li>
        <li>
          <div className="flex flex-col justify-center items-center text-center gap-1">
            <H3>Stor håndfull</H3>
            <img
              src={d2}
              className="w-48 h-28 object-cover border-2 border-neutral-600"
              alt="Diamonds"
            />
            <p className="font-semibold text-sky-400 text-xl">
              <i className="fa-solid fa-gem" /> 450
            </p>
            <p>129 kr</p>
            <Button>Kjøp</Button>
          </div>
        </li>
        <li>
          <div className="flex flex-col justify-center items-center text-center gap-1">
            <H3>Bøttevis</H3>
            <img
              src={d3}
              className="w-48 h-28 object-cover border-2 border-neutral-600"
              alt="Diamonds"
            />
            <p className="font-semibold text-sky-400 text-xl">
              <i className="fa-solid fa-gem" /> 1200
            </p>
            <p>299 kr</p>
            <Button>Kjøp</Button>
          </div>
        </li>
      </ul>
    </>
  );
};

export default Diamonds;
