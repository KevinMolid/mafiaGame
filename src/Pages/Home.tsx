// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Equipment from "../components/Equipment";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";

import NewsFeed from "../components/News/NewsFeed";
import UpdateFeed from "../components/UpdateFeed";

import { getCurrentRank } from "../Functions/RankFunctions";

import {
  getFirestore,
  collection,
  onSnapshot /*, orderBy, query */,
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
  const [message] = useState("");
  const [messageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  // Local state for XP, initialized with the character's current XP
  const [xp, setXP] = useState<number>(userCharacter?.stats.xp || 0);

  type ItemDoc = { id: string } & Record<string, any>;
  const [bags, setBags] = useState<ItemDoc[]>([]);

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
      const items = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      setBags(items);
    });

    return () => unsubscribe();
  }, [userCharacter?.id]);

  const maxHealth = 100;
  const healthPercentage = userCharacter
    ? (userCharacter.stats.hp / maxHealth) * 100
    : 0;

  const { progress, minXP, maxXP } = getRankProgress(userCharacter.stats.xp);

  const maxHeat = 50;
  const heatPercentage = userCharacter
    ? Math.round((userCharacter.stats.heat / maxHeat) * 100)
    : 0;

  return (
    <Main img="MafiaBg">
      {/* Page title */}
      <H1>Hovedkvarter</H1>

      {/* Message */}
      {message && <InfoBox type={messageType}>{message}</InfoBox>}

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
            <p>
              Familie:{" "}
              {userCharacter.familyName ? (
                <Link to={`familie/profil/${userCharacter.familyId}`}>
                  <strong className="text-neutral-200 hover:underline">
                    {userCharacter.familyName}
                  </strong>
                </Link>
              ) : (
                <Link to="/familie">Ingen familie</Link>
              )}
            </p>
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
                      {userCharacter.stats.heat} / 50
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
          <ul className="flex flex-wrap gap-1 max-w-[500px]">
            {bags.map((item) => (
              <li key={item.id}>
                <div className="w-14 h-14 border border-neutral-600 rounded-xl overflow-hidden flex items-center justify-center">
                  {/* optional: show image if present */}
                  {item.img ? (
                    <img
                      src={item.img}
                      alt={item.name ?? "Item"}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Main>
  );
};

export default Home;
