import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import b1 from "/images/boxes/Briefcase1.png";
import b2 from "/images/boxes/Briefcase2.png";
import b3 from "/images/boxes/Briefcase3.png";

import { useState } from "react";

const Shop = () => {
  const [selected, setSelected] = useState<0 | 1 | 2 | 3>(1);

  return (
    <Main>
      <H1>Butikk</H1>
      <ul className="grid grid-cols-2 md:flex gap-2">
        <li
          key="1"
          onClick={() => setSelected(1)}
          className={
            "border p-4 flex-1 flex-grow text-center cursor-pointer flex flex-col justify-center " +
            (selected === 1
              ? "col-span-2 row-start-2 bg-neutral-900 border-neutral-600 text-neutral-200"
              : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
          }
        >
          <img src={b1} className="mb-4" alt="Koffert sølv" />
          <p className="text-center">
            Sølv-koffert
            <p className="text-yellow-400">
              <i className="fa-solid fa-dollar"></i> <strong>100,000</strong>
            </p>
          </p>
        </li>

        {/* Box 2 */}
        <li
          key="2"
          onClick={() => setSelected(2)}
          className={
            "border p-4 flex-1 flex-grow text-center cursor-pointer flex flex-col justify-center " +
            (selected === 2
              ? "col-span-2 row-start-2 bg-neutral-900 border-neutral-600 text-neutral-200"
              : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
          }
        >
          <img src={b2} className="mb-4" alt="Koffert gull" />
          <p className="text-center">
            Gull-koffert
            <p className="text-yellow-400">
              <i className="fa-solid fa-dollar"></i> <strong>500,000</strong>
            </p>
          </p>
        </li>

        <li
          key="3"
          onClick={() => setSelected(3)}
          className={
            "border p-4 flex-1 flex-grow text-center cursor-pointer flex flex-col justify-center " +
            (selected === 3
              ? "col-span-2 row-start-2 bg-neutral-900 border-neutral-600 text-neutral-200"
              : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
          }
        >
          <img src={b3} className="mb-4" alt="Koffert krystall" />
          <p className="text-center">
            Krystall-koffert
            <p className="text-cyan-400">
              <i className="fa-solid fa-gem"></i> <strong>25</strong>
            </p>
          </p>
        </li>
      </ul>
    </Main>
  );
};

export default Shop;
