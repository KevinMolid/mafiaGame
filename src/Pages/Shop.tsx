import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import ShopBox from "../components/ShopBox";
import { useState } from "react";
import b1 from "/images/boxes/Briefcase1.png";
import b2 from "/images/boxes/Briefcase2.png";
import b3 from "/images/boxes/Briefcase3.png";

import Items from "../Data/Items";

const boxes = [
  {
    id: 1,
    title: "Sølv-koffert",
    image: b1,
    price: 100000,
    currencyIcon: "fa-solid fa-dollar",
  },
  {
    id: 2,
    title: "Gull-koffert",
    image: b2,
    price: 1000000,
    currencyIcon: "fa-solid fa-dollar",
  },
  {
    id: 3,
    title: "Krystall-koffert",
    image: b3,
    price: 25,
    currencyIcon: "fa-solid fa-gem",
  },
];

const Shop = () => {
  const [wheelIndex, setWheelIndex] = useState(0);

  const getPositionClass = (index: number) => {
    if (index === wheelIndex) return "scale-110 z-20 translate-x-0"; // Center item
    if (index === (wheelIndex + 1) % boxes.length)
      return "scale-90 z-10 translate-x-28 md:translate-x-32 lg:translate-x-40"; // Right item
    if (index === (wheelIndex - 1 + boxes.length) % boxes.length)
      return "scale-90 z-10 -translate-x-28 md:-translate-x-32 lg:-translate-x-40"; // Left item
    return "opacity-0 pointer-events-none"; // Make invisible without hiding
  };

  return (
    <Main>
      <H1>Butikk</H1>
      <div className="border border-neutral-700 bg-neutral-950 rounded-full p-4">
        <ul className="h-20 flex items-center justify-center gap-2 max-w-[800px]">
          {Items.map((item) => {
            return (
              <li
                key={item.name}
                className={
                  "flex h-max border-2 rounded-xl " +
                  (item.rarity === "common"
                    ? "border-neutral-300 shadow-lg shadow-neutral-500/25"
                    : item.rarity === "uncommon"
                    ? "border-sky-400 shadow-lg shadow-sky-500/25"
                    : item.rarity === "rare"
                    ? "border-purple-400 shadow-lg shadow-purple-500/25"
                    : item.rarity === "epic"
                    ? "border-yellow-400 shadow-lg shadow-yellow-500/25"
                    : "")
                }
              >
                <img
                  src={item.img}
                  alt=""
                  className="size-16 hover:size-20 object-cover rounded-xl transition-all"
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Selection wheel */}
      <div className="h-[240px] mt-4 overflow-visible flex max-w-[800px]">
        <div className="relative flex items-center justify-center w-full">
          {boxes.map((box, index) => (
            <div
              key={box.id}
              className={`absolute transition-all duration-500 ease-in-out ${getPositionClass(
                index
              )} 
                ${index === wheelIndex ? "w-40 md:w-48" : "w-36"}`}
            >
              <ShopBox
                title={box.title}
                image={box.image}
                price={box.price}
                currencyIcon={box.currencyIcon}
                selected={wheelIndex === index}
                onSelect={() => setWheelIndex(index)}
                priceColor={
                  box.currencyIcon === "fa-solid fa-gem"
                    ? "text-sky-400"
                    : "text-yellow-400"
                }
              />
            </div>
          ))}
        </div>
      </div>
    </Main>
  );
};

export default Shop;
