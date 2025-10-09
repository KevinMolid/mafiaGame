// components/CharacterListSearch.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  onSnapshot,
  // limit, // (optional) add a cap if your dataset is huge
} from "firebase/firestore";
import Username from "./Typography/Username";
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";

const db = getFirestore();

type CharacterLite = {
  id: string;
  username: string;
  username_lowercase?: string;
  xp?: number;
  money?: number;
  bank?: number;
};

export default function CharacterListSearch({
  searchText,
}: {
  searchText: string;
}) {
  const [players, setPlayers] = useState<CharacterLite[]>([]);
  const [loading, setLoading] = useState(false);

  const term = useMemo(() => searchText.trim().toLowerCase(), [searchText]);

  useEffect(() => {
    setLoading(true);

    // Build query: if no term → list all alphabetically; else → prefix-search
    const base = collection(db, "Characters");

    const q =
      term === ""
        ? query(
            base,
            orderBy("username_lowercase")
            // , limit(500) // uncomment to cap results if needed
          )
        : query(
            base,
            orderBy("username_lowercase"),
            startAt(term),
            endAt(term + "\uf8ff")
            // , limit(50)
          );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: CharacterLite[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            username: String(data.username ?? ""),
            username_lowercase: data.username_lowercase,
            xp: data.stats?.xp ?? 0,
            money: data.stats?.money ?? 0,
            bank: data.stats?.bank ?? 0,
          };
        });
        setPlayers(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Search/listen failed:", err);
        setPlayers([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [term]);

  if (loading) {
    return (
      <p className="mt-3 text-sm text-neutral-400">
        <i className="fa-solid fa-spinner fa-spin" /> Laster…
      </p>
    );
  }

  if (players.length === 0) {
    return (
      <p className="mt-3 text-sm text-neutral-400">
        {term === "" ? "Ingen spillere funnet." : "Ingen treff."}
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-1">
      {players.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between border border-neutral-700 bg-neutral-900/60 px-3 py-1"
        >
          <Username character={{ id: p.id, username: p.username }} />
          <div className="grid grid-cols-[100px_100px]">
            {typeof p.xp === "number" && (
              <span className=" text-neutral-400">{getCurrentRank(p.xp)}</span>
            )}
            {typeof p.money === "number" && typeof p.bank === "number" && (
              <span className=" text-neutral-400">
                {getMoneyRank(p.money + p.bank)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
