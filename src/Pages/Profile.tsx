// React
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Username from "../components/Typography/Username";

// Components
import Notebook from "./Notebook";
import Blacklist from "./Blacklist";
import EditProfile from "./EditProfile";

// Firebase
import { doc, getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Functions
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";

const Profile = () => {
  const { characterID } = useParams<{ characterID: string }>();
  const [characterData, setCharacterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<
    "profile" | "notebook" | "blacklist" | "edit"
  >("profile");

  useEffect(() => {
    const fetchCharacterData = async () => {
      if (!characterID) {
        setError("Character ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const charDocRef = doc(db, "Characters", characterID);
        const charDocSnap = await getDoc(charDocRef);
        if (charDocSnap.exists()) {
          setCharacterData(charDocSnap.data());
        } else {
          setError("Character not found!");
        }
      } catch (err) {
        console.error("Error fetching character data:", err);
        setError("Error fetching character data.");
      } finally {
        setLoading(false);
      }
    };

    if (characterID) {
      fetchCharacterData();
    }
  }, [characterID]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!characterData) {
    return <div>No character data available.</div>;
  }

  return (
    <section>
      <div className="flex flex-col items-center md:grid md:grid-cols-[max-content_max-content] gap-4 lg:gap-8 pb-4 border-b border-neutral-700">
        <img
          className="w-52 h-52 object-cover"
          src={characterData.img || "/default.jpg"}
          alt=""
        />

        <div className="flex flex-col h-full justify-between gap-4">
          {/* Icons */}
          <div className="text-2xl flex gap-4">
            <Link to="/chat">
              <div className="hover:text-white">
                <i className="fa-solid fa-envelope"></i>
              </div>
            </Link>

            <div
              className="hover:text-white hover:cursor-pointer"
              onClick={() => setView("profile")}
            >
              <i className="fa-solid fa-user"></i>
            </div>

            <div
              className="hover:text-white hover:cursor-pointer"
              onClick={() => setView("notebook")}
            >
              <i className="fa-solid fa-book"></i>
            </div>

            <div
              className="hover:text-white hover:cursor-pointer"
              onClick={() => setView("blacklist")}
            >
              <i className="fa-solid fa-book-skull"></i>
            </div>

            <div
              className="hover:text-white hover:cursor-pointer"
              onClick={() => setView("edit")}
            >
              <i className="fa-solid fa-edit"></i>
            </div>

            <button
              className="hover:text-white"
              title={`Blacklist ${characterData.username}`}
            >
              <i className="fa-solid fa-skull-crossbones"></i>
            </button>
          </div>

          {/* Info */}
          <ul className="grid grid-cols-[min-content_max-content] gap-x-4">
            <li className="text-stone-400">Username</li>
            <li>
              <Username character={characterData} />
            </li>

            <li className="text-stone-400">Rank</li>
            <li>{getCurrentRank(characterData.stats.xp)}</li>

            <li className="text-stone-400">Money</li>
            <li>{getMoneyRank(characterData.stats.money)}</li>

            <li className="text-stone-400">Family</li>
            <li>{characterData.familyName || "No family"}</li>

            <li className="text-stone-400">Status</li>
            <li
              className={
                "capitalize " +
                (characterData.status === "alive"
                  ? "text-green-400"
                  : "text-red-400")
              }
            >
              {characterData.status}
            </li>
          </ul>
        </div>
      </div>

      {/* Views */}
      {view === "profile" && (
        <div className="py-6">{characterData.profileText}</div>
      )}

      {view === "notebook" && (
        <div className="py-6">
          <Notebook></Notebook>
        </div>
      )}

      {view === "blacklist" && (
        <div className="py-6">
          <Blacklist></Blacklist>
        </div>
      )}

      {view === "edit" && (
        <div className="py-6">
          <EditProfile></EditProfile>
        </div>
      )}
    </section>
  );
};

export default Profile;
