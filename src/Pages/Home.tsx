// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Equipment from "../components/Equipment";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";
import ItemTile from "../components/ItemTile";
import Button from "../components/Button";
import Item from "../components/Typography/Item";

import NewsFeed from "../components/News/NewsFeed";
import UpdateFeed from "../components/UpdateFeed";

import { getCurrentRank } from "../Functions/RankFunctions";

import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
const db = getFirestore();

// React
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Context
import { useCharacter } from "../CharacterContext";

// Functions
import { getRankProgress } from "../Functions/RankFunctions";

const Home = () => {
  const { userCharacter, dailyXp } = useCharacter();
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  // Local state for XP, initialized with the character's current XP
  const [xp, setXP] = useState<number>(userCharacter?.stats.xp || 0);

  type ItemDoc = { docId: string } & Record<string, any>;
  const [bags, setBags] = useState<ItemDoc[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemDoc | null>(null);

  const openItemModal = (item: ItemDoc) => {
    setSelectedItem(item);
    setItemModalOpen(true);
  };
  const closeItemModal = () => {
    setItemModalOpen(false);
    setSelectedItem(null);
  };

  const equipItem = async (item: ItemDoc) => {
    if (!userCharacter?.id) return;

    const slot = (item.slot || "").trim();
    if (!slot) {
      setMessageType("warning");
      setMessage("Denne gjenstanden kan ikke utstyres (mangler slot).");
      return;
    }

    const charRef = doc(db, "Characters", userCharacter.id);
    const invRef = doc(db, "Characters", userCharacter.id, "items", item.docId);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(charRef);
        const data = (snap.data() || {}) as any;

        const currentlyEquipped = data?.equipment?.[slot] || null;

        // If something is already equipped in this slot, move it back to inventory (optional).
        if (currentlyEquipped) {
          const backToInvRef = doc(
            collection(db, "Characters", userCharacter.id, "items")
          );
          tx.set(backToInvRef, {
            ...currentlyEquipped,
            returnedFromSlot: slot,
            returnedAt: serverTimestamp(),
          });
        }

        // Write the new equipment to the slot
        const equipPayload = {
          // keep whatever fields you want visible in Equipment UI
          id: item.id, // type id
          name: item.name,
          img: item.img ?? null,
          tier: item.tier ?? 1,
          slot,
          value: item.value ?? 0,
          // helpful bookkeeping
          fromDocId: item.docId, // the inventory doc this came from
          equippedAt: serverTimestamp(),
        };

        tx.update(charRef, { [`equipment.${slot}`]: equipPayload });

        // Remove from inventory
        tx.delete(invRef);
      });

      setMessageType("success");
      setMessage(
        <>
          Du utstyrte <strong className="text-neutral-200">{item.name}</strong>{" "}
          i <strong className="text-neutral-200">{slot}</strong>.
        </>
      );
    } catch (e) {
      console.error("Equip item failed:", e);
      setMessageType("failure");
      setMessage("Kunne ikke utstyre gjenstanden. Prøv igjen.");
    } finally {
      closeItemModal();
    }
  };

  const sellItem = async (item: ItemDoc) => {
    if (!userCharacter?.id) return;

    const value = Number(item.value) || 0;
    const itemRef = doc(
      db,
      "Characters",
      userCharacter.id,
      "items",
      item.docId
    );
    const charRef = doc(db, "Characters", userCharacter.id);

    try {
      const batch = writeBatch(db);
      batch.delete(itemRef);
      if (value > 0) {
        batch.update(charRef, { "stats.money": increment(value) });
      }
      await batch.commit();

      setMessageType("success");
      setMessage(
        <>
          Du solgte <strong className="text-neutral-200">{item.name}</strong>{" "}
          for{" "}
          <strong className="text-neutral-200">
            <i className="fa-solid fa-dollar-sign" />{" "}
            {value.toLocaleString("nb-NO")}
          </strong>
          .
        </>
      );
    } catch (e) {
      console.error("Sell item failed:", e);
      setMessageType("failure");
      setMessage("Kunne ikke selge gjenstanden. Prøv igjen.");
    } finally {
      closeItemModal();
    }
  };

  // Sync the local XP state with character stats if character changes
  useEffect(() => {
    if (userCharacter) {
      setXP(userCharacter.stats.xp);
    }
  }, [userCharacter]); // Runs whenever character object changes

  if (!userCharacter) {
    return null;
  }

  // Fetch items
  useEffect(() => {
    if (!userCharacter?.id) {
      setBags([]);
      return;
    }

    const itemsRef = collection(db, "Characters", userCharacter.id, "items");

    const unsubscribe = onSnapshot(itemsRef, (snap) => {
      const items: ItemDoc[] = snap.docs.map((d) => ({
        ...d.data(), // retains your data.id (type id)
        docId: d.id, // Firestore document id
      }));
      setBags(items);
    });

    return () => unsubscribe();
  }, [userCharacter?.id]);

  const maxHealth = 100;
  const healthPercentage = userCharacter
    ? (userCharacter.stats.hp / maxHealth) * 100
    : 0;

  const { progress, minXP, maxXP } = getRankProgress(userCharacter.stats.xp);

  const MAX_HEAT = 100;
  const heatRaw = userCharacter?.stats?.heat ?? 0;
  const heat = Math.max(0, Math.min(heatRaw, MAX_HEAT)); // 0..100
  const heatPercentage = Math.round((heat / MAX_HEAT) * 100); // 0..100

  return (
    <Main img="MafiaBg">
      {/* Page title */}
      <H1>Hovedkvarter</H1>

      {/* Message */}
      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      {/* Content */}
      <div className="grid grid-cols-[auto] md:grid-cols-6 lg:grid-cols-8 items-start gap-x-8 gap-y-8 mb-6">
        {/* Profile picture and user info */}
        <div className="flex items-end gap-4 mr-2 md:col-span-6 lg:col-span-4">
          <Link to={`/profil/${userCharacter.id}`}>
            <img
              className="size-[160px] object-cover hover:cursor-pointer "
              src={userCharacter.img || "/default.jpg"}
              alt="Profile picture"
            />
          </Link>
          <div>
            <p>
              <Username character={userCharacter} />
            </p>
            <Link to="/spillguide">
              <p>{getCurrentRank(userCharacter.stats.xp)}</p>
            </Link>
            <Link to="/bank">
              <p>
                Penger:{" "}
                <strong className="text-neutral-200">
                  <i className="fa-solid fa-dollar-sign"></i>{" "}
                  {userCharacter.stats.money.toLocaleString("nb-NO")}
                </strong>
              </p>
            </Link>
            <Link to="/bank">
              <p>
                Bank:{" "}
                <strong className="text-neutral-200">
                  <i className="fa-solid fa-dollar-sign"></i>{" "}
                  {userCharacter.stats.bank
                    ? userCharacter.stats.bank.toLocaleString("nb-NO")
                    : "0"}
                </strong>
              </p>
            </Link>

            {userCharacter.familyName ? (
              <p>
                <Link to={`familie/profil/${userCharacter.familyId}`}>
                  Familie:{" "}
                  <strong className="text-neutral-200 hover:underline">
                    {userCharacter.familyName}
                  </strong>
                </Link>
              </p>
            ) : (
              <p>
                <Link to="/familie">Familie: Ingen familie</Link>
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="md:col-span-6 lg:col-span-4">
          <div className="flex flex-col flex-wrap gap-4">
            {/* Status bars */}
            <div className="flex flex-row flex-wrap gap-2">
              {/* Health */}
              <div className="flex flex-col gap-1 w-full max-w-96">
                <p>
                  Helse:{" "}
                  <strong className="text-neutral-200">
                    {healthPercentage}%
                  </strong>
                </p>
                <div className="h-5 min-w-48 bg-neutral-700 grid grid-cols-1">
                  <div
                    className="h-5 bg-green-500 transition-all duration-300 flex justify-center items-center col-start-1 row-start-1"
                    style={{ width: `${healthPercentage}%` }}
                  ></div>
                  <div className="flex justify-center items-center z-10 col-start-1 row-start-1">
                    <p className="text-slate-50 text-xs">
                      {userCharacter.stats.hp} / {maxHealth} hp
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="flex flex-col gap-1 w-full max-w-96">
                <p>
                  Erfaring:{" "}
                  <strong className="text-neutral-200">
                    {progress.toFixed(2)}%
                  </strong>
                </p>
                <div className="bg-neutral-700 h-5 min-w-48 w-full grid grid-cols-1">
                  <div
                    className="h-5 bg-slate-400 transition-all duration-300 col-start-1 row-start-1"
                    style={{ width: `${progress}%` }}
                  ></div>
                  <div className="flex justify-center items-center z-10 col-start-1 row-start-1">
                    <p className="text-slate-50 text-xs">
                      {xp - minXP} / {maxXP - minXP} xp
                    </p>
                  </div>
                </div>
              </div>

              {/* Heat */}
              <div className="flex flex-col gap-1 w-full max-w-96">
                <p>
                  Ettersøkt:{" "}
                  <strong className="text-neutral-200">
                    {heatPercentage}%
                  </strong>
                </p>
                <div className="bg-neutral-700 h-5 min-w-48 w-full grid grid-cols-1">
                  <div
                    className={
                      "h-5 transition-all duration-300 col-start-1 row-start-1 " +
                      (heatPercentage <= 25
                        ? "bg-yellow-400"
                        : heatPercentage <= 50
                        ? "bg-orange-400"
                        : "bg-red-400")
                    }
                    style={{ width: `${heatPercentage}%` }}
                  ></div>
                  <div className="flex justify-center items-center z-10 col-start-1 row-start-1">
                    <p className="text-red-50 text-xs">
                      {heat} / {MAX_HEAT}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="w-full">
              Ranket i dag:{" "}
              <strong className="text-neutral-200">
                {dailyXp.xpToday.toLocaleString("nb-NO")} xp
              </strong>
            </p>
          </div>
        </div>

        <div className="max-w-[500px] md:col-span-6 lg:col-span-4">
          <H2>Nyheter</H2>
          <NewsFeed />
        </div>

        <div className="max-w-[500px] md:col-span-6 lg:col-span-4">
          <H2>Oppdateringer</H2>
          <UpdateFeed />
        </div>

        {/* Equipment and stash */}
        {/* Reputation */}
        {/*<Box>
            <H2>Innflytelse</H2>
            <div className="flex gap-x-4 flex-wrap">
              <p>
                Politi:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.police}
                </strong>
              </p>
              <p>
                Styresmakter:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.politics}
                </strong>
              </p>
              <p>
                Gjenger:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.gangs}
                </strong>
              </p>
              <p>
                Organisasjoner:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.community}
                </strong>
              </p>
            </div>
          </Box>*/}

        {/* Equipment */}
        <div className="border border-neutral-500 grid grid-cols-1 w-fit md:col-span-4 lg:col-span-4">
          <div className="col-start-1 row-start-1 z-10 p-4">
            <H2>Utstyr</H2>
          </div>
          <div className="col-start-1 row-start-1">
            <Equipment />
          </div>
        </div>

        {/* Bags */}
        <div className="md:col-span-2 lg:col-span-4">
          <H2>Eiendeler</H2>
          <ul className="flex flex-wrap gap-x-1 gap-y-0 max-w-[500px]">
            {bags.map((item, index) => (
              <li key={item.id + index}>
                <button
                  type="button"
                  onClick={() => openItemModal(item)}
                  className="focus:outline-none"
                  title="Åpne handlinger"
                >
                  <ItemTile name={item.name} img={item.img} tier={item.tier} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Item action modal --- */}
        {itemModalOpen && selectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Varehandlinger"
            onClick={(e) => {
              // close if clicking the dimmed backdrop (not the modal content)
              if (e.target === e.currentTarget) closeItemModal();
            }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Window */}
            <div className="relative z-10 w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {selectedItem.img ? (
                    <ItemTile
                      name={selectedItem.name}
                      img={selectedItem.img}
                      tier={selectedItem.tier}
                    />
                  ) : null}
                  <div>
                    <p className="text-neutral-200 font-semibold leading-tight">
                      <Item
                        name={selectedItem.name}
                        tier={selectedItem.tier}
                      ></Item>
                    </p>
                    {/* VALUE LINE */}
                    <p className="text-neutral-400 text-sm mt-1">
                      Verdi:{" "}
                      <strong className="text-neutral-200">
                        <i className="fa-solid fa-dollar-sign" />{" "}
                        {(Number(selectedItem.value) || 0).toLocaleString(
                          "nb-NO"
                        )}
                      </strong>
                    </p>
                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="small"
                        onClick={() => equipItem(selectedItem)}
                      >
                        Bruk
                      </Button>
                      <Button
                        size="small"
                        style="danger"
                        onClick={() => sellItem(selectedItem)}
                      >
                        Selg
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={closeItemModal}
                  aria-label="Lukk"
                  title="Lukk"
                  style="exit"
                  size="small-square"
                >
                  <i className="fa-solid fa-xmark" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Main>
  );
};

export default Home;
