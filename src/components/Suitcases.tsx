import H2 from "../components/Typography/H2";
import ShopBox from "../components/ShopBox";
import { useState, useRef, useEffect } from "react";
import b1 from "/images/boxes/Briefcase1.png";
import b2 from "/images/boxes/Briefcase2.png";
import b3 from "/images/boxes/Briefcase3.png";

import Items from "../Data/Items";

const suitcaseBoxes = [
  {
    id: 1,
    title: "Sølvkoffert",
    image: b1,
    price: 100000,
    currencyIcon: "fa-solid fa-dollar",
  },
  {
    id: 2,
    title: "Gullkoffert",
    image: b2,
    price: 1000000,
    currencyIcon: "fa-solid fa-dollar",
  },
  {
    id: 3,
    title: "Krystallkoffert",
    image: b3,
    price: 25,
    currencyIcon: "fa-solid fa-gem",
  },
];

const suitcaseRarities: { [key: number]: string[] } = {
  0: ["common", "uncommon", "rare"], // Sølv-koffert
  1: ["uncommon", "rare", "epic"], // Gull-koffert
  2: ["rare", "epic", "legendary"], // Krystall-koffert
};

const Suitcases = () => {
  const [wheelIndex, setWheelIndex] = useState(0);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [maxVisibleItems, setMaxVisibleItems] = useState(5);
  const [filteredItems, setFilteredItems] = useState(
    Items.slice(0, maxVisibleItems)
  );
  const [itemList, setItemList] = useState(Items.slice(0, maxVisibleItems));
  const scrollContainerRef = useRef<HTMLUListElement | null>(null);

  // Update itemList when wheelIndex changes
  useEffect(() => {
    const filteredItems = Items.filter((item) =>
      suitcaseRarities[wheelIndex].includes(item.rarity)
    );
    setFilteredItems(filteredItems);

    // Generate the item list for display based on maxVisibleItems
    const newItemList = [];
    for (let i = 0; i < maxVisibleItems; i++) {
      newItemList.push(filteredItems[(scrollIndex + i) % filteredItems.length]);
    }

    setItemList(newItemList);
  }, [wheelIndex, maxVisibleItems, scrollIndex]);

  // Function to adjust maxVisibleItems based on container width
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        const itemWidth = 72;
        const visibleItems = Math.floor(containerWidth / itemWidth);
        setMaxVisibleItems(Math.min(visibleItems, filteredItems.length));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [filteredItems]);

  const getPositionClass = (index: number) => {
    if (index === wheelIndex) return "scale-110 z-20 translate-x-0"; // Center item
    if (index === (wheelIndex + 1) % suitcaseBoxes.length)
      return "scale-90 z-10 translate-x-28 md:translate-x-32 lg:translate-x-40"; // Right item
    if (
      index ===
      (wheelIndex - 1 + suitcaseBoxes.length) % suitcaseBoxes.length
    )
      return "scale-90 z-10 -translate-x-28 md:-translate-x-32 lg:-translate-x-40"; // Left item
    return "opacity-0 pointer-events-none";
  };

  const getCircularIndex = (index: number, length: number) => {
    return (index + length) % length;
  };

  const handleScrollLeft = () => {
    setScrollIndex((prevIndex) =>
      getCircularIndex(prevIndex - 1, Items.length)
    );
  };

  const handleScrollRight = () => {
    setScrollIndex((prevIndex) =>
      getCircularIndex(prevIndex + 1, Items.length)
    );
  };

  return (
    <>
      <H2>
        <i className="fa-solid fa-briefcase"></i> Kofferter
      </H2>
      <p className="mb-4">
        Kofferter inneholder utstyr du kan bruke for å forbedre spillkarakteren
        din.
      </p>
      {/* Item Display wheel */}
      <div className="border border-neutral-700 bg-neutral-950 rounded-full p-2 relative overflow-hidden max-w-[800px]">
        <button
          className="absolute flex justify-center items-center w-12 h-12 left-1 top-1/2 -translate-y-1/2 z-10 px-2 py-1 rounded-full"
          onClick={handleScrollLeft}
        >
          <i className="fa-solid fa-angle-left"></i>{" "}
        </button>
        <ul
          ref={scrollContainerRef}
          className="h-20 flex items-center justify-center gap-1 max-w-full"
        >
          {itemList.map((item, index) => (
            <li
              key={index}
              className={`flex h-max border-2 rounded-xl ${
                item.rarity === "common"
                  ? "border-neutral-400 shadow-lg shadow-neutral-500/25"
                  : item.rarity === "uncommon"
                  ? "border-green-400 shadow-lg shadow-neutral-500/25"
                  : item.rarity === "rare"
                  ? "border-sky-400 shadow-lg shadow-sky-500/25"
                  : item.rarity === "epic"
                  ? "border-purple-400 shadow-lg shadow-purple-500/25"
                  : item.rarity === "legendary"
                  ? "border-yellow-400 shadow-lg shadow-yellow-500/25"
                  : ""
              }`}
            >
              <img
                src={item.img}
                alt={item.name}
                className="min-w-14 max-w-14 h-14 hover:min-w-16 hover:max-w-16 hover:h-16 object-cover rounded-xl transition-all"
              />
            </li>
          ))}
        </ul>
        <button
          className="absolute flex justify-center items-center w-10 h-10 right-1 top-1/2 -translate-y-1/2 z-10 px-2 py-1 rounded-full"
          onClick={handleScrollRight}
        >
          <i className="fa-solid fa-angle-right"></i>{" "}
        </button>
      </div>

      {/* Selection wheel */}
      <div className="h-[240px] mt-4 mb-8 overflow-visible flex max-w-[800px]">
        <div className="relative flex items-center justify-center w-full">
          {suitcaseBoxes.map((box, index) => (
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
    </>
  );
};

export default Suitcases;
