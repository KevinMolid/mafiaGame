import { useState, useEffect, useMemo } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

import firebaseConfig from "../firebaseConfig";

import { useCharacter } from "../CharacterContext";

// Components
import Username from "./Typography/Username";
import InfoBox from "./InfoBox";
import Familyname from "./Typography/Familyname";
import Button from "./Button";

// Functions
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helpers
type RoleName = "admin" | "moderator";
type RoleAlertType = "newRole" | "removeRole";
type GameEventType = "newRole" | "removeRole";

/** Write a role alert to /Characters/{targetId}/alerts */
async function addRoleAlert(
  targetCharacterId: string,
  actorId: string,
  actorName: string,
  type: RoleAlertType,
  role: RoleName
) {
  await addDoc(collection(db, "Characters", targetCharacterId, "alerts"), {
    read: false,
    userId: actorId,
    userName: actorName,
    timestamp: serverTimestamp(),
    type,
    ...(type === "newRole" ? { newRole: role } : { removedRole: role }),
  });
}

async function logGameEvent(
  userId: string,
  userName: string,
  actorId: string,
  actorName: string,
  eventType: GameEventType,
  role: RoleName
) {
  await addDoc(collection(db, "GameEvents"), {
    userId,
    userName,
    actorId,
    actorName,
    eventType,
    role,
    timestamp: serverTimestamp(),
  });
}

interface CharacterListProps {
  type?: "rank" | "admin" | "chat" | "jail" | "";
  sortBy?: "username" | "xp" | "money";
  onClick?: (receiver: string) => void;
}

