import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import b1 from "/images/boxes/Briefcase1.png";
import b2 from "/images/boxes/Briefcase2.png";
import b3 from "/images/boxes/Briefcase3.png";

import { useState } from "react";

const Shop = () => {
  const [selected, setSelected] = useState<0 | 1 | 2 | 3>(0);

  return (
    <Main>
      <H1>Butikk</H1>
      <ul className="flex gap-0">
        <li
          key="1"
          onClick={() => setSelected(1)}
          className={
            "border px-4 py-2 flex-1 flex-grow text-center cursor-pointer " +
            (selected === 1
              ? "bg-neutral-900 border-neutral-600 text-neutral-200"
              : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
          }
        >
          <p className="text-center text-4xl mb-4">
            {selected === 1 && (
              <i className="fa-solid fa-arrow-down fa-bounce"></i>
            )}
            {selected !== 1 && (
              <i className="fa-solid fa-arrow-down text-neutral-600"></i>
            )}
          </p>
          <img src={b1} className="mb-4" alt="Koffert sølv" />
          <p className="text-center">
            <strong>Sølv</strong>
          </p>
        </li>

        {/* Box 2 */}
        <li
          key="2"
          onClick={() => setSelected(2)}
          className={
            "border px-4 py-2 flex-1 flex-grow text-center cursor-pointer " +
            (selected === 2
              ? "bg-neutral-900 border-neutral-600 text-neutral-200"
              : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
          }
        >
          <p className="text-center text-4xl mb-4">
            {selected === 2 && (
              <i className="fa-solid fa-arrow-down fa-bounce"></i>
            )}
            {selected !== 2 && (
              <i className="fa-solid fa-arrow-down text-neutral-600"></i>
            )}
          </p>
          <img src={b2} className="mb-4" alt="Koffert gull" />
          <p className="text-center">
            <strong>Gull</strong>
          </p>
        </li>

        <li
          key="3"
          onClick={() => setSelected(3)}
          className={
            "border px-4 py-2 flex-1 flex-grow text-center cursor-pointer " +
            (selected === 3
              ? "bg-neutral-900 border-neutral-600 text-neutral-200"
              : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
          }
        >
          <p className="text-center text-4xl mb-4">
            {selected === 3 && (
              <i className="fa-solid fa-arrow-down fa-bounce"></i>
            )}
            {selected !== 3 && (
              <i className="fa-solid fa-arrow-down text-neutral-600"></i>
            )}
          </p>
          <img src={b3} className="mb-4" alt="Koffert krystall" />
          <p className="text-center">
            <strong>Krystal</strong>
          </p>
        </li>
      </ul>
    </Main>
  );
};

export default Shop;
