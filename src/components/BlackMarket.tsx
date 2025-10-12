// pages/BlackMarket.tsx
import { useEffect, useMemo, useState } from "react";

// Components
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import Box from "../components/Box";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";
import Item from "../components/Typography/Item";

import { getCarByName, getCarByKey } from "../Data/Cars";

// Context
import { useCharacter } from "../CharacterContext";

// Firestore
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  doc,
  writeBatch,
  query,
  where,
  getDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

const db = getFirestore();

// ---- Types ------------------------------------------------------------------
type Category = "cars" | "bullets" | "weapons" | "items";

type Listing = {
  id: string;
  category: Category;
  itemType: string;
  name: string;
  quantity: number;
  price: number;
  seller: { id: string; username: string };
  createdAt: number;
  expiresAt?: number;
  car?: { id: string; tier?: number | null };
  location?: string | null;
};

type CarDoc = {
  id: string;
  name?: string;
  brand?: string;
  model?: string;
  hp?: number;
  value?: number;
  tier?: number;
  city?: string;
  [key: string]: any;
};

// Helpers
const fmt = (n: number) => n.toLocaleString("nb-NO");
const carBaseName = (c: CarDoc) =>
  c.name || [c.brand, c.model].filter(Boolean).join(" ") || "Bil";
const stripTierSuffix = (s: string) => s.replace(/\s*\(T\d+\)\s*$/, "");

function labelForCategory(c: Category) {
  if (c === "cars") return "Biler";
  if (c === "bullets") return "Kuler";
  if (c === "weapons") return "Våpen";
  return "Annet";
}

// -----------------------------------------------------------------------------

