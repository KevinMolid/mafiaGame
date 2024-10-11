import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

import firebaseConfig from "../firebaseConfig";

// Components
import Username from "./Typography/Username";

// Functions
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";

interface CharacterListProps {
  include: "all" | "admin" | "moneyRank" | "";
  action: string;
  onClick?: (receiver: string) => void;
}

const CharacterList = ({ include, action, onClick }: CharacterListProps) => {
  const [characters, setCharacters] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const fetchCharacters = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Characters"));

      const characterData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.data().username,
        familyName: doc.data().familyName,
        xp: doc.data().stats.xp,
        money: doc.data().stats.money,
        status: doc.data().status,
        location: doc.data().location,
      }));

      setCharacters(characterData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching characters:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const killPlayer = async (character: any) => {
    const characterRef = doc(db, "Characters", character.id);
    await updateDoc(characterRef, {
      status: "dead",
    });
  };

  const ressurectPlayer = async (character: any) => {
    const characterRef = doc(db, "Characters", character.id);
    await updateDoc(characterRef, {
      status: "alive",
    });
  };

  if (loading) {
    return <p>Loading characters...</p>;
  }

  return (
    <section>
      {characters.length === 0 ? (
        <p>No characters found.</p>
      ) : (
        <ul>
          {characters.map((character) => (
            <li key={character.id}>
              {action === "log" && onClick !== undefined && (
                <button onClick={() => onClick(character.username)}>
                  {character.username}
                </button>
              )}
              {action === "link" && <Username character={character} />}

              {/* Includde rank */}
              {(include === "all" || include === "admin") && (
                <> - {getCurrentRank(character.xp)}</>
              )}

              {/* Includde Money rank */}
              {include === "moneyRank" && (
                <> - {getMoneyRank(character.money)}</>
              )}

              {include === "admin" && (
                <div>
                  <div className="bg-slate-600 text-slate-300 px-4 py-1 text-sm flex gap-4">
                    {character.status === "alive" && (
                      <button onClick={() => killPlayer(character)}>
                        <i className="fa-solid fa-gun"></i> Kill
                      </button>
                    )}
                    {character.status === "dead" && (
                      <button onClick={() => ressurectPlayer(character)}>
                        <i className="fa-solid fa-hand"></i> Ressurect
                      </button>
                    )}
                  </div>
                  <div className="mb-2 bg-slate-700 text-slate-300 px-4 py-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
                    <p>
                      Status:{" "}
                      <span
                        className={
                          "capitalize " +
                          (character.status === "dead"
                            ? "text-red-400"
                            : "text-green-400")
                        }
                      >
                        {character.status}
                      </span>
                    </p>
                    <p>
                      Family:{" "}
                      {character.familyName ? (
                        <strong>{character.familyName}</strong>
                      ) : (
                        "No family"
                      )}
                    </p>
                    <p>Xp: {character.xp}</p>
                    <p>Money: ${character.money.toLocaleString()}</p>
                    <p>Location: {character.location}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default CharacterList;
