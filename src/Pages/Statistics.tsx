// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Username from "../components/Typography/Username";
import Box from "../components/Box";

// React
import { useEffect, useState } from "react";

// Firebase
import { collection, getDocs } from "firebase/firestore";

// Interfaces
import { Character } from "../Interfaces/CharacterTypes";

import { db } from "../firebase";

const Statistics = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Characters"));
        const fetchedCharacters: Character[] = [];
        const now = Date.now();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Character;
          if (data.lastActive) {
            const lastActiveTime = data.lastActive.toMillis();
            const timeDifference = now - lastActiveTime;

            // Check if the character's last active time is less than 5 minutes (600,000 milliseconds)
            if (timeDifference <= 300000) {
              fetchedCharacters.push({ ...data, id: doc.id });
            }
          }
        });

        // Sort the characters alphabetically by username
        fetchedCharacters.sort((a, b) => a.username.localeCompare(b.username));

        setCharacters(fetchedCharacters);
      } catch (err) {
        console.error("Error fetching characters:", err);
        setError("Error fetching character data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  if (loading) {
    return <Main>Laster...</Main>;
  }

  if (error) {
    return <Main>{error}</Main>;
  }

  return (
    <Main>
      <H1>Statistikk</H1>
      <Box>
        <H2>Spillere pålogget</H2>
        {characters.length > 0 && (
          <p className="mb-4">
            {characters.map((character, index) => (
              <span key={character.id}>
                <Username character={character} />
                {index < characters.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
        <p>
          Det er for øyeblikket{" "}
          <strong className="text-neutral-200">
            {characters.length} spiller{characters.length === 1 ? "" : "e"}
          </strong>{" "}
          pålogget.
        </p>
      </Box>
    </Main>
  );
};

export default Statistics;
