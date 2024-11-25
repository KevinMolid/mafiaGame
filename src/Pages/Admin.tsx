// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import CharacterList from "../components/CharacterList";
import Button from "../components/Button";

import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useState } from "react";

// Firebase setup
const db = getFirestore();

const Admin = () => {
  const { userData } = useAuth();
  const { userCharacter } = useCharacter();
  const [loading, setLoading] = useState(false);

  const handleResetGame = async () => {
    setLoading(true);

    try {
      // Get all character documents
      const characterCollectionRef = collection(db, "Characters");
      const characterDocs = await getDocs(characterCollectionRef);

      // Iterate through each character document to reset data
      for (const charDoc of characterDocs.docs) {
        const charDocRef = doc(db, "Characters", charDoc.id);

        // Update the character document with reset data
        await setDoc(
          charDocRef,
          {
            currentRank: 1,
            lastCrimeTimestamp: null,
            lastGtaTimestamp: null,
            lastRobberyTimestamp: null,
            stats: {
              xp: 0,
              hp: 100,
              money: 1000,
              heat: 0,
              bank: 0,
              protection: 0,
            },
            cars: null,
            parkingFacilities: null,
            familyId: null,
            familyName: null,
            inJail: null,
            jailReleaseTime: null,
            activeFamilyApplication: null,
          },
          { merge: true }
        );

        // Delete all alerts in the subcollection 'alerts'
        const alertsCollectionRef = collection(
          db,
          "Characters",
          charDoc.id,
          "alerts"
        );
        const alertDocs = await getDocs(alertsCollectionRef);
        for (const alertDoc of alertDocs.docs) {
          const alertDocRef = doc(
            db,
            "Characters",
            charDoc.id,
            "alerts",
            alertDoc.id
          );
          await deleteDoc(alertDocRef);
        }
      }

      // Delete all documents in the Bounty collection
      const bountyCollectionRef = collection(db, "Bounty");
      const bountyDocs = await getDocs(bountyCollectionRef);
      for (const bountyDoc of bountyDocs.docs) {
        const bountyDocRef = doc(db, "Bounty", bountyDoc.id);
        await deleteDoc(bountyDocRef);
      }

      // Delete all documents in the Families collection including subcollections
      const familiesCollectionRef = collection(db, "Families");
      const familiesDocs = await getDocs(familiesCollectionRef);
      for (const familyDoc of familiesDocs.docs) {
        console.log(familyDoc.id);
        const familyDocRef = doc(db, "Families", familyDoc.id);

        // Delete all documents in the 'Applications' subcollection
        const applicationsCollectionRef = collection(
          db,
          "Families",
          familyDoc.id,
          "Applications"
        );
        const applicationDocs = await getDocs(applicationsCollectionRef);
        for (const applicationDoc of applicationDocs.docs) {
          const applicationDocRef = doc(
            db,
            "Families",
            familyDoc.id,
            "Applications",
            applicationDoc.id
          );
          await deleteDoc(applicationDocRef);
        }

        // Delete the family document after its subcollections are cleared
        await deleteDoc(familyDocRef);
      }

      // Delete all documents in the GameEvents collection
      const gameEventsCollectionRef = collection(db, "GameEvents");
      const gameEventsDocs = await getDocs(gameEventsCollectionRef);
      for (const gameEventDoc of gameEventsDocs.docs) {
        const gameEventDocRef = doc(db, "GameEvents", gameEventDoc.id);
        await deleteDoc(gameEventDocRef);
      }

      // Add a new GameReset event to the GameEvents collection
      const newGameEvent = {
        eventType: "GameReset",
        resetById: userCharacter?.id || "",
        resetByName: userCharacter?.username || "",
        timestamp: serverTimestamp(),
      };
      await setDoc(doc(db, "GameEvents", "reset-" + Date.now()), newGameEvent);

      alert("Spillet er nå tilbakestilt!");
    } catch (error) {
      console.error("Feil ved tilbakestilling av spillet:", error);
      alert("En feil oppsto under tilbakestilling av spillet.");
    } finally {
      setLoading(false);
    }
  };

  if (userData && userData.type !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <Main>
      <H1>
        <i className="text-yellow-400 fa-solid fa-gears"></i> Kontrollpanel
      </H1>
      <div className="border p-4 border-neutral-600 mb-4 gap-2">
        <H2>Handlinger</H2>
        <H3>Egen konto</H3>
        <div className="flex flex-wrap gap-2 mb-4">
          <Link to="/velgspiller">
            <div className="flex gap-2 items-center bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg w-[max-content]">
              <i className="fa-solid fa-user-group"></i>
              <p>Velg spillkarakter</p>
            </div>
          </Link>
          <Link to="/nyspiller">
            <div className="flex gap-2 items-center bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg w-[max-content]">
              <i className="fa-solid fa-user-plus"></i>
              <p>Ny spillkarakter</p>
            </div>
          </Link>
        </div>

        <H3>Globalt</H3>
        <Button style="danger" onClick={handleResetGame} disabled={loading}>
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin"></i>
          ) : (
            <i className="fa-solid fa-arrow-rotate-left"></i>
          )}{" "}
          Resett spillet
        </Button>
      </div>

      <H2>Spillere</H2>
      <CharacterList type="admin"></CharacterList>
    </Main>
  );
};

export default Admin;
