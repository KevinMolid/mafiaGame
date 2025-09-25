import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

import firebaseConfig from "../firebaseConfig";

// Components
import Username from "./Typography/Username";
import InfoBox from "./InfoBox";
import Familyname from "./Typography/Familyname";
import Button from "./Button";

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
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [newValue, setNewValue] = useState<number | "">("");
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
      console.error("Feil ved lasting av spillere:", error);
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

  const sanitizeInt = (s: string) => s.replace(/[^\d]/g, "");

  const handleAdminNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    if (cleaned === "") setNewValue("");
    else setNewValue(parseInt(cleaned, 10));
  };

  const killPlayer = async (character: any) => {
    const characterRef = doc(db, "Characters", character.id);
    await updateDoc(characterRef, {
      status: "dead",
      diedAt: serverTimestamp(),
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

  const makeAdmin = async (character: any) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      // Update the money in Firebase
      await updateDoc(characterRef, {
        role: "admin",
      });

      // Update the local state
      setCharacters((prevCharacters) =>
        prevCharacters.map((char) =>
          char.id === character.id ? { ...char, role: "admin" } : char
        )
      );

      setMessageType("success");
      setMessage(`${character.username} ble satt som admin.`);
    } catch (error) {
      console.error("Feil ved oppdatering av admin-rolle:", error);
    }
  };

  const setMoney = async (character: any, newValue: number) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      // Update the money in Firebase
      await updateDoc(characterRef, {
        "stats.money": newValue,
      });

      // Update the local state
      setCharacters((prevCharacters) =>
        prevCharacters.map((char) =>
          char.id === character.id ? { ...char, money: newValue } : char
        )
      );

      setMessageType("success");
      setMessage(
        `Penger oppdatert for ${
          character.username
        } til $${newValue.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Feil ved oppdatering av penger:", error);
    }
  };

  const setXp = async (character: any, newValue: number) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      // Update the money in Firebase
      await updateDoc(characterRef, {
        "stats.xp": newValue,
      });

      // Update the local state
      setCharacters((prevCharacters) =>
        prevCharacters.map((char) =>
          char.id === character.id ? { ...char, xp: newValue } : char
        )
      );

      setMessageType("success");
      setMessage(
        `Xp oppdatert for ${
          character.username
        } til ${newValue.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Feil ved oppdatering av Xp:", error);
    }
  };

  const handleSetMoney = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setMoney(character, newValue);
      setNewValue("")
    }
  };

  const handleSetXp = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setXp(character, newValue);
      setNewValue("")
    }
  };

  if (loading) {
    return <p>Laster spillere...</p>;
  }

  if (characters.length === 0) {
    return <p>Ingen spillere funnet.</p>;
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
              <div className="flex items-center gap-2">
                <p>
                  <Username character={character} />
                </p>
                <p>{getCurrentRank(character.xp)}</p>
                {selectedCharacterId === character.id ? (
                  <div
                    className="text-xl text-neutral-200 hover:text-white cursor-pointer"
                    onClick={() => setSelectedCharacterId("")}
                  >
                    <i className="fa-solid fa-caret-up"></i>
                  </div>
                ) : (
                  <div
                    className="text-xl text-neutral-200 hover:text-white cursor-pointer"
                    onClick={() => {setSelectedCharacterId(character.id)
                      setNewValue("")
                    }}
                  >
                    <i className="fa-solid fa-caret-down"></i>
                  </div>
                )}
              </div>

              {selectedCharacterId === character.id && (
                <div className="border border-neutral-600 mb-2 mt-2">
                  {/* Info */}
                  <div className="bg-neutral-800 px-4 py-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
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
                        "Ingen familie"
                      )}
                    </p>
                    <p>Xp: {character.xp}</p>
                    <p>Penger: ${character.money.toLocaleString()}</p>
                    <p>Bank: ${character.bank.toLocaleString()}</p>
                    <p>Lokasjon: {character.location}</p>
                  </div>
                  {/* Actions */}
                  <div className="bg-neutral-900 text-neutral-400 font-medium px-4 py-1 text-sm flex gap-4">
                    {character.status === "alive" && (
                      <Button onClick={() => killPlayer(character)} style="danger">
                        <i className="fa-solid fa-gun"></i> Drep
                      </Button>
                    )}
                    {character.status === "dead" && (
                      <Button onClick={() => resurrectPlayer(character)}>
                        <i className="fa-solid fa-hand"></i> Gjennoppliv
                      </Button>
                    )}
                    {/* Set money / xp */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={newValue === "" ? "" : newValue.toLocaleString("nb-NO")}
                        onChange={handleAdminNumberChange}
                        className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                      />
                      <Button onClick={() => handleSetMoney(character)}>
                        Sett <i className="fa-solid fa-dollar-sign"></i>
                      </Button>
                      <Button onClick={() => handleSetXp(character)}>
                        Sett <strong>XP</strong>
                      </Button>
                      <Button onClick={() => makeAdmin(character)}>
                      <p>
                        <i className="fa-solid fa-crown"></i> Sett som Admin
                      </p>
                    </Button>
                    </div>
                  </div>
                </div>
              )}
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
