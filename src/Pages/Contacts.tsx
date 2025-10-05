import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import Username from "../components/Typography/Username";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

import { useState } from "react";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  collection,
  getDocs,
  query as fsQuery,
  where,
} from "firebase/firestore";

import { useCharacter } from "../CharacterContext";

const db = getFirestore();

const Contacts = () => {
  const { userCharacter } = useCharacter();

  // Early return narrows the type for the rest of the component
  if (!userCharacter) return null;

  // Safe, non-null values derived after the guard
  const selfId = userCharacter.id;
  const friends = userCharacter.friends ?? [];
  const blacklist = userCharacter.blacklist ?? [];

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [showAddBlacklist, setShowAddBlacklist] = useState(false);
  const [blacklistName, setBlacklistName] = useState("");

  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");

  function showMsg(
    type: "success" | "failure" | "info" | "warning",
    msg: React.ReactNode
  ) {
    setMessageType(type);
    setMessage(msg);
  }

  async function addContact(list: "friends" | "blacklist", name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      showMsg("warning", "Skriv inn et brukernavn.");
      return;
    }

    const lowered = trimmed.toLowerCase();

    try {
      // Finn bruker på brukernavn
      const snap = await getDocs(
        fsQuery(
          collection(db, "Characters"),
          where("username_lowercase", "==", lowered)
        )
      );

      if (snap.empty) {
        showMsg(
          "failure",
          <>
            Fant ingen spiller med brukernavn <strong>{trimmed}</strong>.
          </>
        );
        return;
      }

      const docSnap = snap.docs[0];
      const entry = { id: docSnap.id, name: docSnap.data().username as string };

      // Unngå duplikater
      const current = list === "friends" ? friends : blacklist;
      if (current.some((x: any) => x.id === entry.id)) {
        showMsg(
          "info",
          <>
            <strong>{entry.name}</strong> er allerede{" "}
            {list === "friends" ? "på vennelisten" : "på svartelisten"}.
          </>
        );
        return;
      }

      await updateDoc(doc(db, "Characters", selfId), {
        [list]: arrayUnion(entry),
      });

      showMsg(
        "success",
        <>
          La til <strong>{entry.name}</strong> på{" "}
          {list === "friends" ? "vennelisten" : "svartelisten"}.
        </>
      );
    } catch (err) {
      console.error("Feil ved å legge til kontakt:", err);
      showMsg("failure", "Noe gikk galt. Prøv igjen.");
    }
  }

  async function removeContact(
    list: "friends" | "blacklist",
    entry: { id: string; name: string }
  ) {
    try {
      const ref = doc(db, "Characters", selfId);
      await updateDoc(ref, { [list]: arrayRemove(entry) });

      showMsg(
        "success",
        <>
          Fjernet <strong>{entry.name}</strong> fra{" "}
          {list === "friends" ? "vennelisten" : "svartelisten"}.
        </>
      );
    } catch (err) {
      console.error("Kunne ikke fjerne kontakt:", err);
      showMsg("failure", "Kunne ikke fjerne kontakt. Prøv igjen.");
    }
  }

  return (
    <div>
      <H2>Kontakter</H2>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="grid grid-cols-2 mt-4 gap-8">
        {/* VENNER */}
        <div className="border-r border-neutral-700 min-h-40">
          <div className="flex flex-wrap gap-4 pr-4 justify-between items-center">
            <H3>
              <i className="fa-solid fa-user-group"></i> Venner
            </H3>
            {!showAddFriend && (
              <div>
                <Button
                  size="small"
                  onClick={() => setShowAddFriend((v) => !v)}
                  title="Legg til venn"
                >
                  + Legg til
                </Button>
              </div>
            )}
          </div>

          {showAddFriend && (
            <div className="flex items-center gap-2 mb-3">
              <input
                className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                placeholder="Spillernavn"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
              />
              <Button
                onClick={async () => {
                  await addContact("friends", friendName);
                  setFriendName("");
                  setShowAddFriend(false);
                }}
              >
                <i className="fa-solid fa-plus"></i> Legg til
              </Button>
              <Button style="danger" onClick={() => setShowAddFriend(false)}>
                <i className="fa-solid fa-cancel"></i> Avbryt
              </Button>
            </div>
          )}

          {friends.length > 0 ? (
            <ul>
              {friends.map((friend: any) => (
                <li key={friend.id} className="flex items-center gap-2 py-1">
                  <Username
                    character={{ id: friend.id, username: friend.name }}
                  />
                  <Button
                    style="text"
                    size="small"
                    onClick={() =>
                      removeContact("friends", {
                        id: friend.id,
                        name: friend.name,
                      })
                    }
                    title="Fjern fra venner"
                  >
                    Fjern
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Vennelisten er tom.</p>
          )}
        </div>

        {/* SVARTELISTE (samme layout/stil som Venner) */}
        <div>
          <div className="flex flex-wrap gap-4 pr-4 justify-between items-center">
            <H3>
              <span>
                <i className="fa-solid fa-skull-crossbones"></i> Svarteliste
              </span>
            </H3>
            {!showAddBlacklist && (
              <div>
                <Button
                  size="small"
                  onClick={() => setShowAddBlacklist((v) => !v)}
                  title="Legg til på svarteliste"
                >
                  + Legg til
                </Button>
              </div>
            )}
          </div>

          {showAddBlacklist && (
            <div className="flex items-center gap-2 mb-3">
              <input
                className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                placeholder="Spillernavn"
                value={blacklistName}
                onChange={(e) => setBlacklistName(e.target.value)}
              />
              <Button
                onClick={async () => {
                  await addContact("blacklist", blacklistName);
                  setBlacklistName("");
                  setShowAddBlacklist(false);
                }}
              >
                <i className="fa-solid fa-plus"></i> Legg til
              </Button>
              <Button style="danger" onClick={() => setShowAddBlacklist(false)}>
                <i className="fa-solid fa-cancel"></i> Avbryt
              </Button>
            </div>
          )}

          {blacklist.length > 0 ? (
            <ul>
              {blacklist.map((player: any) => (
                <li key={player.id} className="flex items-center gap-2 py-1">
                  <Username
                    character={{ id: player.id, username: player.name }}
                  />
                  <Button
                    style="text"
                    size="small"
                    onClick={() =>
                      removeContact("blacklist", {
                        id: player.id,
                        name: player.name,
                      })
                    }
                    title="Fjern fra svarteliste"
                  >
                    Fjern
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Svartelisten er tom.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
