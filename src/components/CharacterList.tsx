import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";

import firebaseConfig from "../firebaseConfig";

import { getCurrentRank } from "../Functions/RankFunctions";

const CharacterList = () => {
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
        xp: doc.data().stats.xp,
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
              <Link to={`/profile/${character.id}`}>
                <strong>{character.username}</strong>
              </Link>{" "}
              - {getCurrentRank(character.xp)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default CharacterList;
