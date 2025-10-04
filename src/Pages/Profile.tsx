// Components
import Main from "../components/Main";
import Notebook from "./Notebook";
import Blacklist from "./Contacts";
import EditProfile from "./EditProfile";
import Tab from "../components/Tab";
import InfoBox from "../components/InfoBox";

// Functions
import { bbcodeToHtml } from "../Functions/bbcode";

// React
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { useCharacter } from "../CharacterContext";
import Username from "../components/Typography/Username";

// Firebase
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// More functions
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";
import timeAgo from "../Functions/TimeFunctions";

type ViewKey = "profile" | "notebook" | "blacklist" | "edit";
const VIEW_STORAGE_KEY = "profile:view";

const readSavedView = (): ViewKey => {
  const v = localStorage.getItem(VIEW_STORAGE_KEY);
  return v === "profile" ||
    v === "notebook" ||
    v === "blacklist" ||
    v === "edit"
    ? (v as ViewKey)
    : "profile";
};

const Profile = () => {
  const { spillerID } = useParams<{ spillerID: string }>();
  const [characterData, setCharacterData] = useState<any>(null);
  const { userCharacter } = useCharacter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global tab state (we'll choose the right value via effects below)
  const [view, setView] = useState<ViewKey>("profile");

  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "warning" | "failure"
  >("info");

  const viewingOwnProfile =
    !!userCharacter && !!spillerID && spillerID === userCharacter.id;

  // One-time hydration guard so we don't flip-flop on reload
  const hydratedOnceRef = useRef(false);

  // Clean up any old per-character keys like "profile:view:<id>"
  useEffect(() => {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("profile:view:")) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, []);

  // Realtime character document
  useEffect(() => {
    if (!spillerID) {
      setError("Character ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);

    const charRef = doc(db, "Characters", spillerID);
    const unsubscribe = onSnapshot(
      charRef,
      (snap) => {
        if (snap.exists()) {
          setCharacterData({
            id: snap.id,
            ...(snap.data() as Record<string, any>),
          });
          setError(null);
        } else {
          setError("Fant ikke spilleren!");
          setCharacterData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Feil ved realtime-oppdatering:", err);
        setError("Feil ved lasting av spillerdata.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [spillerID]);

  // Decide which tab to show:
  // - If it's NOT your own profile => always "profile"
  // - If it's your own profile => hydrate once from storage (then persist changes below)
  useEffect(() => {
    if (!viewingOwnProfile) {
      setView("profile");
      hydratedOnceRef.current = false; // reset guard when leaving own profile
      return;
    }
    if (!hydratedOnceRef.current) {
      setView(readSavedView());
      hydratedOnceRef.current = true;
    }
  }, [viewingOwnProfile]);

  // Persist current tab ONLY when viewing own profile
  useEffect(() => {
    if (viewingOwnProfile) {
      try {
        localStorage.setItem(VIEW_STORAGE_KEY, view);
      } catch {
        /* ignore */
      }
    }
  }, [view, viewingOwnProfile]);

  // ---- NOTES: debounced saver that updates Characters/{id}.notes ----
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveNotes = (value: string) => {
    if (!userCharacter) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "Characters", userCharacter.id), {
          notes: value,
        });
      } catch (e) {
        console.error("Failed to save notes:", e);
      }
    }, 300);
  };

  const addFriend = async () => {
    if (!spillerID || !characterData || !userCharacter) return;
    const newFriend = { id: spillerID, name: characterData.username };
    const userDocRef = doc(db, "Characters", userCharacter.id);

    try {
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;

      const userData = userDocSnap.data();
      const currentFriends = Array.isArray(userData.friends)
        ? userData.friends
        : [];
      const currentBlacklist = Array.isArray(userData.blacklist)
        ? userData.blacklist
        : [];

      const isAlreadyFriend = currentFriends.some(
        (f: any) => f.id === spillerID
      );
      const isAlreadyBlacklist = currentBlacklist.some(
        (p: any) => p.id === spillerID
      );

      if (isAlreadyFriend) {
        setMessageType("warning");
        setMessage(`${characterData.username} er allerede lagt til som venn.`);
        return;
      }

      await updateDoc(userDocRef, {
        friends: [...currentFriends, newFriend],
        blacklist: currentBlacklist.filter((p: any) => p.id !== spillerID),
      });

      setMessageType("success");
      setMessage(
        isAlreadyBlacklist
          ? `La ${characterData.username} til som venn. ${characterData.username} ble fjernet fra svartelisten.`
          : `La ${characterData.username} til som venn.`
      );
    } catch (err) {
      console.error("En feil oppstod da du prøvde å legge til en venn:", err);
    }
  };

  const addToBlacklist = async () => {
    if (!spillerID || !characterData || !userCharacter) return;

    const newBlacklist = { id: spillerID, name: characterData.username };
    const userDocRef = doc(db, "Characters", userCharacter.id);

    try {
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;

      const userData = userDocSnap.data();
      const currentFriends = Array.isArray(userData.friends)
        ? userData.friends
        : [];
      const currentBlacklist = Array.isArray(userData.blacklist)
        ? userData.blacklist
        : [];

      const isAlreadyFriend = currentFriends.some(
        (f: any) => f.id === spillerID
      );
      const isAlreadyBlacklist = currentBlacklist.some(
        (p: any) => p.id === spillerID
      );

      if (isAlreadyBlacklist) {
        setMessageType("warning");
        setMessage(
          `${characterData.username} er allerede lagt til på svartelisten.`
        );
        return;
      }

      await updateDoc(userDocRef, {
        friends: currentFriends.filter((f: any) => f.id !== spillerID),
        blacklist: [...currentBlacklist, newBlacklist],
      });

      setMessageType("success");
      setMessage(
        isAlreadyFriend
          ? `La ${characterData.username} til på svartelisten. ${characterData.username} ble fjernet fra venner.`
          : `La ${characterData.username} til på svartelisten.`
      );
    } catch (err) {
      console.error(
        "En feil oppstod da du prøvde å legge til en spiller på svartelisten:",
        err
      );
    }
  };

  if (loading) return <div>Laster...</div>;
  if (error) return <div>{error}</div>;
  if (!characterData) return <div>Ingen spillerdata tilgjengelig.</div>;
  if (!userCharacter) return null;

  const isRecentlyActive = characterData.lastActive
    ? Date.now() - characterData.lastActive.seconds * 1000 <= 5 * 60 * 1000
    : false;

  return (
    <Main>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex flex-col items-center md:grid md:grid-cols-[max-content_max-content] gap-4 lg:gap-8 pb-4 border-b border-neutral-700">
        <img
          className="w-[320px] h-[320px] object-cover"
          src={characterData.img || "/default.jpg"}
          alt=""
        />

        <div className="flex flex-col h-full justify-between gap-4">
          {/* Icons */}
          {spillerID !== userCharacter.id ? (
            <div className="text-2xl flex gap-4">
              <Link
                to={`/meldinger?username=${encodeURIComponent(
                  characterData.username
                )}`}
                title={`Send melding til ${characterData.username}`}
              >
                <div className="hover:text-white">
                  <i className="fa-solid fa-envelope"></i>
                </div>
              </Link>

              <button
                onClick={addFriend}
                className="hover:text-white"
                title={`Sett ${characterData.username} som venn`}
              >
                <i className="fa-solid fa-user-group"></i>{" "}
              </button>

              <button
                onClick={addToBlacklist}
                className="hover:text-white"
                title={`Svartelist ${characterData.username}`}
              >
                <i className="fa-solid fa-skull-crossbones"></i>
              </button>

              <button
                className="hover:text-white"
                title={`Rapporter ${characterData.username}`}
              >
                <i className="fa-solid fa-triangle-exclamation"></i>{" "}
              </button>
            </div>
          ) : (
            <div></div>
          )}

          {/* Info */}
          <ul className="grid grid-cols-[min-content_max-content] gap-x-4">
            <li className="text-stone-400">Navn</li>
            <li>
              <Username
                character={{
                  id: characterData.id,
                  username: characterData.username,
                  role: characterData.role,
                }}
              />
            </li>

            <li className="text-stone-400">Status</li>
            <li
              className={
                "capitalize " +
                (characterData.status === "alive"
                  ? "text-green-400"
                  : "text-red-400")
              }
            >
              {characterData.status == "alive" ? "Levende" : "Død"}
            </li>

            <li className="text-stone-400">Rank</li>
            <li>{getCurrentRank(characterData.stats.xp)}</li>

            <li className="text-stone-400">Penger</li>
            <li>
              {getMoneyRank(
                characterData.stats.money + characterData.stats.bank
              )}
            </li>

            <li className="text-stone-400">Familie</li>
            <li>
              {characterData.familyName ? (
                <Link to={`/familie/profil/${characterData.familyId}`}>
                  <strong className="text-white hover:underline">
                    {characterData.familyName}
                  </strong>
                </Link>
              ) : (
                "Ingen familie"
              )}
            </li>

            <li className="text-stone-400">Sist aktiv</li>
            <li
              className={isRecentlyActive ? "text-green-400" : "text-stone-400"}
            >
              {isRecentlyActive
                ? "Pålogget"
                : characterData.lastActive
                ? timeAgo(characterData.lastActive.seconds * 1000)
                : characterData.createdAt
                ? new Date(
                    characterData.createdAt.seconds * 1000
                  ).toLocaleDateString("no-NO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </li>

            <li className="text-stone-400">Registrert</li>
            <li className="text-stone-400">
              {characterData.createdAt
                ? new Date(
                    characterData.createdAt.seconds * 1000
                  ).toLocaleDateString("no-NO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </li>
          </ul>
        </div>

        {viewingOwnProfile && (
          <ul className="flex flex-wrap col-span-2 mt-4">
            <Tab active={view === "profile"} onClick={() => setView("profile")}>
              <i className="fa-solid fa-user"></i> Profil
            </Tab>
            <Tab
              active={view === "notebook"}
              onClick={() => setView("notebook")}
            >
              <i className="fa-solid fa-pencil"></i> Notater
            </Tab>
            <Tab
              active={view === "blacklist"}
              onClick={() => setView("blacklist")}
            >
              <i className="fa-solid fa-address-book"></i> Kontakter
            </Tab>
            <Tab active={view === "edit"} onClick={() => setView("edit")}>
              <i className="fa-solid fa-pen-to-square"></i> Endre profil
            </Tab>
          </ul>
        )}
      </div>

      {/* Views */}
      {view === "profile" && (
        <div className="py-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-md p-4 break-words">
            {characterData?.profileText?.length ? (
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: bbcodeToHtml(characterData.profileText),
                }}
              />
            ) : (
              <></>
            )}
          </div>
        </div>
      )}

      {view === "notebook" && (
        <div className="py-6">
          <Notebook
            notes={characterData.notes ?? ""}
            onChangeNotes={saveNotes}
          />
        </div>
      )}

      {view === "blacklist" && (
        <div className="py-6">
          <Blacklist />
        </div>
      )}

      {view === "edit" && (
        <div className="py-6">
          <EditProfile />
        </div>
      )}
    </Main>
  );
};

export default Profile;
