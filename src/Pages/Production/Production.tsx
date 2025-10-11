import React, { useEffect, useState, ReactNode } from "react";
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import InfoBox from "../../components/InfoBox";
import FactoryCard from "../../components/FactoryCard";
import Button from "../../components/Button";

import Weapons from "./Weapons";
import Bullets from "./Bullets";
import Narcotics from "./Narcotics";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  DocumentData,
  DocumentSnapshot,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import firebaseConfig from "../../firebaseConfig";

import { useCharacter } from "../../CharacterContext";

type ActiveFactory = {
  type: "weapons" | "bullets" | "narco";
  purchasedAt?: any;
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const Production: React.FC = () => {
  const { userCharacter } = useCharacter();
  const [activeFactory, setActiveFactory] = useState<ActiveFactory | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Global message (like StreetCrime)
  const [message, setMessage] = useState<ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("info");

  // Subscribe to the current character doc
  useEffect(() => {
    setLoading(true);
    const charDocRef = doc(db, "Characters", userCharacter!.id);
    const unsub = onSnapshot(
      charDocRef,
      (snap: DocumentSnapshot<DocumentData>) => {
        const data = snap.exists() ? (snap.data() as DocumentData) : {};
        setActiveFactory((data && (data as any).activeFactory) || null);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to read character document:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [userCharacter]);

  // Purchase factory
  async function buyFactory(type: ActiveFactory["type"]) {
    if (processing) return;
    setProcessing(true);

    const charDocRef = doc(db, "Characters", userCharacter!.id);
    const payload: ActiveFactory = {
      type,
      purchasedAt: serverTimestamp(),
    };

    try {
      await setDoc(charDocRef, { activeFactory: payload }, { merge: true });
      setActiveFactory(payload); // optimistic; snapshot will correct
      setMessageType("success");
      setMessage(<>Fabrikken ble kjøpt.</>);
    } catch (err) {
      console.error("Failed to buy factory:", err);
      setMessageType("failure");
      setMessage(<>Noe gikk galt ved kjøpet. Prøv igjen.</>);
    } finally {
      setProcessing(false);
    }
  }

  async function sellFactory() {
    if (processing) return;
    setProcessing(true);

    const userDocRef = doc(db, "Characters", userCharacter!.id);
    try {
      // delete the field
      await updateDoc(userDocRef, { activeFactory: deleteField() });
      // onSnapshot will update local state
      setMessageType("success");
      setMessage(<>Fabrikken ble lagt ned.</>);
    } catch (err) {
      console.error("Failed to stop factory:", err);
      setMessageType("failure");
      setMessage(<>Noe gikk galt. Prøv igjen.</>);
    } finally {
      setProcessing(false);
    }
  }

  function renderActiveFactoryComponent(type: ActiveFactory["type"] | null) {
    switch (type) {
      case "weapons":
        return (
          <Weapons
            onSell={sellFactory}
            onSetMessage={setMessage}
            onSetMessageType={setMessageType}
          />
        );
      case "bullets":
        return (
          <Bullets
            onSell={sellFactory}
            // If Bullets will also need messages, pass these too:
            // @ts-expect-error if Bullets doesn't accept them yet
            onSetMessage={setMessage}
            onSetMessageType={setMessageType}
          />
        );
      case "narco":
        return (
          <Narcotics
            onSell={sellFactory}
            // If Narcotics will also need messages, pass these too:
            // @ts-expect-error if Narcotics doesn't accept them yet
            onSetMessage={setMessage}
            onSetMessageType={setMessageType}
          />
        );
      default:
        return null;
    }
  }

  return (
    <Main>
      {loading ? (
        <div>Laster...</div>
      ) : (
        <>
          <div className="flex justify-between items-baseline">
            <H1>
              {activeFactory
                ? activeFactory.type === "weapons"
                  ? "Våpenfabrikk"
                  : activeFactory.type === "bullets"
                  ? "Kulefabrikk"
                  : activeFactory.type === "narco"
                  ? "Narkolab"
                  : ""
                : "Produksjon"}
            </H1>
            {activeFactory && (
              <Button
                style="text"
                size="text"
                onClick={() => {
                  if (processing) return;
                  if (
                    confirm("Er du sikker på at du vil selge denne fabrikken?")
                  )
                    sellFactory();
                }}
                disabled={processing}
              >
                {processing ? "Behandler..." : "Legg ned fabrikken"}
              </Button>
            )}
          </div>
          {message ? <InfoBox type={messageType}>{message}</InfoBox> : null}

          {/* No active factory — show buy cards */}
          {!activeFactory ? (
            <div>
              <div className="mb-4">
                <p className="mb-2">
                  Her kan du bygge fabrikker for å produsere våpen, kuler og
                  narkotika.
                </p>
                <p className="mb-2">
                  Du kan kun ha én aktiv fabrikk om gangen per karakter.
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <FactoryCard
                  title="Våpenfabrikk"
                  description={
                    <>Produser våpen som kan brukes til å angripe spillere.</>
                  }
                  price={1000000}
                  img="/public/images/illustrations/guns4.png"
                  onBuy={() => buyFactory("weapons")}
                />

                <FactoryCard
                  title="Kulefabrikk"
                  description={
                    <>
                      Produser ammunisjon som kan brukes til å angripe spillere.
                    </>
                  }
                  price={1000000}
                  img="/public/images/illustrations/bullets2.png"
                  onBuy={() => buyFactory("bullets")}
                />

                <FactoryCard
                  title="Narkolab"
                  description={
                    <>Produser narkotika som kan gi ulike fordeler i spillet.</>
                  }
                  price={1000000}
                  img="/public/images/illustrations/narco2.png"
                  onBuy={() => buyFactory("narco")}
                />
              </div>
            </div>
          ) : (
            <div>{renderActiveFactoryComponent(activeFactory.type)}</div>
          )}
        </>
      )}
    </Main>
  );
};

export default Production;
