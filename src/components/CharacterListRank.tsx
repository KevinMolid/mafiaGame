// components/CharacterListRank.tsx
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";

import Username from "./Typography/Username";
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";

type SortBy = "username" | "xp" | "money" | "racing";

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
      status: string;
      racingRating: number;
      avatarUrl: string; // from character.img / img / image / default
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

          const avatarUrl =
            v?.character?.img || v?.img || v?.image || "/DefaultAvatar.jpg";

          return {
            id: d.id,
            username: v.username,
            role: v.role || "",
            xp: v.stats?.xp ?? 0,
            money: v.stats?.money ?? 0,
            bank: v.stats?.bank ?? 0,
            status: v.status ?? "alive",
            racingRating: v.racingStats?.rating ?? 0,
            avatarUrl,
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
    const arr = characters
      .filter((c) => (c.role || "") !== "admin")
      .filter((c) => (c.status ?? "alive") !== "dead");

    if (sortBy === "xp") return arr.sort((a, b) => b.xp - a.xp);
    if (sortBy === "money")
      return arr.sort((a, b) => b.money + b.bank - (a.money + a.bank));
    if (sortBy === "racing")
      // Higher rating first; tie-break by XP, then username
      return arr.sort(
        (a, b) =>
          b.racingRating - a.racingRating ||
          b.xp - a.xp ||
          a.username.localeCompare(b.username)
      );

    return arr.sort((a, b) => a.username.localeCompare(b.username));
  }, [characters, sortBy]);

  const getDisplayRank = (c: (typeof rankedCharacters)[number]) => {
    if (sortBy === "xp") return getCurrentRank(c.xp);
    if (sortBy === "money") return getMoneyRank(c.money + c.bank);
    if (sortBy === "racing") return c.racingRating;
    // default: username / generic -> XP rank
    return getCurrentRank(c.xp);
  };

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

  const topThree = rankedCharacters.slice(0, 3);
  const rest = rankedCharacters.slice(3);

  const [first, second, third] = topThree;

  return (
    <section>
      {/* PODIUM */}
{topThree.length > 0 && (
  <div className="flex justify-center items-end gap-1 sm:gap-2 mb-6">

    {/* ---- 2ND PLACE ---- */}
    <div className="flex flex-col items-center">
      {second && (
        <>
          <div className="flex flex-col items-center justify-end w-[110px] sm:w-[140px] md:w-[160px] h-16 sm:h-20 md:h-24">
            {/* Avatar + Number */}
            <div className="relative mt-auto">
              <img
                src={second.avatarUrl || "/DefaultAvatar.jpg"}
                alt={second.username}
                className="border-2 border-slate-300 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover hover:cursor-pointer"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.includes("/DefaultAvatar.jpg")) return;
                  img.src = "/DefaultAvatar.jpg";
                }}
              />
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 
                font-bold h-8 w-8 border border-neutral-600 flex justify-center items-center
                rounded-full bg-neutral-900 text-slate-300">
                #2
              </div>
            </div>
          </div>

          {/* Name + rank */}
          <div className="mt-4 text-center">
            <div className="mb-0.5 text-[11px] sm:text-xs md:text-sm">
              <Username
                character={{
                  id: second.id,
                  username: second.username,
                  role: second.role,
                }}
              />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm">
              {getDisplayRank(second)}
            </p>
          </div>
        </>
      )}
    </div>

    {/* ---- 1ST PLACE ---- */}
    <div className="flex flex-col items-center">
      {first && (
        <>
          <div className="flex flex-col items-center justify-end w-[110px] sm:w-[140px] md:w-[160px] h-20 sm:h-24 md:h-28">
            {/* Avatar + Number */}
            <div className="relative mt-auto">
              <img
                src={first.avatarUrl || "/DefaultAvatar.jpg"}
                alt={first.username}
                className="border-2 border-yellow-400 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover hover:cursor-pointer"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.includes("/DefaultAvatar.jpg")) return;
                  img.src = "/DefaultAvatar.jpg";
                }}
              />
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 
                font-bold h-8 w-8 border border-neutral-600 flex justify-center items-center
                rounded-full bg-neutral-900 text-yellow-400">
                #1
              </div>
            </div>
          </div>

          {/* Name + rank */}
          <div className="mt-4 text-center">
            <div className="mb-0.5 text-[11px] sm:text-xs md:text-sm font-semibold text-yellow-400">
              <Username
                character={{
                  id: first.id,
                  username: first.username,
                  role: first.role,
                }}
              />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm">
              {getDisplayRank(first)}
            </p>
          </div>
        </>
      )}
    </div>

    {/* ---- 3RD PLACE ---- */}
    <div className="flex flex-col items-center">
      {third && (
        <>
          <div className="flex flex-col items-center justify-end w-[110px] sm:w-[140px] md:w-[160px] h-12 sm:h-16 md:h-20">
            {/* Avatar + Number */}
            <div className="relative mt-auto">
              <img
                src={third.avatarUrl || "/DefaultAvatar.jpg"}
                alt={third.username}
                className="border-2 border-amber-600 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover hover:cursor-pointer"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.includes("/DefaultAvatar.jpg")) return;
                  img.src = "/DefaultAvatar.jpg";
                }}
              />
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 
                font-bold h-8 w-8 border border-neutral-600 flex justify-center items-center
                rounded-full bg-neutral-900 text-amber-600">
                #3
              </div>
            </div>
          </div>

          {/* Name + rank */}
          <div className="mt-4 text-center">
            <div className="mb-0.5 text-[11px] sm:text-xs md:text-sm">
              <Username
                character={{
                  id: third.id,
                  username: third.username,
                  role: third.role,
                }}
              />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm">
              {getDisplayRank(third)}
            </p>
          </div>
        </>
      )}
    </div>

  </div>
)}


      {/* TABLE HEADER */}
      <ul>
        <li className="grid grid-cols-[40px_130px_auto] gap-2 border-b border-neutral-700 mb-2 font-bold text-neutral-200 text-xs sm:text-sm">
          <p>#</p>
          <p>Spiller</p>
          <p>
            {sortBy === "racing"
              ? "Racingpoeng"
              : sortBy === "money"
              ? "Pengerank"
              : "Rank"}
          </p>
        </li>

        {/* REST OF LIST (starts at #4) */}
        {rest.map((character, index) => {
          const rankPosition = index + 4; // since 1–3 are on the podium

          const rankClass =
            rankPosition <= 10
              ? "font-bold text-stone-400"
              : "font-medium text-stone-500";

          return (
            <li
              key={character.id}
              className="grid grid-cols-[40px_130px_auto] gap-2 text-xs sm:text-sm"
            >
              <p className={"mr-2 " + rankClass}>#{rankPosition}</p>
              <Username
                character={{
                  id: character.id,
                  username: character.username,
                  role: character.role,
                }}
              />
              <p>{getDisplayRank(character)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