const BlackMarket = () => {
  const { userCharacter } = useCharacter();

  // Page messages
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");

  // New listing form state
  const [category, setCategory] = useState<Category>("cars");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("Car");
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);

  // Cars owned by player (subcollection)
  const [cars, setCars] = useState<CarDoc[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarDoc | null>(null);

  // Local listing data
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  // Filters for “Markedet”
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");

  const selectedCatalog = useMemo(() => {
    if (!selectedCar) return null;
    return selectedCar.key
      ? getCarByKey(selectedCar.key)
      : getCarByName(selectedCar.name || "car");
  }, [selectedCar]);

  // --- Subscribe to the user's Cars subcollection ---------------------------
  useEffect(() => {
    if (!userCharacter?.id) {
      setCars([]);
      return;
    }
    // NOTE: use your exact subcollection name here ("Cars" vs "cars")
    const carsRef = collection(db, "Characters", userCharacter.id, "cars");
    const unsub = onSnapshot(
      carsRef,
      (snap) => {
        const list: CarDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCars(list);
      },
      (err) => {
        console.error("Failed to subscribe to cars:", err);
        setCars([]);
      }
    );
    return () => unsub();
  }, [userCharacter?.id]);

  // --- Subscribe to my Auctions ------------------------------------------------
  useEffect(() => {
    if (!userCharacter?.id) {
      setMyListings([]);
      return;
    }

    const q = query(
      collection(db, "Auctions"),
      where("sellerId", "==", userCharacter.id)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Listing[] = snap.docs
          .map((d) => {
            const v = d.data() as any;
            return {
              id: d.id,
              category: (v.category || "cars") as Category,
              itemType: v.itemType || "Car",
              name: v.name || "Ukjent",
              quantity: v.quantity ?? 1,
              price: v.price ?? 0,
              seller: { id: v.sellerId, username: v.sellerName },
              createdAt: v.createdAt?.toMillis
                ? v.createdAt.toMillis()
                : Date.now(),
              car: v.carId
                ? { id: v.carId, tier: v.car?.tier ?? null }
                : undefined,
              location: v.location ?? null,
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt); // newest first

        setMyListings(items);
      },
      (err) => {
        console.error("Failed to subscribe to my auctions:", err);
        setMyListings([]);
      }
    );

    return () => unsub();
  }, [userCharacter?.id]);

  // Cars filtered by current user's city
  const carsInMyCity = useMemo(() => {
    const city = userCharacter?.location;
    if (!city) return cars;
    return cars.filter((c) => (c.city ? c.city === city : true));
  }, [cars, userCharacter?.location]);

  // Seed mocked market list (remove once you read from Firestore)
  useEffect(() => {
    const qAll = query(
      collection(db, "Auctions"),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(
      qAll,
      (snap) => {
        const items: Listing[] = snap.docs
          .map((d) => {
            const v = d.data() as any;
            return {
              id: d.id,
              category: (v.category || "items") as Category,
              itemType: v.itemType || "Item",
              name: v.name || "Ukjent",
              quantity: v.quantity ?? 1,
              price: v.price ?? 0,
              seller: {
                id: v.sellerId ?? "",
                username: v.sellerName ?? "Ukjent",
              },
              createdAt: v.createdAt?.toMillis
                ? v.createdAt.toMillis()
                : Date.now(),
              car: v.carId
                ? { id: v.carId, tier: v.car?.tier ?? null }
                : undefined,
              location: v.location ?? null,
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);

        setAllListings(items);
      },
      (err) => {
        console.error("Failed to subscribe to auctions:", err);
        setAllListings([]);
      }
    );

    return () => unsub();
  }, []);

  // Derived listing sets
  const marketListings = useMemo(() => allListings, [allListings]);

  const filteredMarket = useMemo(() => {
    const term = search.trim().toLowerCase();
    return marketListings
      .filter((l) =>
        filterCategory === "all" ? true : l.category === filterCategory
      )
      .filter((l) => (term ? l.name.toLowerCase().includes(term) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [marketListings, filterCategory, search]);

  // --- Post a listing --------------------------------------------------------
  const handlePostListing = async () => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være innlogget med en spillkarakter.");
      return;
    }

    if (category === "cars") {
      if (!selectedCar) {
        setMessageType("warning");
        setMessage("Velg en bil du vil selge.");
        return;
      }
      if (price <= 0) {
        setMessageType("warning");
        setMessage("Du må skrive en pris.");
        return;
      }

      const display = carBaseName(selectedCar);

      try {
        // Move car: Characters/{uid}/cars/{carId} -> Auctions/{newId}
        const batch = writeBatch(db);

        const carRef = doc(
          db,
          "Characters",
          userCharacter.id,
          "cars",
          selectedCar.id
        );

        const auctionRef = doc(collection(db, "Auctions"));

        batch.set(auctionRef, {
          status: "active",
          category: "cars",
          itemType: "Car",
          name: display, // for quick listing display
          price,
          sellerId: userCharacter.id,
          sellerName: userCharacter.username,
          createdAt: serverTimestamp(),
          location: selectedCar.city ?? userCharacter.location ?? null,

          // keep a quick reference + ALL original car fields
          carId: selectedCar.id,
          car: { ...selectedCar },
        });

        batch.delete(carRef);

        await batch.commit();

        // UI: add to local lists so it shows immediately
        const now = Date.now();
        const listing: Listing = {
          id: auctionRef.id,
          category: "cars",
          itemType: "Car",
          name: display,
          quantity: 1,
          price,
          seller: { id: userCharacter.id, username: userCharacter.username },
          createdAt: now,
          car: { id: selectedCar.id, tier: selectedCar.tier ?? null },
          location: selectedCar.city ?? userCharacter.location ?? null,
        };
        setAllListings((prev) => [listing, ...prev]);
        setMyListings((prev) => [listing, ...prev]);

        // Clear selection & price
        setSelectedCar(null);
        setPrice(0);

        setMessageType("success");
        setMessage(
          <p>
            <Item
              name={selectedCar.name || "Bilen"}
              tier={selectedCar.tier || 1}
            />{" "}
            ble lagt ut for salg.
          </p>
        );
      } catch (e) {
        console.error("Kunne ikke flytte bilen til Auctions:", e);
        setMessageType("failure");
        setMessage("Noe gikk galt. Prøv igjen.");
      }

      return;
    }

    // Non-car categories
    if (!itemName.trim()) {
      setMessageType("warning");
      setMessage("Skriv inn et varenavn.");
      return;
    }
    if (quantity <= 0) {
      setMessageType("warning");
      setMessage("Antall må være større enn 0.");
      return;
    }
    if (price <= 0) {
      setMessageType("warning");
      setMessage("Du må skrive en pris.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "BlackMarketListings"), {
        category,
        itemType,
        name: itemName.trim(),
        quantity,
        price,
        seller: {
          id: userCharacter.id,
          username: userCharacter.username,
        },
        createdAt: serverTimestamp(),
        location: userCharacter.location ?? null,
      });

      const now = Date.now();
      const listing: Listing = {
        id: docRef.id,
        category,
        itemType,
        name: itemName.trim(),
        quantity,
        price,
        seller: { id: userCharacter.id, username: userCharacter.username },
        createdAt: now,
        location: userCharacter.location ?? null,
      };

      setAllListings((prev) => [listing, ...prev]);
      setMyListings((prev) => [listing, ...prev]);

      setItemName("");
      setQuantity(1);
      setPrice(0);

      setMessageType("success");
      setMessage("Annonse publisert på svartebørsen.");
    } catch (e) {
      console.error("Kunne ikke publisere annonse:", e);
      setMessageType("failure");
      setMessage("Noe gikk galt. Prøv igjen.");
    }
  };

  const handleCancelListing = async (auctionId: string) => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være innlogget.");
      return;
    }

    try {
      const auctionRef = doc(db, "Auctions", auctionId);
      const snap = await getDoc(auctionRef);
      if (!snap.exists()) {
        setMessageType("warning");
        setMessage("Annonsen finnes ikke lenger.");
        return;
      }

      const v = snap.data() as any;

      // Only cars need to be moved back to the seller's garage
      if (v.category === "cars" && v.carId && v.car) {
        const batch = writeBatch(db);
        const carRef = doc(db, "Characters", userCharacter.id, "cars", v.carId);
        batch.set(carRef, v.car); // put car back
        batch.delete(auctionRef); // remove auction
        await batch.commit();
      } else {
        // Non-car: just remove the auction
        await deleteDoc(auctionRef);
      }

      setMessageType("success");
      setMessage("Annonsen ble fjernet.");
    } catch (e) {
      console.error("handleCancelListing failed:", e);
      setMessageType("failure");
      setMessage("Kunne ikke fjerne annonsen.");
    }
  };

  const handleBuy = async (auctionId: string) => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være innlogget.");
      return;
    }

    try {
      await runTransaction(db, async (tx) => {
        const auctionRef = doc(db, "Auctions", auctionId);
        const auctionSnap = await tx.get(auctionRef);
        if (!auctionSnap.exists())
          throw new Error("Annonsen finnes ikke lenger.");

        const a = auctionSnap.data() as any;
        if (a.status !== "active") throw new Error("Annonsen er ikke aktiv.");
        if (a.sellerId === userCharacter.id) {
          throw new Error("Du kan ikke kjøpe fra deg selv");
        }
        if (a.category !== "cars" || !a.carId || !a.car)
          throw new Error("Kjøp støttes kun for biler akkurat nå.");

        const price: number = a.price ?? 0;
        const buyerCharRef = doc(db, "Characters", userCharacter.id);
        const buyerSnap = await tx.get(buyerCharRef);
        if (!buyerSnap.exists()) throw new Error("Karakter ikke funnet.");

        const buyer = buyerSnap.data() as any;
        const money: number = buyer?.stats?.money ?? 0;
        if (money < price) throw new Error("Du har ikke nok penger.");

        // subtract money
        tx.update(buyerCharRef, {
          "stats.money": money - price,
          lastActive: serverTimestamp(),
        });

        // move car to buyer's garage
        const buyerCarRef = doc(
          db,
          "Characters",
          userCharacter.id,
          "cars",
          a.carId
        );
        tx.set(buyerCarRef, a.car);

        // delete the auction
        tx.delete(auctionRef);
      });

      setMessageType("success");
      setMessage("Kjøp fullført. Bilen er lagt i garasjen din.");
    } catch (e: any) {
      console.error("handleBuy failed:", e);
      setMessageType("failure");
      setMessage(e?.message || "Kunne ikke gjennomføre kjøpet.");
    }
  };

  return (
    <>
      <H2>Svartebørs</H2>
      <p className="mb-4">
        Her kan du legge ut biler, våpen, kuler og andre varer for salg, eller
        kjøpe fra andre spillere.
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex flex-wrap gap-4">
        {/* Market list */}
        <Box>
          <H3>Annonser</H3>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center mt-2">
            <Button
              size="small"
              style={filterCategory === "all" ? "primary" : "text"}
              onClick={() => setFilterCategory("all")}
            >
              Alle
            </Button>
            <Button
              size="small"
              style={filterCategory === "cars" ? "primary" : "text"}
              onClick={() => setFilterCategory("cars")}
            >
              Biler
            </Button>
            <Button
              size="small"
              style={filterCategory === "bullets" ? "primary" : "text"}
              onClick={() => setFilterCategory("bullets")}
            >
              Kuler
            </Button>
            <Button
              size="small"
              style={filterCategory === "weapons" ? "primary" : "text"}
              onClick={() => setFilterCategory("weapons")}
            >
              Våpen
            </Button>
            <Button
              size="small"
              style={filterCategory === "items" ? "primary" : "text"}
              onClick={() => setFilterCategory("items")}
            >
              Annet
            </Button>

            <div className="ml-auto w-full sm:w-72">
              <input
                className="w-full bg-transparent border-b border-neutral-600 py-2 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                placeholder="Søk etter varer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          {filteredMarket.length === 0 ? (
            <p className="text-neutral-400 mt-3">Ingen treff.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {filteredMarket.map((l) => {
                const isCar = l.category === "cars";
                const nameNoTier = stripTierSuffix(l.name);
                return (
                  <li
                    key={l.id}
                    className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-neutral-100 font-semibold flex items-center gap-2">
                        {isCar ? (
                          <Item
                            name={nameNoTier}
                            tier={l.car?.tier ?? undefined}
                          />
                        ) : (
                          nameNoTier
                        )}
                        <span className="text-neutral-200 font-normal">
                          {isCar ? (
                            <>
                              <i className="fa-solid fa-dollar-sign"></i>{" "}
                              <strong>{fmt(l.price)}</strong>
                            </>
                          ) : (
                            <>
                              · {l.quantity} stk ·{" "}
                              <i className="fa-solid fa-dollar-sign"></i>{" "}
                              <strong>{fmt(l.price)}</strong>
                            </>
                          )}
                        </span>
                      </span>
                      <span className="text-sm text-neutral-400">
                        Selgers av{" "}
                        <Username
                          character={{
                            id: l.seller.id,
                            username: l.seller.username,
                          }}
                        />{" "}
                        · {labelForCategory(l.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="small" onClick={() => handleBuy(l.id)}>
                        Kjøp
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Box>

        {/* Layout: form + my listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Box>
            <H3>Ny annonse</H3>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  style={category === "cars" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("cars");
                    setItemType("Car");
                    setSelectedCar(null);
                  }}
                >
                  Biler
                </Button>
                <Button
                  size="small"
                  style={category === "bullets" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("bullets");
                    setItemType("Ammo");
                    setSelectedCar(null);
                  }}
                >
                  Kuler
                </Button>
                <Button
                  size="small"
                  style={category === "weapons" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("weapons");
                    setItemType("Gun");
                    setSelectedCar(null);
                  }}
                >
                  Våpen
                </Button>
                <Button
                  size="small"
                  style={category === "items" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("items");
                    setItemType("Item");
                    setSelectedCar(null);
                  }}
                >
                  Annet
                </Button>
              </div>

              {/* Cars: list cars in same city; click to pick one; then show only price */}
              {category === "cars" ? (
                <div className="grid gap-2">
                  {!selectedCar ? (
                    <>
                      {carsInMyCity.length === 0 ? (
                        <p className="text-neutral-400">
                          Du har ingen biler i denne byen.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {carsInMyCity.map((c) => {
                            const catalog = c.key
                              ? getCarByKey(c.key)
                              : getCarByName(c.name || "car");
                            return (
                              <li key={c.id}>
                                <Button
                                  size="text"
                                  style="text"
                                  onClick={() => {
                                    setSelectedCar(c);
                                    setItemName(carBaseName(c)); // store base name
                                  }}
                                  title="Velg bil"
                                >
                                  <Item
                                    name={c.name || "car"}
                                    tier={c.tier}
                                    tooltipImg={catalog?.img}
                                    tooltipContent={
                                      <div>
                                        <p>
                                          Effekt:{" "}
                                          <strong className="text-neutral-200">
                                            {c.hp} hk
                                          </strong>
                                        </p>
                                        <p>
                                          Verdi:{" "}
                                          <strong className="text-neutral-200">
                                            <i className="fa-solid fa-dollar-sign"></i>{" "}
                                            {c.value?.toLocaleString("nb-NO")}
                                          </strong>
                                        </p>
                                      </div>
                                    }
                                  />
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Item
                          name={selectedCar.name || "car"}
                          tier={selectedCar.tier}
                          tooltipImg={selectedCatalog?.img}
                          tooltipContent={
                            <div>
                              <p>
                                Effekt:{" "}
                                <strong className="text-neutral-200">
                                  {selectedCar.hp} hk
                                </strong>
                              </p>
                              <p>
                                Verdi:{" "}
                                <strong className="text-neutral-200">
                                  <i className="fa-solid fa-dollar-sign"></i>{" "}
                                  {selectedCar.value?.toLocaleString("nb-NO")}
                                </strong>
                              </p>
                            </div>
                          }
                        />
                        <Button
                          size="text"
                          style="text"
                          onClick={() => {
                            setSelectedCar(null);
                            setPrice(0);
                          }}
                          title="Bytt bil"
                        >
                          Bytt
                        </Button>
                      </div>

                      {/* Price only (no Antall for cars) */}
                      <div className="grid gap-1">
                        <label
                          htmlFor="bm-price"
                          className="text-sm text-neutral-400"
                        >
                          Pris
                        </label>
                        <input
                          id="bm-price"
                          inputMode="numeric"
                          className="bg-transparent border-b border-neutral-600 py-2 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none w-44"
                          value={price === 0 ? "" : fmt(price)}
                          placeholder="0"
                          onChange={(e) => {
                            const n = parseInt(
                              e.target.value.replace(/[^\d]/g, ""),
                              10
                            );
                            setPrice(Number.isFinite(n) ? n : 0);
                          }}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={handlePostListing}>
                          <i className="fa-solid fa-plus" /> Publiser
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Non-car categories: generic fields
                <>
                  <div className="grid gap-1">
                    <label
                      htmlFor="bm-name"
                      className="text-sm text-neutral-400"
                    >
                      Varenavn
                    </label>
                    <input
                      id="bm-name"
                      className="bg-transparent border-b border-neutral-600 py-2 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                      placeholder={
                        category === "bullets"
                          ? "Eks: 9mm kuler"
                          : category === "weapons"
                          ? "Eks: Uzi"
                          : "Eks: Diamanter"
                      }
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1">
                    <label
                      htmlFor="bm-qty"
                      className="text-sm text-neutral-400"
                    >
                      Antall
                    </label>
                    <input
                      id="bm-qty"
                      inputMode="numeric"
                      className="bg-transparent border-b border-neutral-600 py-2 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none w-28"
                      value={quantity === 0 ? "" : quantity.toString()}
                      placeholder="1"
                      onChange={(e) => {
                        const n = parseInt(
                          e.target.value.replace(/[^\d]/g, ""),
                          10
                        );
                        setQuantity(Number.isFinite(n) ? n : 0);
                      }}
                    />
                  </div>

                  <div className="grid gap-1">
                    <label
                      htmlFor="bm-price"
                      className="text-sm text-neutral-400"
                    >
                      Pris
                    </label>
                    <input
                      id="bm-price"
                      inputMode="numeric"
                      className="bg-transparent border-b border-neutral-600 py-2 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none w-44"
                      value={price === 0 ? "" : fmt(price)}
                      placeholder="0"
                      onChange={(e) => {
                        const n = parseInt(
                          e.target.value.replace(/[^\d]/g, ""),
                          10
                        );
                        setPrice(Number.isFinite(n) ? n : 0);
                      }}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handlePostListing}>
                      <i className="fa-solid fa-plus" /> Publiser
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Box>

          <Box>
            <H3>Mine annonser</H3>
            {myListings.length === 0 ? (
              <p className="text-neutral-400 mt-2">
                Du har ingen aktive annonser.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {myListings.map((l) => {
                  const isCar = l.category === "cars";
                  const nameNoTier = stripTierSuffix(l.name);
                  return (
                    <li
                      key={l.id}
                      className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex gap-4 items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-neutral-100 font-semibold flex items-center gap-2">
                          {isCar ? (
                            <Item
                              name={nameNoTier}
                              tier={l.car?.tier ?? undefined}
                            />
                          ) : (
                            nameNoTier
                          )}
                          <span className="text-neutral-200 font-normal">
                            {isCar ? (
                              <>
                                <i className="fa-solid fa-dollar-sign"></i>{" "}
                                <strong>{fmt(l.price)}</strong>
                              </>
                            ) : (
                              <>
                                · {l.quantity} stk ·{" "}
                                <i className="fa-solid fa-dollar-sign"></i>{" "}
                                <strong>{fmt(l.price)}</strong>
                              </>
                            )}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="small"
                          style="danger"
                          onClick={() => handleCancelListing(l.id)}
                        >
                          Fjern
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Box>
        </div>
      </div>
    </>
  );
};

export default BlackMarket;
