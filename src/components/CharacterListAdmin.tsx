// components/CharacterListAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";

import Username from "./Typography/Username";
import Familyname from "./Typography/Familyname";
import Button from "./Button";
import InfoBox from "./InfoBox";

import { useCharacter } from "../CharacterContext";
import { getCurrentRank } from "../Functions/RankFunctions";

// Use the admin helpers for core updates
import {
  setXp as setXpFn,
  setMoney as setMoneyFn,
  setBank as setBankFn,
  setRole as setRoleFn, // role: "admin" | "moderator" | ""
  setStatus as setStatusFn, // "alive" | "dead"
} from "../Functions/AdminFunctions";

type MsgKind = "success" | "warning" | "info" | "failure";

export default function CharacterListAdmin() {
  const db = getFirestore();
  const { userCharacter } = useCharacter();

  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [newValue, setNewValue] = useState<number | "">("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<MsgKind>("info");
  const [loading, setLoading] = useState(true);

  // ---- Load all characters once (like original admin view) ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "Characters"));
        const data = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            username: v.username,
            familyId: v.familyId,
            familyName: v.familyName,
            role: v.role || "",
            xp: v.stats?.xp ?? 0,
            money: v.stats?.money ?? 0,
            bank: v.stats?.bank ?? 0,
            status: v.status ?? "alive",
            location: v.location ?? "",
          };
        });
        setCharacters(data);
      } catch (e) {
        console.error("Feil ved lasting av spillere:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  // ---- Sorting (same as original) ----
  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => a.username.localeCompare(b.username)),
    [characters]
  );

  // ---- Small helpers identical to original behavior ----
  const sanitizeInt = (s: string) => s.replace(/[^\d]/g, "");
  const handleAdminNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    if (cleaned === "") setNewValue("");
    else setNewValue(parseInt(cleaned, 10));
  };

  const actor = {
    id: userCharacter?.id ?? "",
    username: userCharacter?.username ?? "System",
  };

  // ---- Admin Actions (UI state updates mirror original) ----
  const setXp = async (character: any, value: number) => {
    await setXpFn(character.id, value);
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, xp: value } : c))
    );
    setMessageType("success");
    setMessage(
      `Xp oppdatert for ${character.username} til ${value.toLocaleString(
        "nb-NO"
      )}.`
    );
  };

  const setMoney = async (character: any, value: number) => {
    await setMoneyFn(character.id, value);
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, money: value } : c))
    );
    setMessageType("success");
    setMessage(
      `Penger oppdatert for ${character.username} til $${value.toLocaleString(
        "nb-NO"
      )}.`
    );
  };

  const setBank = async (character: any, value: number) => {
    await setBankFn(character.id, value);
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, bank: value } : c))
    );
    setMessageType("success");
    setMessage(
      `Bank oppdatert for ${character.username} til $${value.toLocaleString(
        "nb-NO"
      )}.`
    );
  };

  const handleSetXp = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setXp(character, newValue as number);
      setNewValue("");
    }
  };

  const handleSetMoney = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setMoney(character, newValue as number);
      setNewValue("");
    }
  };

  const handleSetBank = (character: any) => {
    if (newValue === "") {
      setMessageType("warning");
      setMessage("Du må skrive inn en verdi.");
    } else {
      setBank(character, newValue as number);
      setNewValue("");
    }
  };

  const makeAdmin = async (character: any) => {
    await setRoleFn(
      { id: character.id, username: character.username },
      actor,
      "admin"
    );
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, role: "admin" } : c))
    );
    setMessageType("success");
    setMessage(`${character.username} ble satt som admin.`);
  };

  const removeAdmin = async (character: any) => {
    await setRoleFn(
      { id: character.id, username: character.username },
      actor,
      ""
    );
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, role: "" } : c))
    );
    setMessageType("success");
    setMessage(`${character.username} ble fjernet som admin.`);
  };

  const makeModerator = async (character: any) => {
    await setRoleFn(
      { id: character.id, username: character.username },
      actor,
      "moderator"
    );
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, role: "moderator" } : c))
    );
    setMessageType("success");
    setMessage(`${character.username} ble satt som moderator.`);
  };

  const removeModerator = async (character: any) => {
    // Note: setRole("", …) clears role; ensure your AdminFunctions logs a moderator removal properly.
    await setRoleFn(
      { id: character.id, username: character.username },
      actor,
      ""
    );
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, role: "" } : c))
    );
    setMessageType("success");
    setMessage(`${character.username} ble fjernet som moderator.`);
  };

  const killPlayer = async (character: any) => {
    await setStatusFn(character.id, "dead");
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, status: "dead" } : c))
    );
  };

  const resurrectPlayer = async (character: any) => {
    await setStatusFn(character.id, "alive");
    setCharacters((prev) =>
      prev.map((c) => (c.id === character.id ? { ...c, status: "alive" } : c))
    );
  };

  // ---- Loading / empty states (match original wording) ----
  if (loading) {
    return <p>Laster spillere...</p>;
  }

  return (
    <section>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <ul>
        {sortedCharacters.map((character) => (
          <li key={character.id}>
            <div className="flex items-center gap-2">
              <p>
                <Username
                  character={{
                    id: character.id,
                    username: character.username,
                    role: character.role,
                  }}
                />
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
                {/* Info (same as original) */}
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

                {/* Actions (same as original) */}
                <div className="bg-neutral-900 text-neutral-400 font-medium px-2 sm:px-4 py-1 text-sm flex flex-wrap gap-2">
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
                  <Button size="small" onClick={() => handleSetBank(character)}>
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
