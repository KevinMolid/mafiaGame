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
import ItemTile from "../components/ItemTile";

// Inventory helpers
import {
  hydrateItemDoc,
  hydrateCarDoc,
  ItemDoc as RawItemDoc,
  CarDoc as RawCarDoc,
} from "../Functions/InventoryHelpers";

// Context
import { useCharacter } from "../CharacterContext";

// Firestore
import {
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

// Local view type for items: flattened catalog + raw + docId
type ViewItem = { docId: string; quantity: number } & Record<string, any>;

// Local view type for cars: hydrated via InventoryHelpers
type ViewCar = {
  docId: string;
  raw: RawCarDoc;
  catalog: any | null;
  damage: number;
  currentValue: number;
};

type BulletDoc = ViewItem;

// Alle andre items i inventory (utstyr + narkotika + kuler, vi filtrerer senere)
type ItemDoc = ViewItem;

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
  car?: {
    raw: RawCarDoc;
    catalog: any | null;
    damage: number;
    currentValue: number;
  };
  location?: string | null;
  bullet?: {
    name?: string | null;
    tier?: number | null;
    attack?: number | null;
    img?: string | null;
    typeId?: string | null;
  };
  item?: {
    name?: string | null;
    tier?: number | null;
    attack?: number | null;
    hp?: number | null;
    img?: string | null;
    slot?: string | null;
    typeId?: string | null;
    type?: string | null;
    value?: number | null;
  };
};

// Helpers
const fmt = (n: number) => n.toLocaleString("nb-NO");
const stripTierSuffix = (s: string) => s.replace(/\s*\(T\d+\)\s*$/, "");

// Flatten hydrated item into a convenient view shape
function toViewItem(h: ReturnType<typeof hydrateItemDoc>): ViewItem {
  return {
    docId: h.docId,
    quantity: h.quantity,
    ...(h.catalog || {}),
    ...(h.raw || {}),
  };
}

function labelForCategory(c: Category) {
  if (c === "cars") return "Biler";
  if (c === "bullets") return "Kuler";
  if (c === "weapons") return "Utstyr";
  return "Narkotika";
}

