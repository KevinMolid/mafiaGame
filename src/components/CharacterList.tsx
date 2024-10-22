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
import InfoBox from "./InfoBox";
import Familyname from "./Typography/Familyname";
// Functions
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";

interface CharacterListProps {
  type?: "rank" | "admin" | "chat" | "";
  sortBy?: "username" | "xp" | "money";
  onClick?: (receiver: string) => void;
}

const CharacterList = ({
  type = "",
  sortBy = "username",
  onClick,
}: CharacterListProps) => {
  const [characters, setCharacters] = useState<Array<any>>([]);
  const [newMoneyValue, setNewMoneyValue] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "info"
  >("info");
  const [loading, setLoading] = useState(true);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const fetchCharacters = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Characters"));

      const characterData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.data().username,
        familyId: doc.data().familyId,
        familyName: doc.data().familyName,
        xp: doc.data().stats.xp,
        money: doc.data().stats.money,
        bank: doc.data().stats.bank,
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

  // Function to sort characters
  const sortedCharacters = characters.sort((a, b) => {
    if (sortBy === "xp") {
      return b.xp - a.xp; // Sort by XP
    } else if (sortBy === "money") {
      return b.money + b.bank - (a.money + a.bank); // Sort by money
    } else {
      return a.username.localeCompare(b.username); // Sort alphabetically
    }
  });

  const killPlayer = async (character: any) => {
    const characterRef = doc(db, "Characters", character.id);
    await updateDoc(characterRef, {
      status: "dead",
    });

    setCharacters((prevCharacters) =>
      prevCharacters.map((char) =>
        char.id === character.id ? { ...char, status: "dead" } : char
      )
    );
  };

  const resurrectPlayer = async (character: any) => {
    const characterRef = doc(db, "Characters", character.id);
    await updateDoc(characterRef, {
      status: "alive",
    });

    setCharacters((prevCharacters) =>
      prevCharacters.map((char) =>
        char.id === character.id ? { ...char, status: "alive" } : char
      )
    );
  };

  const setMoney = async (character: any, newMoneyValue: number) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      // Update the money in Firebase
      await updateDoc(characterRef, {
        "stats.money": newMoneyValue,
      });

      // Update the local state
      setCharacters((prevCharacters) =>
        prevCharacters.map((char) =>
          char.id === character.id ? { ...char, money: newMoneyValue } : char
        )
      );

      setMessageType("success");
      setMessage(
        `Money updated for ${
          character.username
        } to $${newMoneyValue.toLocaleString()}`
      );
    } catch (error) {
      console.error("Error updating money:", error);
    }
  };

  const handleSetMoney = (character: any) => {
    if (!newMoneyValue) {
      setMessage("Please enter a value.");
    } else {
      setMoney(character, newMoneyValue);
    }
  };

  if (loading) {
    return <p>Loading characters...</p>;
  }

  if (characters.length === 0) {
    return <p>No characters found.</p>;
  }

  // Type == Rank
  if (type === "rank") {
    return (
      <section>
        <ul>
          <li className="grid grid-cols-[40px_120px_auto] border-b border-neutral-700 mb-2 font-bold text-neutral-200">
            <p>#</p>
            <p>Spiller</p>
            <p>Rank</p>
          </li>
          {sortedCharacters.map((character, index) => (
            <li key={character.id} className="grid grid-cols-[40px_120px_auto]">
              <p
                className={
                  "mr-2 " +
                  (index === 0
                    ? "font-bold text-yellow-400"
                    : index === 1
                    ? "font-bold text-slate-300"
                    : index === 2
                    ? "font-bold text-amber-600"
                    : index < 10
                    ? "font-bold text-stone-400"
                    : "font-medium text-stone-500")
                }
              >
                #{index + 1}
              </p>
              <Username character={character} />
              {sortBy === "xp" && <p>{getCurrentRank(character.xp)}</p>}
              {sortBy === "money" && (
                <p>{getMoneyRank(character.money + character.bank)}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Type == Admin
  if (type === "admin") {
    return (
      <section>
        {message && <InfoBox type={messageType}>{message}</InfoBox>}
        <ul>
          {sortedCharacters.map((character) => (
            <li key={character.id}>
              <Username character={character} /> -{" "}
              {getCurrentRank(character.xp)}
              <div>
                {/* Actions */}
                <div className="bg-slate-600 text-slate-300 px-4 py-1 text-sm flex gap-4">
                  {character.status === "alive" && (
                    <button onClick={() => killPlayer(character)}>
                      <i className="fa-solid fa-gun"></i> Drep
                    </button>
                  )}
                  {character.status === "dead" && (
                    <button onClick={() => resurrectPlayer(character)}>
                      <i className="fa-solid fa-hand"></i> Gjennoppliv
                    </button>
                  )}
                  {/* Set money */}
                  <div className="flex gap-1">
                    <input
                      type="number"
                      placeholder="Value"
                      onChange={(e) =>
                        setNewMoneyValue(parseInt(e.target.value))
                      }
                      className="bg-slate-700 border border-slate-500 px-2 w-24"
                    />
                    <button onClick={() => handleSetMoney(character)}>
                      <i className="fa-solid fa-dollar-sign"></i> Sett penger
                    </button>
                  </div>
                </div>
                {/* Info */}
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
                      {character.status === "alive" ? "Levende" : "Død"}
                    </span>
                  </p>
                  <p>
                    Familie:{" "}
                    {character.familyName ? (
                      <Familyname
                        family={{
                          id: character.familyId,
                          name: character.familyName,
                        }}
                      />
                    ) : (
                      "No family"
                    )}
                  </p>
                  <p>Xp: {character.xp}</p>
                  <p>Money: ${character.money.toLocaleString()}</p>
                  <p>Bank: ${character.bank.toLocaleString()}</p>
                  <p>Location: {character.location}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Type == "Chat"
  if (type === "chat") {
    return (
      <section>
        <ul>
          {sortedCharacters.map((character) => (
            <li key={character.id}>
              {onClick && (
                <button onClick={() => onClick(character.username)}>
                  {character.username}
                </button>
              )}
              {!onClick && <Username character={character}></Username>}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section>
      <ul>
        {sortedCharacters.map((character) => (
          <li key={character.id}>
            {onClick && (
              <button onClick={() => onClick(character.username)}>
                {character.username}
              </button>
            )}
            {!onClick && <Username character={character}></Username>}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CharacterList;
