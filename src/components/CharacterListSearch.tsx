import { useEffect, useMemo, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
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
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const q = query(
          collection(db, "Characters"),
          orderBy("username_lowercase")
        );
        const snap = await getDocs(q);

        if (cancelled) return;

        const all = snap.docs.map((d) => {
          const data = d.data() as any;
          const stats = data.stats || {};
          return {
            id: d.id,
            username: String(data.username ?? ""),
            username_lowercase: data.username_lowercase ?? "",
            xp: stats.xp ?? 0,
            money: stats.money ?? 0,
            bank: stats.bank ?? 0,
          };
        });

        setPlayers(all);
      } catch (e) {
        console.error("Error loading players", e);
        setPlayers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter on the client
  const filtered = useMemo(() => {
    if (term === "") return players;
    return players.filter((p) => p.username_lowercase?.includes(term));
  }, [term, players]);

  if (loading) {
    return (
      <p className="mt-3 text-sm text-neutral-400">
        <i className="fa-solid fa-spinner fa-spin" /> Laster…
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="mt-3 text-sm text-neutral-400">
        {term === "" ? "Ingen spillere funnet." : "Ingen treff."}
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-1">
      {filtered.map((p) => (
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
