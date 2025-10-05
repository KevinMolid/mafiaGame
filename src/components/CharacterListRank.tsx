// components/CharacterListRank.tsx
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";

import Username from "./Typography/Username";
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";

type SortBy = "username" | "xp" | "money";

export default function CharacterListRank({
  sortBy = "username",
}: {
  sortBy?: SortBy;
}) {
  const db = getFirestore();

  const [characters, setCharacters] = useState<
    {
      id: string;
      username: string;
      role: string;
      xp: number;
      money: number;
      bank: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Load all characters once (same as original "rank" view)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "Characters"));
        const data = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            username: v.username,
            role: v.role || "",
            xp: v.stats?.xp ?? 0,
            money: v.stats?.money ?? 0,
            bank: v.stats?.bank ?? 0,
          };
        });
        setCharacters(data);
      } catch (e) {
        console.error("Feil ved lasting av spillere:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  // Sorting + filter (exclude admins exactly like original)
  const rankedCharacters = useMemo(() => {
    const arr = characters.filter((c) => (c.role || "") !== "admin");
    if (sortBy === "xp") return arr.sort((a, b) => b.xp - a.xp);
    if (sortBy === "money")
      return arr.sort((a, b) => b.money + b.bank - (a.money + a.bank));
    return arr.sort((a, b) => a.username.localeCompare(b.username));
  }, [characters, sortBy]);

  if (loading) return <p>Laster spillere...</p>;

  if (rankedCharacters.length === 0) {
    return (
      <section>
        <ul>
          <li className="grid grid-cols-[40px_120px_auto] border-b border-neutral-700 mb-2 font-bold text-neutral-200">
            <p>#</p>
            <p>Spiller</p>
            <p>Rank</p>
          </li>
        </ul>
        <p>Ingen spillere funnet.</p>
      </section>
    );
  }

  return (
    <section>
      <ul>
        <li className="grid grid-cols-[40px_120px_auto] border-b border-neutral-700 mb-2 font-bold text-neutral-200">
          <p>#</p>
          <p>Spiller</p>
          <p>Rank</p>
        </li>
        {rankedCharacters.map((character, index) => (
          <li key={character.id} className="grid grid-cols-[40px_120px_auto]">
            <p
              className={
                "mr-2 " +
                (index === 0
                  ? "font-bold text-yellow-400"
                  : index === 1
                  ? "font-bold text-slate-300"
                  : index === 2
                  ? "font-bold text-amber-600"
                  : index < 10
                  ? "font-bold text-stone-400"
                  : "font-medium text-stone-500")
              }
            >
              #{index + 1}
            </p>
            <Username
              character={{
                id: character.id,
                username: character.username,
                role: character.role,
              }}
            />
            {sortBy === "xp" && <p>{getCurrentRank(character.xp)}</p>}
            {sortBy === "money" && (
              <p>{getMoneyRank(character.money + character.bank)}</p>
            )}
            {sortBy !== "xp" && sortBy !== "money" && (
              <p>{getCurrentRank(character.xp)}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
