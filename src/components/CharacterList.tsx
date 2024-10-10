import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";

import firebaseConfig from "../firebaseConfig";

import { getCurrentRank } from "../Functions/RankFunctions";

interface CharacterListProps {
  include: "all" | "admin" | "";
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
              {action === "link" && (
                <Link to={`/profile/${character.id}`}>
                  <strong className="text-white">{character.username}</strong>
                </Link>
              )}
              {(include === "all" || include === "admin") && (
                <> - {getCurrentRank(character.xp)}</>
              )}

              {include === "admin" && (
                <div>
                  <div className="bg-slate-600 text-slate-300 px-4 py-1 text-sm flex gap-4">
                    {character.status === "alive" && (
                      <p>
                        <i className="fa-solid fa-gun"></i> Kill
                      </p>
                    )}
                    {character.status === "dead" && (
                      <p>
                        <i className="fa-solid fa-hand"></i> Ressurect
                      </p>
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
