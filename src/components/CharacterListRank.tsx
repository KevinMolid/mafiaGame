// components/CharacterListRank.tsx
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";

import Username from "./Typography/Username";
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";
import { useCharacter } from "../CharacterContext";

type SortBy = "username" | "xp" | "money" | "racing";

export default function CharacterListRank({
  sortBy = "username",
}: {
  sortBy?: SortBy;
}) {
  const db = getFirestore();
  const { userCharacter } = useCharacter();

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
      <section className="flex flex-col items-center">
        <div className="w-full max-w-[420px]">
          <ul>
            <li className="grid grid-cols-[40px_120px_auto] border-b border-neutral-700 mb-2 font-bold text-neutral-200">
              <p>#</p>
              <p>Spiller</p>
              <p>Rank</p>
            </li>
          </ul>
          <p>Ingen spillere funnet.</p>
        </div>
      </section>
    );
  }

  const topThree = rankedCharacters.slice(0, 3);
  const rest = rankedCharacters.slice(3);

  const [first, second, third] = topThree;

  // Find the logged-in player's placement in the full ranked list
  const myIndex =
    userCharacter && rankedCharacters.length > 0
      ? rankedCharacters.findIndex((c) => c.id === userCharacter.id)
      : -1;
  const myCharacter = myIndex >= 0 ? rankedCharacters[myIndex] : null;
  const myPlacement = myIndex >= 0 ? myIndex + 1 : null;

  // helper for color of rank number
  const getRankColorClass = (placement: number) => {
    if (placement === 1) return "text-yellow-400";
    if (placement === 2) return "text-slate-300";
    if (placement === 3) return "text-amber-600";
    if (placement <= 10) return "text-stone-400";
    return "text-stone-500";
  };

  return (
    <section className="flex flex-col items-center">
      {/* PODIUM */}
      {topThree.length > 0 && (
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center items-end gap-4 mt-8 mb-4">
            {/* ---- 2ND PLACE ---- */}
            <div className="flex flex-col items-center">
              {second && (
                <>
                  {/* Avatar + Number */}
                  <div className="relative">
                    <img
                      src={second.avatarUrl || "/DefaultAvatar.jpg"}
                      alt={second.username}
                      className="border-2 border-slate-300 w-20 h-20 md:w-24 md:h-24 object-cover hover:cursor-pointer"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.includes("/DefaultAvatar.jpg")) return;
                        img.src = "/DefaultAvatar.jpg";
                      }}
                    />
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 font-bold h-8 w-8 border border-neutral-600 flex justify-center items-center rounded-full bg-neutral-900 text-slate-300">
                      #2
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
                  {/* Avatar + Number */}
                  <div className="relative">
                    <img
                      src={first.avatarUrl || "/DefaultAvatar.jpg"}
                      alt={first.username}
                      className="border-2 border-yellow-400 w-20 h-20 md:w-24 md:h-24 object-cover hover:cursor-pointer"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.includes("/DefaultAvatar.jpg")) return;
                        img.src = "/DefaultAvatar.jpg";
                      }}
                    />
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 font-bold h-8 w-8 border border-neutral-600 flex justify-center items-center rounded-full bg-neutral-900 text-yellow-400">
                      #1
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
                  {/* Avatar + Number */}
                  <div className="relative">
                    <img
                      src={third.avatarUrl || "/DefaultAvatar.jpg"}
                      alt={third.username}
                      className="border-2 border-amber-600 w-20 h-20 md:w-24 md:h-24 object-cover hover:cursor-pointer"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.includes("/DefaultAvatar.jpg")) return;
                        img.src = "/DefaultAvatar.jpg";
                      }}
                    />
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 font-bold h-8 w-8 border border-neutral-600 flex justify-center items-center rounded-full bg-neutral-900 text-amber-600">
                      #3
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
          
          <hr className="border-neutral-600 mb-4"/>
        </div>
      )}


      {/* LIST */}
      <ul className="flex flex-col w-full max-w-[420px]">
        {/* REST OF LIST (starts at #4) */}
        {rest.map((character, index) => {
          const rankPosition = index + 4; // since 1–3 are on the podium

          const rankClass = getRankColorClass(rankPosition) + " mr-2 font-bold";

          return (
            <li
              key={character.id}
              className="grid grid-cols-[40px_130px_auto] gap-2 text-xs sm:text-sm"
            >
              <p className={rankClass}>#{rankPosition}</p>
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
        <hr className="border-neutral-600 my-4"/>
      </ul>

      {/* PLAYER'S OWN PLACEMENT */}
      {myCharacter && myPlacement && (
        <div className=" w-full max-w-[420px] mb-4">
          <p className="mb-2 font-semibold text-neutral-300 text-sm">
            Din plassering:
          </p>
          <div className="grid grid-cols-[40px_130px_auto] gap-2 text-xs sm:text-sm">
            <p
              className={
                "mr-2 font-bold " + getRankColorClass(myPlacement)
              }
            >
              #{myPlacement}
            </p>
            <Username
              character={{
                id: myCharacter.id,
                username: myCharacter.username,
                role: myCharacter.role,
              }}
            />
            <p>{getDisplayRank(myCharacter)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
