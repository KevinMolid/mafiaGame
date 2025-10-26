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
import ItemTile from "../components/ItemTile"; // <— NEW

// Functions
import { getCarByName, getCarByKey } from "../Data/Cars";
import { dmgPercent, valueAfterDamage } from "../Functions/RewardFunctions";

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
  car?: CarDoc;
  location?: string | null;
  bullet?: {
    name?: string | null;
    tier?: number | null;
    attack?: number | null;
    img?: string | null;
    typeId?: string | null;
  };
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

type BulletDoc = {
  docId: string;
  type: "bullet";
  attack?: number;
  name?: string;
  quantity?: number;
  tier: number;
  value: number;
  img: string;
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

  // Items owned by player (subcollection)
  const [cars, setCars] = useState<CarDoc[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarDoc | null>(null);
  const [bullets, setBullets] = useState<BulletDoc[]>([]);
  const [selectedBullet, setSelectedBullet] = useState<BulletDoc | null>(null);

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

  // --- Subscribe to the user's Bullets (items subcollection, type == "bullet")
  useEffect(() => {
    if (!userCharacter?.id) {
      setBullets([]);
      return;
    }
    const itemsRef = collection(db, "Characters", userCharacter.id, "items");
    const qBullets = query(itemsRef, where("type", "==", "bullet"));
    const unsub = onSnapshot(
      qBullets,
      (snap) => {
        const list: BulletDoc[] = snap.docs.map((d) => ({
          docId: d.id, // << keep doc id here
          ...(d.data() as any), // item data (may include its own "id" field)
        }));
        setBullets(list);
      },
      (err) => {
        console.error("Failed to subscribe to bullets:", err);
        setBullets([]);
      }
    );
    return () => unsub();
  }, [userCharacter?.id]);

  // --- Subscribe to my Auctions --------------------------------------------
  useEffect(() => {
    if (!userCharacter?.id) {
      setMyListings([]);
      return;
    }

    const qMine = query(
      collection(db, "Auctions"),
      where("sellerId", "==", userCharacter.id)
    );

    const unsub = onSnapshot(
      qMine,
      (snap) => {
        const items: Listing[] = snap.docs
          .map((d) => {
            const v = d.data() as any;
            return {
              id: d.id,
              category: (v.category || "cars") as Category,
              itemType: v.itemType || "Car",
              name: v.name || "Ukjent",
              img: v.img || "",
              quantity: v.quantity ?? 1,
              price: v.price ?? 0,
              seller: { id: v.sellerId, username: v.sellerName },
              createdAt: v.createdAt?.toMillis
                ? v.createdAt.toMillis()
                : Date.now(),
              car: v.carId ? { id: v.carId, ...(v.car || {}) } : undefined,
              bullet: v.bullet ?? undefined,
              location: v.location ?? null,
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);

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

  // Market list (Auctions, status = active)
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
              car: v.carId ? { id: v.carId, ...(v.car || {}) } : undefined,
              bullet: v.bullet ?? undefined,
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

    // ----- Cars -----
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
          name: display,
          price,
          sellerId: userCharacter.id,
          sellerName: userCharacter.username,
          createdAt: serverTimestamp(),
          location: selectedCar.city ?? userCharacter.location ?? null,
          carId: selectedCar.id,
          car: { ...selectedCar },
        });

        batch.delete(carRef);

        await batch.commit();

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
          car: { ...selectedCar },
          location: selectedCar.city ?? userCharacter.location ?? null,
        };
        setAllListings((prev) => [listing, ...prev]);
        setMyListings((prev) => [listing, ...prev]);

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

    // ----- Bullets -----
    if (category === "bullets") {
      if (!selectedBullet) {
        setMessageType("warning");
        setMessage("Velg en kule-stabel du vil selge.");
        return;
      }
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
        await runTransaction(db, async (tx) => {
          // Use the real document id from Firestore
          const itemRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            selectedBullet.docId
          );

          const snap = await tx.get(itemRef);
          if (!snap.exists()) {
            throw new Error("Kule-stabelen finnes ikke lenger.");
          }

          const data = snap.data() as any;
          const owned: number = Number(data.quantity ?? 0);
          if (owned < quantity) {
            throw new Error(`Du har bare ${owned} kuler i denne stabelen.`);
          }

          // Create auction listing for the SOLD portion
          const auctionRef = doc(collection(db, "Auctions"));
          tx.set(auctionRef, {
            status: "active",
            category: "bullets",
            itemType: "Ammo",
            name: itemName.trim(),
            quantity,
            price,
            sellerId: userCharacter.id,
            sellerName: userCharacter.username,
            createdAt: serverTimestamp(),
            location: userCharacter.location ?? null,

            // Keep references for easy cancel/restore
            bulletId: selectedBullet.docId,
            bullet: {
              name: selectedBullet.name ?? itemName.trim(),
              tier: selectedBullet.tier ?? null,
              attack: selectedBullet.attack ?? null,
              img: selectedBullet.img ?? null,
              // you can keep type-id too if you store it in the item
              typeId: (data as any)?.id ?? null,
            },
          });

          // Split the stack: decrement player's remaining stack
          const newQty = owned - quantity;
          if (newQty <= 0) {
            // selling whole stack -> remove the doc
            tx.delete(itemRef);
          } else {
            // selling part of stack -> keep doc with remainder
            tx.update(itemRef, {
              quantity: newQty,
              lastUpdated: serverTimestamp(),
            });
          }
        });

        setMessageType("success");
        setMessage("Kulene ble lagt ut for salg.");

        setSelectedBullet(null);
        setItemName("");
        setQuantity(1);
        setPrice(0);
      } catch (e: any) {
        console.error("Kunne ikke publisere kule-annonse:", e);
        setMessageType("failure");
        setMessage(e?.message || "Noe gikk galt. Prøv igjen.");
      }

      return;
    }

    // ----- Generic (weapons/items) -----
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
      const docRef = await addDoc(collection(db, "Auctions"), {
        status: "active",
        category,
        itemType,
        name: itemName.trim(),
        quantity,
        price,
        sellerId: userCharacter.id,
        sellerName: userCharacter.username,
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
      await runTransaction(db, async (tx) => {
        const auctionRef = doc(db, "Auctions", auctionId);
        const snap = await tx.get(auctionRef);
        if (!snap.exists()) {
          throw new Error("Annonsen finnes ikke lenger.");
        }
        const v = snap.data() as any;

        if (v.category === "cars" && v.carId && v.car) {
          const carRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "cars",
            v.carId
          );
          tx.set(carRef, v.car);
          tx.delete(auctionRef);
          return;
        }

        if (v.category === "bullets" && v.bulletId && v.quantity > 0) {
          const itemRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            v.bulletId // this is the inventory doc id we stored earlier
          );

          const itemSnap = await tx.get(itemRef);
          if (itemSnap.exists()) {
            const cur = itemSnap.data() as any;
            const curQty = Number(cur.quantity ?? 0);
            tx.update(itemRef, {
              quantity: curQty + Number(v.quantity),
              lastUpdated: serverTimestamp(),
            });
          } else {
            // Item doc no longer exists — recreate it with the returned quantity
            tx.set(itemRef, {
              type: "bullet",
              name: v?.bullet?.name ?? "Kuler",
              quantity: Number(v.quantity),
              tier: v?.bullet?.tier ?? null,
              attack: v?.bullet?.attack ?? null,
              img: v?.bullet?.img ?? null,
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
            });
          }
          tx.delete(auctionRef);
          return;
        }

        tx.delete(auctionRef);
      });

      setMessageType("success");
      setMessage("Annonsen ble fjernet.");
    } catch (e: any) {
      console.error("handleCancelListing failed:", e);
      setMessageType("failure");
      setMessage(e?.message || "Kunne ikke fjerne annonsen.");
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

        // Still limited to cars (unchanged)
        if (a.category !== "cars" || !a.carId || !a.car)
          throw new Error("Kjøp støttes kun for biler akkurat nå.");

        const price: number = a.price ?? 0;
        const buyerCharRef = doc(db, "Characters", userCharacter.id);
        const buyerSnap = await tx.get(buyerCharRef);
        if (!buyerSnap.exists()) throw new Error("Karakter ikke funnet.");

        const buyer = buyerSnap.data() as any;
        const money: number = buyer?.stats?.money ?? 0;
        if (money < price) throw new Error("Du har ikke nok penger.");

        tx.update(buyerCharRef, {
          "stats.money": money - price,
          lastActive: serverTimestamp(),
        });

        const buyerCarRef = doc(
          db,
          "Characters",
          userCharacter.id,
          "cars",
          a.carId
        );
        tx.set(buyerCarRef, a.car);

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

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

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
                const isBullet = l.category === "bullets";
                const nameNoTier = stripTierSuffix(l.name);
                return (
                  <li
                    key={l.id}
                    className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex flex-wrap gap-2 items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-neutral-100 font-semibold flex flex-wrap items-center gap-2">
                        {isCar ? (
                          <Item
                            name={nameNoTier}
                            tier={l.car?.tier ?? undefined}
                            itemType="car"
                            tooltipImg={l.car?.img}
                            tooltipContent={
                              <div>
                                <p>
                                  Effekt:{" "}
                                  <strong className="text-neutral-200">
                                    {l.car?.hp ?? 0} hk
                                  </strong>
                                </p>
                                <p>
                                  Skade:{" "}
                                  <strong className="text-neutral-200">
                                    {dmgPercent(l.car?.damage)}%
                                  </strong>
                                </p>
                                <p>
                                  Verdi:{" "}
                                  <strong className="text-neutral-200">
                                    <i className="fa-solid fa-dollar-sign"></i>{" "}
                                    {valueAfterDamage(
                                      l.car?.value,
                                      l.car?.damage
                                    ).toLocaleString("nb-NO")}
                                  </strong>
                                </p>
                              </div>
                            }
                          />
                        ) : isBullet ? (
                          <Item
                            name={nameNoTier}
                            tier={l.bullet?.tier ?? undefined}
                            tooltipImg={l.bullet?.img ?? undefined}
                            tooltipContent={
                              <ul className="space-y-0.5">
                                {"attack" in (l.bullet ?? {}) && (
                                  <li>
                                    Angrep:{" "}
                                    <strong className="text-neutral-200">
                                      +{l.bullet?.attack ?? 0}
                                    </strong>
                                  </li>
                                )}
                                <li>
                                  Antall:{" "}
                                  <strong className="text-neutral-200">
                                    {(l.quantity ?? 0).toLocaleString("nb-NO")}
                                  </strong>
                                </li>
                              </ul>
                            }
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
                        Selges av{" "}
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
                    setSelectedBullet(null);
                    setItemName("");
                    setQuantity(1);
                    setPrice(0);
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
                    setSelectedBullet(null);
                    setItemName("");
                    setQuantity(1);
                    setPrice(0);
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
                    setSelectedBullet(null);
                    setItemName("");
                    setQuantity(1);
                    setPrice(0);
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
                    setSelectedBullet(null);
                    setItemName("");
                    setQuantity(1);
                    setPrice(0);
                  }}
                >
                  Annet
                </Button>
              </div>

              {/* Cars: unchanged */}
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
                                    setItemName(carBaseName(c));
                                  }}
                                  title="Velg bil"
                                >
                                  <Item
                                    name={c.name || "car"}
                                    tier={c.tier}
                                    itemType="car"
                                    tooltipImg={catalog?.img}
                                    tooltipContent={
                                      <div>
                                        <p>
                                          Effekt:{" "}
                                          <strong className="text-neutral-200">
                                            {c?.hp ?? 0} hk
                                          </strong>
                                        </p>
                                        <p>
                                          Skade:{" "}
                                          <strong className="text-neutral-200">
                                            {dmgPercent(c?.damage)}%
                                          </strong>
                                        </p>
                                        <p>
                                          Verdi:{" "}
                                          <strong className="text-neutral-200">
                                            <i className="fa-solid fa-dollar-sign"></i>{" "}
                                            {valueAfterDamage(
                                              c?.value,
                                              c?.damage
                                            ).toLocaleString("nb-NO")}
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
                          itemType="car"
                          tooltipImg={selectedCatalog?.img}
                          tooltipContent={
                            <div>
                              <p>
                                Effekt:{" "}
                                <strong className="text-neutral-200">
                                  {selectedCar?.hp ?? 0} hk
                                </strong>
                              </p>
                              <p>
                                Skade:{" "}
                                <strong className="text-neutral-200">
                                  {dmgPercent(selectedCar?.damage)}%
                                </strong>
                              </p>
                              <p>
                                Verdi:{" "}
                                <strong className="text-neutral-200">
                                  <i className="fa-solid fa-dollar-sign"></i>{" "}
                                  {valueAfterDamage(
                                    selectedCar?.value,
                                    selectedCar?.damage
                                  ).toLocaleString("nb-NO")}
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

                      {/* Price */}
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
              ) : category === "bullets" ? (
                // BULLETS: render as ItemTile grid (select one -> qty+price form)
                <div className="grid gap-2">
                  {!selectedBullet ? (
                    bullets.length === 0 ? (
                      <p className="text-neutral-400">Du har ingen kuler.</p>
                    ) : (
                      <ul className="flex flex-wrap gap-x-1 gap-y-0 max-w-[500px]">
                        {bullets.map((b, idx) => {
                          const qty = Number(b.quantity ?? 0);
                          return (
                            <li key={b.docId + ":" + idx}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBullet(b);
                                  setItemName(b.name ?? "Kuler");
                                  setQuantity(qty > 0 ? 1 : 0);
                                }}
                                className="focus:outline-none"
                                title="Velg kule-stabel"
                              >
                                <ItemTile
                                  name={b.name ?? "Kuler"}
                                  img={b.img}
                                  tier={b.tier}
                                  qty={qty}
                                  tooltipImg={b.img ?? undefined}
                                  tooltipContent={
                                    <ul className="space-y-0.5">
                                      {"attack" in b && (
                                        <li>
                                          Angrep:{" "}
                                          <strong className="text-neutral-200">
                                            +{b.attack ?? 0}
                                          </strong>
                                        </li>
                                      )}
                                      <li>
                                        Antall:{" "}
                                        <strong className="text-neutral-200">
                                          {qty.toLocaleString("nb-NO")}
                                        </strong>
                                      </li>
                                    </ul>
                                  }
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : (
                    <>
                      {/* Selected bullet header */}
                      <div className="flex items-center gap-3">
                        <ItemTile
                          name={selectedBullet.name ?? "Kuler"}
                          img={selectedBullet.img ?? undefined}
                          tier={selectedBullet.tier}
                          qty={Number(selectedBullet.quantity ?? 0)}
                        />
                        <div className="flex flex-col">
                          <span className="text-neutral-100 font-semibold">
                            {selectedBullet.name ?? "Kuler"}
                          </span>
                        </div>
                        <Button
                          size="text"
                          style="text"
                          onClick={() => {
                            setSelectedBullet(null);
                            setItemName("");
                            setQuantity(1);
                            setPrice(0);
                          }}
                        >
                          Bytt
                        </Button>
                      </div>

                      {/* Name */}
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
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                        />
                      </div>

                      {/* Quantity (cap to owned) */}
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
                            const owned = Number(selectedBullet?.quantity ?? 0);
                            let n = parseInt(
                              e.target.value.replace(/[^\d]/g, ""),
                              10
                            );
                            if (!Number.isFinite(n)) n = 0;
                            n = Math.max(0, Math.min(n, owned));
                            setQuantity(n);
                          }}
                        />
                      </div>

                      {/* Price */}
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
                // Non-car, non-bullets: generic fields
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
                        category === "weapons" ? "Eks: Uzi" : "Eks: Diamanter"
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
                  const isBullet = l.category === "bullets";
                  const nameNoTier = stripTierSuffix(l.name);
                  return (
                    <li
                      key={l.id}
                      className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex flex-wrap gap-4 items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-neutral-100 font-semibold flex flex-wrap items-center gap-2">
                          {isCar ? (
                            <Item
                              name={nameNoTier}
                              tier={l.car?.tier ?? undefined}
                              itemType="car"
                              tooltipImg={l.car?.img && l.car.img}
                              tooltipContent={
                                <div>
                                  <p>
                                    Effekt:{" "}
                                    <strong className="text-neutral-200">
                                      {l.car?.hp ?? 0} hk
                                    </strong>
                                  </p>
                                  <p>
                                    Skade:{" "}
                                    <strong className="text-neutral-200">
                                      {dmgPercent(l.car?.damage)}%
                                    </strong>
                                  </p>
                                  <p>
                                    Verdi:{" "}
                                    <strong className="text-neutral-200">
                                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                                      {valueAfterDamage(
                                        l.car?.value,
                                        l.car?.damage
                                      ).toLocaleString("nb-NO")}
                                    </strong>
                                  </p>
                                </div>
                              }
                            />
                          ) : isBullet ? (
                            <Item
                              name={nameNoTier}
                              tier={l.bullet?.tier ?? undefined}
                              tooltipImg={l.bullet?.img ?? undefined}
                              tooltipContent={
                                <ul className="space-y-0.5">
                                  {"attack" in (l.bullet ?? {}) && (
                                    <li>
                                      Angrep:{" "}
                                      <strong className="text-neutral-200">
                                        +{l.bullet?.attack ?? 0}
                                      </strong>
                                    </li>
                                  )}
                                  <li>
                                    Antall:{" "}
                                    <strong className="text-neutral-200">
                                      {(l.quantity ?? 0).toLocaleString(
                                        "nb-NO"
                                      )}
                                    </strong>
                                  </li>
                                </ul>
                              }
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