const CharacterList = ({
  type = "",
  sortBy = "username",
  onClick,
}: CharacterListProps) => {
  const [characters, setCharacters] = useState<Array<any>>([]);
  const { userCharacter } = useCharacter();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [newValue, setNewValue] = useState<number | "">("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "info"
  >("info");
  const [loading, setLoading] = useState(true);

  const fetchCharacters = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Characters"));

      const characterData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.data().username,
        familyId: doc.data().familyId,
        role: doc.data().role,
        familyName: doc.data().familyName,
        xp: doc.data().stats.xp,
        money: doc.data().stats.money,
        bank: doc.data().stats.bank,
        status: doc.data().status,
        location: doc.data().location,
        // NEW: needed for jail filtering
        jailReleaseTime: doc.data().jailReleaseTime || null,
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
  const sortedCharacters = useMemo(() => {
    const arr = [...characters];
    if (sortBy === "xp") return arr.sort((a, b) => b.xp - a.xp);
    if (sortBy === "money")
      return arr.sort((a, b) => b.money + b.bank - (a.money + a.bank));
    return arr.sort((a, b) => a.username.localeCompare(b.username));
  }, [characters, sortBy]);

  const rankedCharacters = useMemo(
    () =>
      type === "rank"
        ? sortedCharacters.filter((c) => (c.role || "") !== "admin")
        : sortedCharacters,
    [type, sortedCharacters]
  );

  // NEW: players in same city and still serving jail time
  const jailedHere = useMemo(() => {
    const now = Date.now();
    const here = userCharacter?.location;
    return sortedCharacters.filter((c) => {
      if (!here || !c.location || c.location !== here) return false;
      const ts = c.jailReleaseTime;
      // expect Firestore Timestamp: ts?.toMillis()
      const releaseMs =
        ts && typeof ts.toMillis === "function" ? ts.toMillis() : null;
      return !!releaseMs && releaseMs > now;
    });
  }, [sortedCharacters, userCharacter?.location]);

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

  // Make sure you have the acting user's name available (adjust as needed)
  const actorId = userCharacter?.id ?? "oBeIZgsM33Kieq4HdotP";
  const actorName = userCharacter?.username ?? "System";

  const makeAdmin = async (character: any) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      await updateDoc(characterRef, { role: "admin" });
      await logGameEvent(
        character.id,
        character.username,
        actorId,
        actorName,
        "newRole",
        "admin"
      );
      await addRoleAlert(character.id, actorId, actorName, "newRole", "admin");

      setCharacters((prev) =>
        prev.map((char) =>
          char.id === character.id ? { ...char, role: "admin" } : char
        )
      );

      setMessageType("success");
      setMessage(`${character.username} ble satt som admin.`);
    } catch (error) {
      console.error("Feil ved oppdatering av admin-rolle:", error);
    }
  };

  const removeAdmin = async (character: any) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      await updateDoc(characterRef, { role: "" });
      await logGameEvent(
        character.id,
        character.username,
        actorId,
        actorName,
        "removeRole",
        "admin"
      );
      await addRoleAlert(
        character.id,
        actorId,
        actorName,
        "removeRole",
        "admin"
      );

      setCharacters((prev) =>
        prev.map((char) =>
          char.id === character.id ? { ...char, role: "" } : char
        )
      );

      setMessageType("success");
      setMessage(`${character.username} ble fjernet som admin.`);
    } catch (error) {
      console.error("Feil ved oppdatering av admin-rolle:", error);
    }
  };

  const makeModerator = async (character: any) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      await updateDoc(characterRef, { role: "moderator" });
      await logGameEvent(
        character.id,
        character.username,
        actorId,
        actorName,
        "newRole",
        "moderator"
      );
      await addRoleAlert(
        character.id,
        actorId,
        actorName,
        "newRole",
        "moderator"
      );

      setCharacters((prev) =>
        prev.map((char) =>
          char.id === character.id ? { ...char, role: "moderator" } : char
        )
      );

      setMessageType("success");
      setMessage(`${character.username} ble satt som moderator.`);
    } catch (error) {
      console.error("Feil ved oppdatering av moderator-rolle:", error);
    }
  };

  const removeModerator = async (character: any) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      await updateDoc(characterRef, { role: "" });
      await logGameEvent(
        character.id,
        character.username,
        actorId,
        actorName,
        "removeRole",
        "moderator"
      );
      await addRoleAlert(
        character.id,
        actorId,
        actorName,
        "removeRole",
        "moderator"
      );

      setCharacters((prev) =>
        prev.map((char) =>
          char.id === character.id ? { ...char, role: "" } : char
        )
      );

      setMessageType("success");
      setMessage(`${character.username} ble fjernet som moderator.`);
    } catch (error) {
      console.error("Feil ved oppdatering av moderator-rolle:", error);
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
        `Xp oppdatert for ${character.username} til ${newValue.toLocaleString(
          "nb-NO"
        )}.`
      );
    } catch (error) {
      console.error("Feil ved oppdatering av Xp:", error);
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
        } til $${newValue.toLocaleString("nb-NO")}.`
      );
    } catch (error) {
      console.error("Feil ved oppdatering av penger:", error);
    }
  };

  const setBank = async (character: any, newValue: number) => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      // Update the money in Firebase
      await updateDoc(characterRef, {
        "stats.bank": newValue,
      });

      // Update the local state
      setCharacters((prevCharacters) =>
        prevCharacters.map((char) =>
          char.id === character.id ? { ...char, bank: newValue } : char
        )
      );

      setMessageType("success");
      setMessage(
        `Bank oppdatert for ${
          character.username
        } til $${newValue.toLocaleString("nb-NO")}.`
      );
    } catch (error) {
      console.error("Feil ved oppdatering av bank:", error);
    }
  };

  const handleSetXp = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setXp(character, newValue);
      setNewValue("");
    }
  };

  const handleSetMoney = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setMoney(character, newValue);
      setNewValue("");
    }
  };

  const handleSetBank = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setBank(character, newValue);
      setNewValue("");
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
          {rankedCharacters.map((character, index) => (
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
                    onClick={() => {
                      setSelectedCharacterId(character.id);
                      setNewValue("");
                    }}
                  >
                    <i className="fa-solid fa-caret-down"></i>
                  </div>
                )}
              </div>

              {selectedCharacterId === character.id && (
                <div className="border border-neutral-600 mb-2 mt-2">
                  {/* Info */}
                  <div className="bg-neutral-800 px-2 sm:px-4 py-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
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
                    <p>
                      Penger: <i className="fa-solid fa-dollar-sign"></i>{" "}
                      {character.money.toLocaleString("nb-NO")}
                    </p>
                    <p>
                      Bank: <i className="fa-solid fa-dollar-sign"></i>{" "}
                      {character.bank.toLocaleString("nb-NO")}
                    </p>
                    <p>Lokasjon: {character.location}</p>
                  </div>
                  {/* Actions */}
                  <div className="bg-neutral-900 text-neutral-400 font-medium px-2 sm:px-4 py-1 text-sm flex flex-wrap gap-2">
                    {/* Set money / xp */}
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={
                        newValue === "" ? "" : newValue.toLocaleString("nb-NO")
                      }
                      onChange={handleAdminNumberChange}
                      className="bg-transparent border-b border-neutral-600 py-0.5 text-md w-32 font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                    />
                    <Button size="small" onClick={() => handleSetXp(character)}>
                      Sett <strong>XP</strong>
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleSetMoney(character)}
                    >
                      Sett <i className="fa-solid fa-dollar-sign"></i>
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleSetBank(character)}
                    >
                      Sett <strong>Bank</strong>
                    </Button>

                    {character.role === "admin" ? (
                      <Button
                        size="small"
                        style="danger"
                        onClick={() => removeAdmin(character)}
                      >
                        <p>
                          <i className="fa-solid fa-cancel"></i> Fjern Admin
                        </p>
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => makeAdmin(character)}>
                        <p>
                          <i className="fa-solid fa-gear"></i> Sett Admin
                        </p>
                      </Button>
                    )}

                    {character.role === "moderator" ? (
                      <Button
                        size="small"
                        style="danger"
                        onClick={() => removeModerator(character)}
                      >
                        <p>
                          <i className="fa-solid fa-cancel"></i> Fjern Moderator
                        </p>
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => makeModerator(character)}
                      >
                        <p>
                          <i className="fa-solid fa-shield"></i> Sett Moderator
                        </p>
                      </Button>
                    )}

                    {character.status === "alive" && (
                      <div>
                        <Button
                          onClick={() => killPlayer(character)}
                          style="danger"
                          size="small"
                        >
                          <i className="fa-solid fa-gun"></i> Drep
                        </Button>
                      </div>
                    )}
                    {character.status === "dead" && (
                      <div>
                        <Button
                          size="small"
                          onClick={() => resurrectPlayer(character)}
                        >
                          <i className="fa-solid fa-hand"></i> Gjennoppliv
                        </Button>
                      </div>
                    )}
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

  // Type == "jail"  (FILTERED)
  if (type === "jail") {
    return (
      <section>
        <ul>
          {jailedHere.map((character) => (
            <li key={character.id}>
              {onClick && (
                <button onClick={() => onClick(character.username)}>
                  {character.username}
                </button>
              )}
              {!onClick && <Username character={character}></Username>}
              <Button size="small" style="text">
                Bryt ut
              </Button>
            </li>
          ))}
        </ul>
        {jailedHere.length === 0 && (
          <p className="text-sm text-neutral-400 mt-1">
            Ingen innsatte i {userCharacter?.location ?? "byen"} akkurat nå.
          </p>
        )}
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
