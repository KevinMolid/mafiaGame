import H2 from "../components/Typography/H2";
import ShopBox from "../components/ShopBox";
import { useState, useRef, useEffect, ReactNode } from "react";
import b1 from "/images/boxes/Briefcase1.png";
import b2 from "/images/boxes/Briefcase2.png";
import b3 from "/images/boxes/Briefcase3.png";
import ItemTile from "../components/ItemTile";
import InfoBox from "../components/InfoBox";

import Item from "./Typography/Item";

import { Items } from "../Data/Items";
import { useCharacter } from "../CharacterContext";

import { getFirestore, doc, runTransaction } from "firebase/firestore";
import { grantItemToInventory } from "../Functions/RewardFunctions";

const db = getFirestore();

const suitcaseBoxes = [
  {
    id: 1,
    title: "Sølvkoffert",
    image: b1,
    price: 100_000,
    currencyIcon: "fa-solid fa-dollar",
  },
  {
    id: 2,
    title: "Gullkoffert",
    image: b2,
    price: 1_000_000,
    currencyIcon: "fa-solid fa-dollar",
  },
  {
    id: 3,
    title: "Diamantkoffert",
    image: b3,
    price: 25,
    currencyIcon: "fa-solid fa-gem",
  },
];

const suitcaseRarities: { [key: number]: number[] } = {
  0: [1, 2, 3], // Sølv-koffert
  1: [2, 3, 4], // Gull-koffert
  2: [3, 4, 5], // Diamant-koffert
};

// Visually each slot ≈ 64px wide (images are 48px + border/gap)
const ITEM_SLOT_PX = 64;
const MAX_VISIBLE_ITEMS = 7;

// suitcase index -> [{ tier, weight }]
const suitcaseTierWeights: Record<number, { tier: number; weight: number }[]> =
  {
    0: [
      // Sølvkoffert: tiers 1–3
      { tier: 1, weight: 0.6 },
      { tier: 2, weight: 0.3 },
      { tier: 3, weight: 0.1 },
    ],
    1: [
      // Gullkoffert: tiers 2–4
      { tier: 2, weight: 0.65 },
      { tier: 3, weight: 0.3 },
      { tier: 4, weight: 0.05 },
    ],
    2: [
      // Diamantkoffert: tiers 3–5
      { tier: 3, weight: 0.7 },
      { tier: 4, weight: 0.29 },
      { tier: 5, weight: 0.01 },
    ],
  };

// Pick a tier for the given suitcase index using weighted random
const pickTierForSuitcase = (index: number): number => {
  const weights = suitcaseTierWeights[index];
  if (!weights || !weights.length) {
    // fallback: pick any allowed tier uniformly
    const tiers = suitcaseRarities[index];
    return tiers[Math.floor(Math.random() * tiers.length)];
  }

  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;

  for (const w of weights) {
    if (r < w.weight) return w.tier;
    r -= w.weight;
  }

  // Fallback (floating point safety)
  return weights[weights.length - 1].tier;
};

