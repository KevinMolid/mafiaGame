// React
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Username from "../components/Typography/Username";

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
      <p className="font-bold mb-4">{characterData.username}'s profile</p>
      <div className="flex flex-col items-center lg:grid lg:grid-cols-[max-content_max-content] gap-4 sm:gap-8 pb-4 border-b border-neutral-700">
        <img
          className="w-52 h-52 object-cover"
          src={characterData.img || "/default.jpg"}
          alt=""
        />
        <div>
          <Link to="/chat">
            <div className="hover:text-white">
              <i className="fa-solid fa-envelope"></i>
            </div>
          </Link>
        </div>
        <div>
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

      <div className="py-6">{characterData.profileText}</div>
    </section>
  );
};

export default Profile;