// Car display name from catalog + raw
const carBaseName = (c: ViewCar) =>
  c.raw.name ||
  c.catalog?.name ||
  [c.catalog?.brand, c.catalog?.model].filter(Boolean).join(" ") ||
  c.raw.modelKey ||
  c.raw.key ||
  "Bil";

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
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);

  // Items owned by player (subcollection)
  const [cars, setCars] = useState<ViewCar[]>([]);
  const [selectedCar, setSelectedCar] = useState<ViewCar | null>(null);

  const [bullets, setBullets] = useState<BulletDoc[]>([]);
  const [selectedBullet, setSelectedBullet] = useState<BulletDoc | null>(null);

  // Alle items i inventory (inkludert kuler, utstyr, narkotika)
  const [inventoryItems, setInventoryItems] = useState<ItemDoc[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<ItemDoc | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<ItemDoc | null>(null);

  // Local listing data
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  // Filters for “Markedet”
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");

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
        const list: ViewCar[] = snap.docs.map((d) => {
          const h = hydrateCarDoc(d.id, d.data() as RawCarDoc);
          return {
            docId: h.docId,
            raw: h.raw,
            catalog: h.catalog,
            damage: h.damage,
            currentValue: h.currentValue,
          };
        });
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
        const list: BulletDoc[] = snap.docs.map((d) =>
          toViewItem(hydrateItemDoc(d.id, d.data() as RawItemDoc))
        );
        setBullets(list);
      },
      (err) => {
        console.error("Failed to subscribe to bullets:", err);
        setBullets([]);
      }
    );
    return () => unsub();
  }, [userCharacter?.id]);

  // --- Subscribe til alle items (utstyr + narkotika + kuler) ------------
  useEffect(() => {
    if (!userCharacter?.id) {
      setInventoryItems([]);
      return;
    }

    const itemsRef = collection(db, "Characters", userCharacter.id, "items");
    const unsub = onSnapshot(
      itemsRef,
      (snap) => {
        const list: ItemDoc[] = snap.docs.map((d) =>
          toViewItem(hydrateItemDoc(d.id, d.data() as RawItemDoc))
        );
        setInventoryItems(list);
      },
      (err) => {
        console.error("Failed to subscribe to items:", err);
        setInventoryItems([]);
      }
    );

    return () => unsub();
  }, [userCharacter?.id]);

  // Utstyr = alle items med slot (hat, jacket, weapon, feet, face, neck, hands, ring)
  const equipmentItems = useMemo(
    () =>
      inventoryItems.filter(
        (i) =>
          i.type !== "bullet" &&
          i.type !== "narcotic" &&
          typeof i.slot === "string" &&
          i.slot.trim().length > 0
      ),
    [inventoryItems]
  );

  // Narkotika = items med type === "narcotic"
  const narcoticItems = useMemo(
    () => inventoryItems.filter((i) => i.type === "narcotic"),
    [inventoryItems]
  );

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

            const carHydrated =
              v.carId && v.car
                ? (() => {
                    const h = hydrateCarDoc(v.carId, v.car as RawCarDoc);
                    return {
                      raw: h.raw,
                      catalog: h.catalog,
                      damage: h.damage,
                      currentValue: h.currentValue,
                    };
                  })()
                : undefined;

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
              car: carHydrated,
              bullet: v.bullet ?? undefined,
              item: v.item ?? undefined,
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
    return cars.filter((c) => (c.raw.city ? c.raw.city === city : true));
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

            const carHydrated =
              v.carId && v.car
                ? (() => {
                    const h = hydrateCarDoc(v.carId, v.car as RawCarDoc);
                    return {
                      raw: h.raw,
                      catalog: h.catalog,
                      damage: h.damage,
                      currentValue: h.currentValue,
                    };
                  })()
                : undefined;

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
              car: carHydrated,
              bullet: v.bullet ?? undefined,
              item: v.item ?? undefined,
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
          selectedCar.docId
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
          location: selectedCar.raw.city ?? userCharacter.location ?? null,
          carId: selectedCar.docId,
          // store ONLY raw compact car data in the auction doc
          car: { ...selectedCar.raw },
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
          car: {
            raw: selectedCar.raw,
            catalog: selectedCar.catalog,
            damage: selectedCar.damage,
            currentValue: selectedCar.currentValue,
          },
          location: selectedCar.raw.city ?? userCharacter.location ?? null,
        };
        setAllListings((prev) => [listing, ...prev]);
        setMyListings((prev) => [listing, ...prev]);

        setSelectedCar(null);
        setPrice(0);

        setMessageType("success");
        setMessage(
          <p>
            <Item
              name={carBaseName(selectedCar)}
              tier={selectedCar.catalog?.tier || 1}
              itemType="car"
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

            bulletId: selectedBullet.docId,
            bullet: {
              name: selectedBullet.name ?? itemName.trim(),
              tier: selectedBullet.tier ?? null,
              attack: selectedBullet.attack ?? null,
              img: selectedBullet.img ?? null,
              typeId: (data as any)?.id ?? null,
            },
          });

          // Split the stack: decrement player's remaining stack
          const newQty = owned - quantity;
          if (newQty <= 0) {
            tx.delete(itemRef);
          } else {
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

    // ----- Utstyr (alle items med slot: våpen, klær, ringer, osv.) -----
    if (category === "weapons") {
      if (!selectedEquip) {
        setMessageType("warning");
        setMessage("Velg et utstyr du vil selge.");
        return;
      }
      const name = (itemName || selectedEquip.name || "Utstyr").trim();
      if (!name) {
        setMessageType("warning");
        setMessage("Skriv inn et varenavn.");
        return;
      }
      if (price <= 0) {
        setMessageType("warning");
        setMessage("Du må skrive en pris.");
        return;
      }

      try {
        await runTransaction(db, async (tx) => {
          const itemRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            selectedEquip.docId
          );
          const snap = await tx.get(itemRef);
          if (!snap.exists()) {
            throw new Error("Gjenstanden finnes ikke lenger.");
          }
          const data = snap.data() as any;

          const auctionRef = doc(collection(db, "Auctions"));
          tx.set(auctionRef, {
            status: "active",
            category: "weapons",
            itemType: "Equipment",
            name,
            quantity: 1,
            price,
            sellerId: userCharacter.id,
            sellerName: userCharacter.username,
            createdAt: serverTimestamp(),
            location: userCharacter.location ?? null,
            itemDocId: selectedEquip.docId,
            item: {
              name: data.name ?? selectedEquip.name ?? name,
              tier: data.tier ?? selectedEquip.tier ?? null,
              attack: data.attack ?? null,
              hp: data.hp ?? null,
              img: data.img ?? selectedEquip.img ?? null,
              slot: data.slot ?? null,
              type: data.type ?? null,
              typeId: data.id ?? null,
              value: data.value ?? null,
            },
          });

          // Hele gjenstanden flyttes ut av inventory
          tx.delete(itemRef);
        });

        setMessageType("success");
        setMessage("Utstyret ble lagt ut for salg.");

        setSelectedEquip(null);
        setItemName("");
        setPrice(0);
      } catch (e: any) {
        console.error("Kunne ikke publisere utstyrs-annonse:", e);
        setMessageType("failure");
        setMessage(e?.message || "Noe gikk galt. Prøv igjen.");
      }

      return;
    }

    // ----- Narkotika (stackable, type === 'narcotic') -----
    if (category === "items") {
      if (!selectedDrug) {
        setMessageType("warning");
        setMessage("Velg narkotika du vil selge.");
        return;
      }
      const name = (itemName || selectedDrug.name || "Narkotika").trim();
      if (!name) {
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
          const itemRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            selectedDrug.docId
          );

          const snap = await tx.get(itemRef);
          if (!snap.exists()) {
            throw new Error("Gjenstanden finnes ikke lenger.");
          }
          const data = snap.data() as any;
          const owned: number = Number(data.quantity ?? 0);
          if (owned < quantity) {
            throw new Error(`Du har bare ${owned} stk av denne varen.`);
          }

          const auctionRef = doc(collection(db, "Auctions"));
          tx.set(auctionRef, {
            status: "active",
            category: "items",
            itemType: "Narcotic",
            name,
            quantity,
            price,
            sellerId: userCharacter.id,
            sellerName: userCharacter.username,
            createdAt: serverTimestamp(),
            location: userCharacter.location ?? null,
            itemDocId: selectedDrug.docId,
            item: {
              name: data.name ?? selectedDrug.name ?? name,
              tier: data.tier ?? selectedDrug.tier ?? null,
              img: data.img ?? selectedDrug.img ?? null,
              type: data.type ?? "narcotic",
              value: data.value ?? null,
              stackable: true,
            },
          });

          const newQty = owned - quantity;
          if (newQty <= 0) {
            tx.delete(itemRef);
          } else {
            tx.update(itemRef, {
              quantity: newQty,
              lastUpdated: serverTimestamp(),
            });
          }
        });

        setMessageType("success");
        setMessage("Narkotikaen ble lagt ut for salg.");

        setSelectedDrug(null);
        setItemName("");
        setQuantity(1);
        setPrice(0);
      } catch (e: any) {
        console.error("Kunne ikke publisere narkotika-annonse:", e);
        setMessageType("failure");
        setMessage(e?.message || "Noe gikk galt. Prøv igjen.");
      }

      return;
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
          // v.car is the compact raw car shape
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
            v.bulletId
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
            tx.set(itemRef, {
              type: "bullet",
              name: v?.bullet?.name ?? "Kuler",
              quantity: Number(v.quantity),
              tier: v?.bullet?.tier ?? null,
              attack: v?.bullet?.attack ?? null,
              img: v?.bullet?.img ?? null,
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
              // IMPORTANT: we also want the catalog id if present
              id: v?.bullet?.typeId ?? null,
            });
          }
          tx.delete(auctionRef);
          return;
        }

        if (v.category === "weapons" && v.itemDocId && v.item) {
          const itemRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            v.itemDocId
          );

          const payload = {
            name: v.item.name ?? "Utstyr",
            tier: v.item.tier ?? null,
            img: v.item.img ?? null,
            slot: v.item.slot ?? null,
            type: v.item.type ?? null,
            value: v.item.value ?? null,
            attack: v.item.attack ?? null,
            hp: v.item.hp ?? null,
            quantity: 1,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            id: v.item.typeId ?? null, // catalog id if present
          };

          tx.set(itemRef, payload);
          tx.delete(auctionRef);
          return;
        }

        if (v.category === "items" && v.itemDocId && v.item && v.quantity > 0) {
          const itemRef = doc(
            db,
            "Characters",
            userCharacter.id,
            "items",
            v.itemDocId
          );

          const itemSnap = await tx.get(itemRef);
          const qtyToReturn = Number(v.quantity ?? 0);

          if (itemSnap.exists()) {
            const cur = itemSnap.data() as any;
            const curQty = Number(cur.quantity ?? 0);
            tx.update(itemRef, {
              quantity: curQty + qtyToReturn,
              lastUpdated: serverTimestamp(),
            });
          } else {
            tx.set(itemRef, {
              name: v.item.name ?? "Narkotika",
              tier: v.item.tier ?? null,
              img: v.item.img ?? null,
              type: v.item.type ?? "narcotic",
              value: v.item.value ?? null,
              quantity: qtyToReturn,
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
              id: v.item.typeId ?? null, // catalog id if present
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

        // Fortsatt kun støtte for bil-kjøp
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
        // a.car is the compact raw car shape
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
        Her kan du legge ut biler, utstyr, kuler og narkotika for salg, eller
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
              Utstyr
            </Button>
            <Button
              size="small"
              style={filterCategory === "items" ? "primary" : "text"}
              onClick={() => setFilterCategory("items")}
            >
              Narkotika
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
                const isEquip = l.category === "weapons";
                const isDrug = l.category === "items";
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
                            tier={l.car?.catalog?.tier ?? undefined}
                            itemType="car"
                            tooltipImg={l.car?.catalog?.img}
                            tooltipContent={
                              <div>
                                <p>
                                  Effekt:{" "}
                                  <strong className="text-neutral-200">
                                    {l.car?.catalog?.hp ?? 0} hk
                                  </strong>
                                </p>
                                <p>
                                  Skade:{" "}
                                  <strong className="text-neutral-200">
                                    {l.car?.damage ?? 0}%
                                  </strong>
                                </p>
                                <p>
                                  Verdi:{" "}
                                  <strong className="text-neutral-200">
                                    <i className="fa-solid fa-dollar-sign"></i>{" "}
                                    {(l.car?.currentValue ?? 0).toLocaleString(
                                      "nb-NO"
                                    )}
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
                        ) : isEquip || isDrug ? (
                          <Item
                            name={nameNoTier}
                            tier={l.item?.tier ?? undefined}
                            tooltipImg={l.item?.img ?? undefined}
                            tooltipContent={
                              <ul className="space-y-0.5">
                                {"attack" in (l.item ?? {}) &&
                                  l.item?.attack != null && (
                                    <li>
                                      Angrep:{" "}
                                      <strong className="text-neutral-200">
                                        +{l.item.attack}
                                      </strong>
                                    </li>
                                  )}
                                {"hp" in (l.item ?? {}) &&
                                  l.item?.hp != null && (
                                    <li>
                                      Helse:{" "}
                                      <strong className="text-neutral-200">
                                        +{l.item.hp}
                                      </strong>
                                    </li>
                                  )}
                                {"value" in (l.item ?? {}) &&
                                  l.item?.value != null && (
                                    <li>
                                      Verdi:{" "}
                                      <strong className="text-neutral-200">
                                        {Number(l.item.value).toLocaleString(
                                          "nb-NO"
                                        )}
                                      </strong>
                                    </li>
                                  )}
                                {isDrug && (
                                  <li>
                                    Antall:{" "}
                                    <strong className="text-neutral-200">
                                      {(l.quantity ?? 0).toLocaleString(
                                        "nb-NO"
                                      )}
                                    </strong>
                                  </li>
                                )}
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
                    setSelectedCar(null);
                    setSelectedBullet(null);
                    setSelectedEquip(null);
                    setSelectedDrug(null);
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
                    setSelectedCar(null);
                    setSelectedBullet(null);
                    setSelectedEquip(null);
                    setSelectedDrug(null);
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
                    setSelectedCar(null);
                    setSelectedBullet(null);
                    setSelectedEquip(null);
                    setSelectedDrug(null);
                    setItemName("");
                    setQuantity(1);
                    setPrice(0);
                  }}
                >
                  Utstyr
                </Button>
                <Button
                  size="small"
                  style={category === "items" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("items");
                    setSelectedCar(null);
                    setSelectedBullet(null);
                    setSelectedEquip(null);
                    setSelectedDrug(null);
                    setItemName("");
                    setQuantity(1);
                    setPrice(0);
                  }}
                >
                  Narkotika
                </Button>
              </div>

              {/* Cars */}
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
                          {carsInMyCity.map((c) => (
                            <li key={c.docId}>
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
                                  name={carBaseName(c)}
                                  tier={c.catalog?.tier}
                                  itemType="car"
                                  tooltipImg={c.catalog?.img}
                                  tooltipContent={
                                    <div>
                                      <p>
                                        Effekt:{" "}
                                        <strong className="text-neutral-200">
                                          {c.catalog?.hp ?? 0} hk
                                        </strong>
                                      </p>
                                      <p>
                                        Skade:{" "}
                                        <strong className="text-neutral-200">
                                          {c.damage}%
                                        </strong>
                                      </p>
                                      <p>
                                        Verdi:{" "}
                                        <strong className="text-neutral-200">
                                          <i className="fa-solid fa-dollar-sign"></i>{" "}
                                          {c.currentValue.toLocaleString(
                                            "nb-NO"
                                          )}
                                        </strong>
                                      </p>
                                    </div>
                                  }
                                />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Item
                          name={carBaseName(selectedCar)}
                          tier={selectedCar.catalog?.tier}
                          itemType="car"
                          tooltipImg={selectedCar.catalog?.img}
                          tooltipContent={
                            <div>
                              <p>
                                Effekt:{" "}
                                <strong className="text-neutral-200">
                                  {selectedCar.catalog?.hp ?? 0} hk
                                </strong>
                              </p>
                              <p>
                                Skade:{" "}
                                <strong className="text-neutral-200">
                                  {selectedCar.damage}%
                                </strong>
                              </p>
                              <p>
                                Verdi:{" "}
                                <strong className="text-neutral-200">
                                  <i className="fa-solid fa-dollar-sign"></i>{" "}
                                  {selectedCar.currentValue.toLocaleString(
                                    "nb-NO"
                                  )}
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
                // BULLETS
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

                      {/* Quantity */}
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
              ) : category === "weapons" ? (
                // UTSYR – alle items med slot (ikke-bullets, ikke-narkotika)
                <div className="grid gap-2">
                  {!selectedEquip ? (
                    equipmentItems.length === 0 ? (
                      <p className="text-neutral-400">
                        Du har ikke noe utstyr å selge.
                      </p>
                    ) : (
                      <ul className="flex flex-wrap gap-x-1 gap-y-0 max-w-[500px]">
                        {equipmentItems.map((it, idx) => {
                          const qty = Number(it.quantity ?? 1);
                          return (
                            <li key={it.docId + ":" + idx}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEquip(it);
                                  setItemName(it.name ?? "Utstyr");
                                  setQuantity(1);
                                }}
                                className="focus:outline-none"
                                title="Velg utstyr"
                              >
                                <ItemTile
                                  name={it.name ?? "Utstyr"}
                                  img={it.img}
                                  tier={it.tier}
                                  qty={qty > 1 ? qty : undefined}
                                  tooltipImg={it.img ?? undefined}
                                  tooltipContent={
                                    <ul className="space-y-0.5">
                                      {"attack" in it && (
                                        <li>
                                          Angrep:{" "}
                                          <strong className="text-neutral-200">
                                            +{it.attack ?? 0}
                                          </strong>
                                        </li>
                                      )}
                                      {"hp" in it && (
                                        <li>
                                          Helse:{" "}
                                          <strong className="text-neutral-200">
                                            +{it.hp ?? 0}
                                          </strong>
                                        </li>
                                      )}
                                      {"capacity" in it && (
                                        <li>
                                          Kapasitet:{" "}
                                          <strong className="text-neutral-200">
                                            {it.capacity ?? 0}
                                          </strong>
                                        </li>
                                      )}
                                      {"value" in it && (
                                        <li>
                                          Verdi:{" "}
                                          <strong className="text-neutral-200">
                                            {Number(
                                              it.value ?? 0
                                            ).toLocaleString("nb-NO")}
                                          </strong>
                                        </li>
                                      )}
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
                      <div className="flex items-center gap-3">
                        <ItemTile
                          name={selectedEquip.name ?? "Utstyr"}
                          img={selectedEquip.img ?? undefined}
                          tier={selectedEquip.tier}
                          qty={Number(selectedEquip.quantity ?? 1) || undefined}
                        />
                        <div className="flex flex-col">
                          <span className="text-neutral-100 font-semibold">
                            {selectedEquip.name ?? "Utstyr"}
                          </span>
                        </div>
                        <Button
                          size="text"
                          style="text"
                          onClick={() => {
                            setSelectedEquip(null);
                            setItemName("");
                            setPrice(0);
                          }}
                        >
                          Bytt
                        </Button>
                      </div>

                      {/* Navn */}
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

                      {/* Pris */}
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
                // NARKOTIKA – type === "narcotic", stackable
                <div className="grid gap-2">
                  {!selectedDrug ? (
                    narcoticItems.length === 0 ? (
                      <p className="text-neutral-400">
                        Du har ingen narkotika å selge.
                      </p>
                    ) : (
                      <ul className="flex flex-wrap gap-x-1 gap-y-0 max-w-[500px]">
                        {narcoticItems.map((d, idx) => {
                          const qty = Number(d.quantity ?? 0);
                          return (
                            <li key={d.docId + ":" + idx}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDrug(d);
                                  setItemName(d.name ?? "Narkotika");
                                  setQuantity(qty > 0 ? 1 : 0);
                                }}
                                className="focus:outline-none"
                                title="Velg narkotika"
                              >
                                <ItemTile
                                  name={d.name ?? "Narkotika"}
                                  img={d.img}
                                  tier={d.tier}
                                  qty={qty}
                                  tooltipImg={d.img ?? undefined}
                                  tooltipContent={
                                    <ul className="space-y-0.5">
                                      <li>
                                        Antall:{" "}
                                        <strong className="text-neutral-200">
                                          {qty.toLocaleString("nb-NO")}
                                        </strong>
                                      </li>
                                      {"value" in d && (
                                        <li>
                                          Verdi (per stk):{" "}
                                          <strong className="text-neutral-200">
                                            {Number(
                                              d.value ?? 0
                                            ).toLocaleString("nb-NO")}
                                          </strong>
                                        </li>
                                      )}
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
                      <div className="flex items-center gap-3">
                        <ItemTile
                          name={selectedDrug.name ?? "Narkotika"}
                          img={selectedDrug.img ?? undefined}
                          tier={selectedDrug.tier}
                          qty={Number(selectedDrug.quantity ?? 0)}
                        />
                        <div className="flex flex-col">
                          <span className="text-neutral-100 font-semibold">
                            {selectedDrug.name ?? "Narkotika"}
                          </span>
                        </div>
                        <Button
                          size="text"
                          style="text"
                          onClick={() => {
                            setSelectedDrug(null);
                            setItemName("");
                            setQuantity(1);
                            setPrice(0);
                          }}
                        >
                          Bytt
                        </Button>
                      </div>

                      {/* Navn */}
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

                      {/* Antall */}
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
                            const owned = Number(selectedDrug?.quantity ?? 0);
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

                      {/* Pris */}
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
                  const isEquip = l.category === "weapons";
                  const isDrug = l.category === "items";
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
                              tier={l.car?.catalog?.tier ?? undefined}
                              itemType="car"
                              tooltipImg={l.car?.catalog?.img}
                              tooltipContent={
                                <div>
                                  <p>
                                    Effekt:{" "}
                                    <strong className="text-neutral-200">
                                      {l.car?.catalog?.hp ?? 0} hk
                                    </strong>
                                  </p>
                                  <p>
                                    Skade:{" "}
                                    <strong className="text-neutral-200">
                                      {l.car?.damage ?? 0}%
                                    </strong>
                                  </p>
                                  <p>
                                    Verdi:{" "}
                                    <strong className="text-neutral-200">
                                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                                      {(
                                        l.car?.currentValue ?? 0
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
                          ) : isEquip || isDrug ? (
                            <Item
                              name={nameNoTier}
                              tier={l.item?.tier ?? undefined}
                              tooltipImg={l.item?.img ?? undefined}
                              tooltipContent={
                                <ul className="space-y-0.5">
                                  {"attack" in (l.item ?? {}) &&
                                    l.item?.attack != null && (
                                      <li>
                                        Angrep:{" "}
                                        <strong className="text-neutral-200">
                                          +{l.item.attack}
                                        </strong>
                                      </li>
                                    )}
                                  {"hp" in (l.item ?? {}) &&
                                    l.item?.hp != null && (
                                      <li>
                                        Helse:{" "}
                                        <strong className="text-neutral-200">
                                          +{l.item.hp}
                                        </strong>
                                      </li>
                                    )}
                                  {"value" in (l.item ?? {}) &&
                                    l.item?.value != null && (
                                      <li>
                                        Verdi:{" "}
                                        <strong className="text-neutral-200">
                                          {Number(l.item.value).toLocaleString(
                                            "nb-NO"
                                          )}
                                        </strong>
                                      </li>
                                    )}
                                  {isDrug && (
                                    <li>
                                      Antall:{" "}
                                      <strong className="text-neutral-200">
                                        {(l.quantity ?? 0).toLocaleString(
                                          "nb-NO"
                                        )}
                                      </strong>
                                    </li>
                                  )}
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