const Suitcases = () => {
  const { userCharacter } = useCharacter();

  const [wheelIndex, setWheelIndex] = useState(0);
  const [scrollIndex, setScrollIndex] = useState(0);

  // how many items fit in the current container
  const [maxVisibleItems, setMaxVisibleItems] = useState(MAX_VISIBLE_ITEMS);

  // items filtered by selected suitcase tier
  const [filteredItems, setFilteredItems] = useState(
    Items.slice(0, maxVisibleItems)
  );

  // animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<0 | -1 | 1>(0); // -1 = left arrow, +1 = right arrow
  const [offsetPx, setOffsetPx] = useState(0);

  const scrollContainerRef = useRef<HTMLUListElement | null>(null);

  // purchase state
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState<ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("info");

  // Update filtered items when suitcase type changes
  useEffect(() => {
    const fi = Items.filter((item) =>
      suitcaseRarities[wheelIndex].includes(item.tier)
    );
    setFilteredItems(fi);

    // keep scrollIndex valid
    setScrollIndex((prev) =>
      fi.length ? ((prev % fi.length) + fi.length) % fi.length : 0
    );
  }, [wheelIndex]);

  // Adjust visible count by container width
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        const byWidth = Math.max(1, Math.floor(containerWidth / ITEM_SLOT_PX));
        const visibleItems = Math.min(byWidth, MAX_VISIBLE_ITEMS);
        setMaxVisibleItems(Math.min(visibleItems, filteredItems.length || 1));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [filteredItems]);

  // Build render list: window of N items plus 1 buffer on each side for the slide
  const buildRenderItems = () => {
    if (!filteredItems.length) return { render: [] as typeof filteredItems };

    const len = filteredItems.length;
    const start = ((scrollIndex % len) + len) % len;

    const windowItems = Array.from(
      { length: Math.min(maxVisibleItems, len - 2) },
      (_, i) => filteredItems[(start + i) % len]
    );

    const prevIdx = (start - 1 + len) % len;
    const nextIdx = (start + windowItems.length) % len;

    const render = [
      filteredItems[prevIdx],
      ...windowItems,
      filteredItems[nextIdx],
    ];
    return { render };
  };

  const { render: itemList } = buildRenderItems();

  // Helpers
  const getCircularIndex = (index: number, length: number) => {
    return (index + length) % length;
  };

  // Click → animate one slot
  const handleScrollLeft = () => {
    if (isAnimating || !filteredItems.length) return;
    setSlideDir(-1);
    setIsAnimating(true);
    setOffsetPx(ITEM_SLOT_PX); // slide strip right to reveal previous
  };

  const handleScrollRight = () => {
    if (isAnimating || !filteredItems.length) return;
    setSlideDir(1);
    setIsAnimating(true);
    setOffsetPx(-ITEM_SLOT_PX); // slide strip left to reveal next
  };

  // After the CSS transition, snap the logical window and reset transform
  const handleTransitionEnd = () => {
    if (!isAnimating) return;

    setScrollIndex((prev) => {
      const len = filteredItems.length || 1;
      const next = slideDir === 1 ? prev + 1 : prev - 1;
      return getCircularIndex(next, len);
    });

    setIsAnimating(false);
    setSlideDir(0);
    setOffsetPx(0);
  };

  // Suitcase selection wheel classes
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

  const handleBuySuitcase = async () => {
    if (!userCharacter) {
      setMessage("Du må være innlogget for å kjøpe kofferter.");
      setMessageType("warning");
      return;
    }

    const suitcase = suitcaseBoxes[wheelIndex];
    if (!suitcase) return;

    if (isBuying) return;

    try {
      setIsBuying(true);

      const charRef = doc(db, "Characters", userCharacter.id);

      // 1) Trekk penger/diamanter med en transaksjon
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(charRef);
        if (!snap.exists()) {
          throw new Error("CHAR_NOT_FOUND");
        }
        const data = snap.data() as any;
        const stats = data.stats || {};
        const money = stats.money ?? 0;
        const diamonds = stats.diamonds ?? 0;

        if (suitcase.currencyIcon === "fa-solid fa-dollar") {
          if (money < suitcase.price) {
            throw new Error("INSUFFICIENT_MONEY");
          }
          tx.update(charRef, {
            "stats.money": money - suitcase.price,
          });
        } else {
          if (diamonds < suitcase.price) {
            throw new Error("INSUFFICIENT_DIAMONDS");
          }
          tx.update(charRef, {
            "stats.diamonds": diamonds - suitcase.price,
          });
        }
      });

      // 2) Finn mulige items for denne kofferten (alle tier i denne kofferten)
      const allCandidates = Items.filter((item) =>
        suitcaseRarities[wheelIndex].includes(item.tier)
      );
      if (!allCandidates.length) {
        setMessage("Ingen gjenstander tilgjengelig i denne kofferten.");
        setMessageType("failure");
        return;
      }

      // 3) Velg tier basert på vektet sjanse (sjeldne ting er virkelig sjeldne)
      const chosenTier = pickTierForSuitcase(wheelIndex);

      // Filtrer til items med valgt tier
      const tierCandidates = allCandidates.filter(
        (item) => item.tier === chosenTier
      );

      // Hvis det ikke finnes items med den tieren (f.eks. ikke definert ennå),
      // fallback til alle kandidater for denne kofferten
      const pool = tierCandidates.length ? tierCandidates : allCandidates;

      // Velg et tilfeldig item fra poolen
      const rewardedItem = pool[Math.floor(Math.random() * pool.length)];

      // 4) Gi item til spilleren
      await grantItemToInventory(userCharacter.id, rewardedItem.id, 1);

      // 5) Vis suksessmelding
      setMessageType("success");
      setMessage(
        <>
          Du åpnet <strong>{suitcase.title}</strong> og fikk{" "}
          <Item
            name={rewardedItem.name}
            tier={rewardedItem.tier}
            tooltipImg={rewardedItem.img}
            tooltipContent={
              <ul className="space-y-0.5">
                {"attack" in rewardedItem && (
                  <li>
                    Angrep:{" "}
                    <strong className="text-neutral-200">
                      +{rewardedItem.attack ?? 1}
                    </strong>
                  </li>
                )}
                {"capacity" in rewardedItem && (
                  <li>
                    Kapasitet:{" "}
                    <strong className="text-neutral-200">
                      {rewardedItem.capacity ?? 1}
                    </strong>
                  </li>
                )}
                <li>
                  Verdi:{" "}
                  <strong className="text-neutral-200">
                    ${Number(rewardedItem.value ?? 0).toLocaleString("nb-NO")}
                  </strong>
                </li>
              </ul>
            }
          />
          !
        </>
      );
    } catch (err: any) {
      console.error("Feil ved kjøp av koffert:", err);
      if (err instanceof Error && err.message === "INSUFFICIENT_MONEY") {
        setMessage("Du har ikke nok penger til å kjøpe denne kofferten.");
      } else if (
        err instanceof Error &&
        err.message === "INSUFFICIENT_DIAMONDS"
      ) {
        setMessage("Du har ikke nok diamanter til å kjøpe denne kofferten.");
      } else {
        setMessage("Noe gikk galt. Prøv igjen.");
      }
      setMessageType("failure");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <>
      <H2>Kofferter</H2>
      <p className="mb-4">
        Kofferter inneholder utstyr du kan bruke for å forbedre spillkarakteren
        din.
      </p>

      {message && (
        <div className="mb-4 max-w-[800px]">
          <InfoBox type={messageType}>{message}</InfoBox>
        </div>
      )}

      {/* Item Display wheel */}
      <div className="border border-neutral-700 bg-neutral-950 rounded-full relative overflow-hidden max-w-[800px]">
        <button
          className="absolute flex justify-center items-center w-12 h-12 left-1 top-1/2 -translate-y-1/2 z-10 bg-neutral-800 hover:text-neutral-200 hover:bg-neutral-700 px-2 py-1 rounded-full"
          onClick={handleScrollLeft}
          aria-label="Forrige"
        >
          <i className="fa-solid fa-angle-left"></i>
        </button>

        <ul
          ref={scrollContainerRef}
          className={
            "h-20 flex items-center justify-center gap-1 max-w-full " +
            (isAnimating ? "transition-transform duration-300 ease-out" : "")
          }
          style={{ transform: `translateX(${offsetPx}px)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {itemList.map((item, index) => (
            <li
              key={`${item.id ?? item.name}-${index}`}
              className="shrink-0 w-16 flex items-center justify-center"
            >
              <div className="transition-transform hover:scale-105">
                <ItemTile name={item.name} img={item.img} tier={item.tier} />
              </div>
            </li>
          ))}
        </ul>

        <button
          className="absolute flex justify-center items-center w-10 h-10 right-1 top-1/2 -translate-y-1/2 bg-neutral-800 hover:text-neutral-200 hover:bg-neutral-700 z-10 px-2 py-1 rounded-full"
          onClick={handleScrollRight}
          aria-label="Neste"
        >
          <i className="fa-solid fa-angle-right"></i>
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
                onBuy={handleBuySuitcase}
                isBuying={isBuying}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Suitcases;
