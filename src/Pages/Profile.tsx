// Components
import Main from "../components/Main";
import Notebook from "./Notebook";
import Blacklist from "./Contacts";
import EditProfile from "./EditProfile";
import Tab from "../components/Tab";
import InfoBox from "../components/InfoBox";

// React
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { useCharacter } from "../CharacterContext";

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

// Functions
import { getCurrentRank, getMoneyRank } from "../Functions/RankFunctions";
import timeAgo from "../Functions/TimeFunctions";

const Profile = () => {
  const { spillerID } = useParams<{ spillerID: string }>();
  const [characterData, setCharacterData] = useState<any>(null);
  const { userCharacter } = useCharacter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<
    "profile" | "notebook" | "blacklist" | "edit"
  >("profile");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "warning" | "failure"
  >("info");

  useEffect(() => {
    if (!spillerID) {
      setError("Character ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const charRef = doc(db, "Characters", spillerID);

    // Realtime listener
    const unsubscribe = onSnapshot(
      charRef,
      (snap) => {
        if (snap.exists()) {
          setCharacterData(snap.data());
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

    // Rydd opp når spillerID endres / komponent unmountes
    return () => unsubscribe();
  }, [spillerID]);

  const addFriend = async () => {
    if (!spillerID || !characterData || !userCharacter) {
      console.error("Mangler nødvendig data for å legge til venn.");
      return;
    }

    const newFriend = { id: spillerID, name: characterData.username };
    const userDocRef = doc(db, "Characters", userCharacter.id);

    try {
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // Check if `friends` field exists and is an array
        const currentFriends = Array.isArray(userData.friends)
          ? userData.friends
          : [];

        // Avoid duplicate friends
        const isAlreadyFriend = currentFriends.some(
          (friend: any) => friend.id === spillerID
        );

        // Check if `blacklist` field exists and is an array
        const currentBlacklist = Array.isArray(userData.blacklist)
          ? userData.blacklist
          : [];

        // Avoid both in friends and blacklist
        const isAlreadyBlacklist = currentBlacklist.some(
          (player: any) => player.id === spillerID
        );

        if (isAlreadyFriend) {
          setMessageType("warning");
          setMessage(
            `${characterData.username} er allerede lagt til som venn.`
          );
          return;
        }

        // Add new friend
        const updatedFriends = [...currentFriends, newFriend];

        // Remove from blacklist if present
        const updatedBlacklist = currentBlacklist.filter(
          (player: any) => player.id !== spillerID
        );

        // Update Firestore
        await updateDoc(userDocRef, {
          friends: updatedFriends,
          blacklist: updatedBlacklist,
        });

        setMessageType("success");
        {
          isAlreadyBlacklist
            ? setMessage(
                `La ${characterData.username} til som venn. ${characterData.username} ble fjernet fra svartelisten.`
              )
            : setMessage(`La ${characterData.username} til som venn.`);
        }
      } else {
        console.error("Brukeren finnes ikke.");
      }
    } catch (err) {
      console.error("En feil oppstod da du prøvde å legge til en venn:", err);
    }
  };

  const addToBlacklist = async () => {
    if (!spillerID || !characterData || !userCharacter) {
      console.error("Missing necessary data to add a friend.");
      return;
    }

    const newBlacklist = { id: spillerID, name: characterData.username };
    const userDocRef = doc(db, "Characters", userCharacter.id);

    try {
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // Check if `friends` field exists and is an array
        const currentFriends = Array.isArray(userData.friends)
          ? userData.friends
          : [];

        // Avoid duplicate friends
        const isAlreadyFriend = currentFriends.some(
          (friend: any) => friend.id === spillerID
        );

        // Check if `blacklist` field exists and is an array
        const currentBlacklist = Array.isArray(userData.blacklist)
          ? userData.blacklist
          : [];

        // Avoid both in friends and blacklist
        const isAlreadyBlacklist = currentBlacklist.some(
          (player: any) => player.id === spillerID
        );

        if (isAlreadyBlacklist) {
          setMessageType("warning");
          setMessage(
            `${characterData.username} er allerede lagt til på svartelisten.`
          );
          return;
        }

        // Add new Blacklist
        const updatedBlacklist = [...currentBlacklist, newBlacklist];

        // Remove from blacklist if present
        const updatedFriends = currentFriends.filter(
          (friend: any) => friend.id !== spillerID
        );

        // Update Firestore
        await updateDoc(userDocRef, {
          friends: updatedFriends,
          blacklist: updatedBlacklist,
        });

        setMessageType("success");
        {
          isAlreadyFriend
            ? setMessage(
                `La ${characterData.username} til på svartelisten. ${characterData.username} ble fjernet fra venner.`
              )
            : setMessage(`La ${characterData.username} til på svartelisten.`);
        }
      } else {
        console.error("Brukeren finnes ikke.");
      }
    } catch (err) {
      console.error(
        "En feil oppstod da du prøvde å legge til en spiller på svartelisten:",
        err
      );
    }
  };

  if (loading) {
    return <div>Laster...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!characterData) {
    return <div>Ingen spillerdata tilgjengelig.</div>;
  }

  if (!userCharacter) return;

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
              <p className="text-white font-bold">{characterData.username}</p>
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
        {spillerID === userCharacter.id && (
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
          <div className="bg-neutral-900 border border-neutral-700 rounded-md p-4 whitespace-pre-wrap break-words">
            {characterData?.profileText?.length ? (
              characterData.profileText
            ) : (
              <span className="text-neutral-500">Ingen profiltekst ennå.</span>
            )}
          </div>
        </div>
      )}

      {view === "notebook" && (
        <div className="py-6">
          <Notebook></Notebook>
        </div>
      )}

      {view === "blacklist" && (
        <div className="py-6">
          <Blacklist></Blacklist>
        </div>
      )}

      {view === "edit" && (
        <div className="py-6">
          <EditProfile></EditProfile>
        </div>
      )}
    </Main>
  );
};

export default Profile;
