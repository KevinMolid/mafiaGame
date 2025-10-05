// pages/BlackMarket.tsx
import { useEffect, useMemo, useState } from "react";

// Components
import H2 from "../components/Typography/H2";
import H3 from "./Typography/H3";
import Box from "../components/Box";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";

// Context
import { useCharacter } from "../CharacterContext";

// ---- Types ------------------------------------------------------------------
type Category = "cars" | "bullets" | "weapons" | "items";

type Listing = {
  id: string;
  category: Category;
  itemType: string; // e.g. "Car", "Ammo", "Gun", "Item"
  name: string; // Item name shown to players
  quantity: number; // For non-unique items
  price: number; // price per item or total (we can decide later)
  seller: { id: string; username: string };
  createdAt: number; // ms
  expiresAt?: number; // optional
};

// A tiny helper to format numbers with Norwegian locale
const fmt = (n: number) => n.toLocaleString("nb-NO");

// -----------------------------------------------------------------------------
// NOTE: This is a pure UI scaffold using local state. Next step:
// - Read player's inventory to populate item selector
// - Save/load listings to Firestore
// - Add buy/cancel logic & validations
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
  const [itemType, setItemType] = useState("Car"); // just a label for now
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [durationHrs, setDurationHrs] = useState<number>(24);

  // Local listing data
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  // Filters for “Markedet”
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Seed with a few mock listings so the page doesn't look empty at start.
    // (Remove when wiring to Firestore)
    const seed: Listing[] = [
      {
        id: "seed-1",
        category: "cars",
        itemType: "Car",
        name: "Toyota Supra (T2)",
        quantity: 1,
        price: 250_000,
        seller: { id: "A", username: "Maya" },
        createdAt: Date.now() - 1000 * 60 * 15,
      },
      {
        id: "seed-2",
        category: "bullets",
        itemType: "Ammo",
        name: "9mm kuler",
        quantity: 500,
        price: 5_000,
        seller: { id: "B", username: "Jonas" },
        createdAt: Date.now() - 1000 * 60 * 60,
      },
      {
        id: "seed-3",
        category: "weapons",
        itemType: "Gun",
        name: "Uzi",
        quantity: 1,
        price: 90_000,
        seller: { id: "C", username: "Nora" },
        createdAt: Date.now() - 1000 * 60 * 5,
      },
    ];
    setAllListings(seed);
  }, []);

  // Derived listing sets
  const marketListings = useMemo(() => {
    return allListings.filter((l) => l.seller.id !== userCharacter?.id);
  }, [allListings, userCharacter?.id]);

  const filteredMarket = useMemo(() => {
    const term = search.trim().toLowerCase();
    return marketListings
      .filter((l) =>
        filterCategory === "all" ? true : l.category === filterCategory
      )
      .filter((l) => (term ? l.name.toLowerCase().includes(term) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [marketListings, filterCategory, search]);

  const handlePostListing = () => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være innlogget med en spillkarakter.");
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
      setMessage("Pris må være større enn 0.");
      return;
    }

    // (Later: validate against inventory)
    const now = Date.now();
    const listing: Listing = {
      id: "temp-" + now, // (Later: use Firestore id)
      category,
      itemType,
      name: itemName.trim(),
      quantity,
      price,
      seller: { id: userCharacter.id, username: userCharacter.username },
      createdAt: now,
      expiresAt: now + durationHrs * 60 * 60 * 1000,
    };

    // Update local state (simulate success)
    setAllListings((prev) => [listing, ...prev]);
    setMyListings((prev) => [listing, ...prev]);

    // Reset form & message
    setItemName("");
    setQuantity(1);
    setPrice(0);
    setDurationHrs(24);

    setMessageType("success");
    setMessage("Annonse publisert på svartemarkedet.");
  };

  const handleCancelListing = (id: string) => {
    setAllListings((prev) => prev.filter((l) => l.id !== id));
    setMyListings((prev) => prev.filter((l) => l.id !== id));
    setMessageType("success");
    setMessage("Annonse fjernet.");
  };

  const handleBuy = (id: string) => {
    // Placeholder: later we’ll deduct money, transfer item, etc.
    setMessageType("info");
    setMessage("Kjøp-flyten kommer i neste steg.");
  };

  return (
    <>
      <H2>Svartemarked</H2>
      <p className="mb-4">
        Kjøp og selg gjenstander som biler, våpen, kuler og andre varer.
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
              {filteredMarket.map((l) => (
                <li
                  key={l.id}
                  className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-neutral-100 font-semibold">
                      {l.name}{" "}
                      <span className="text-neutral-400 font-normal">
                        · {l.quantity} stk · {fmt(l.price)} kr
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      Selger:{" "}
                      <Username
                        character={{
                          id: l.seller.id,
                          username: l.seller.username,
                        }}
                      />{" "}
                      · {labelForCategory(l.category)} · {l.itemType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="small" onClick={() => handleBuy(l.id)}>
                      <i className="fa-solid fa-cart-shopping" /> Kjøp
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Box>

        {/* Layout: form + my listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Box>
            <H3>Ny annonse</H3>
            <div className="flex flex-col gap-3 mt-2">
              <label className="text-sm text-neutral-400">Kategori</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  style={category === "cars" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("cars");
                    setItemType("Car");
                  }}
                >
                  <i className="fa-solid fa-car-side" /> Biler
                </Button>
                <Button
                  size="small"
                  style={category === "bullets" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("bullets");
                    setItemType("Ammo");
                  }}
                >
                  <i className="fa-solid fa-bullet" /> Kuler
                </Button>
                <Button
                  size="small"
                  style={category === "weapons" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("weapons");
                    setItemType("Gun");
                  }}
                >
                  <i className="fa-solid fa-gun" /> Våpen
                </Button>
                <Button
                  size="small"
                  style={category === "items" ? "primary" : "text"}
                  onClick={() => {
                    setCategory("items");
                    setItemType("Item");
                  }}
                >
                  <i className="fa-solid fa-box" /> Annet
                </Button>
              </div>

              {/* Item name (later: replace with inventory picker for each category) */}
              <div className="grid gap-1">
                <label htmlFor="bm-name" className="text-sm text-neutral-400">
                  Varenavn
                </label>
                <input
                  id="bm-name"
                  className="bg-transparent border-b border-neutral-600 py-2 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                  placeholder={
                    category === "cars" ? "Eks: BMW M3" : "Eks: 9mm kuler"
                  }
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              {/* Quantity (for cars it's usually 1, for ammo/items can be higher) */}
              <div className="grid gap-1">
                <label htmlFor="bm-qty" className="text-sm text-neutral-400">
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

              {/* Price */}
              <div className="grid gap-1">
                <label htmlFor="bm-price" className="text-sm text-neutral-400">
                  Pris (kr)
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

              {/* Duration */}
              <div className="grid gap-1">
                <label htmlFor="bm-dur" className="text-sm text-neutral-400">
                  Varighet (timer)
                </label>
                <input
                  id="bm-dur"
                  inputMode="numeric"
                  className="bg-transparent border-b border-neutral-600 py-2 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none w-44"
                  value={durationHrs === 0 ? "" : durationHrs.toString()}
                  placeholder="24"
                  onChange={(e) => {
                    const n = parseInt(
                      e.target.value.replace(/[^\d]/g, ""),
                      10
                    );
                    setDurationHrs(Number.isFinite(n) ? n : 0);
                  }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handlePostListing}>
                  <i className="fa-solid fa-plus" /> Publiser
                </Button>
              </div>
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
                {myListings.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-neutral-100 font-semibold">
                        {l.name}{" "}
                        <span className="text-neutral-400 font-normal">
                          · {l.quantity} stk · {fmt(l.price)} kr
                        </span>
                      </span>
                      <span className="text-xs text-neutral-500">
                        Kategori: {labelForCategory(l.category)} · {l.itemType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        style="danger"
                        onClick={() => handleCancelListing(l.id)}
                      >
                        <i className="fa-solid fa-trash" /> Fjern
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Box>
        </div>
      </div>
    </>
  );
};

function labelForCategory(c: Category) {
  if (c === "cars") return "Biler";
  if (c === "bullets") return "Kuler";
  if (c === "weapons") return "Våpen";
  return "Annet";
}

export default BlackMarket;
