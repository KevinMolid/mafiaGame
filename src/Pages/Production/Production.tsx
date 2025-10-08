import React, { useEffect, useState } from "react";
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FactoryCard from "../../components/FactoryCard";

import guns from "/images/illustrations/guns3.png";
import bullets from "/images/illustrations/bullets.png";
import narco from "/images/illustrations/narco.png";

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

  // Subscribe to the current character doc
  useEffect(() => {
    setLoading(true);
    const charDocRef = doc(db, "Characters", userCharacter!.id);
    const unsub = onSnapshot(
      charDocRef,
      (snap: DocumentSnapshot<DocumentData>) => {
        const data = snap.exists() ? (snap.data() as DocumentData) : {};
        setActiveFactory((data && data.activeFactory) || null);
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
    } catch (err) {
      console.error("Failed to buy factory:", err);
      alert("Noe gikk galt ved kjøpet. Prøv igjen.");
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
    } catch (err) {
      console.error("Failed to stop factory:", err);
      alert("Noe gikk galt. Prøv igjen.");
    } finally {
      setProcessing(false);
    }
  }

  function renderActiveFactoryComponent(type: ActiveFactory["type"] | null) {
    switch (type) {
      case "weapons":
        return <Weapons onSell={sellFactory} />;
      case "bullets":
        return <Bullets onSell={sellFactory} />;
      case "narco":
        return <Narcotics onSell={sellFactory} />;
      default:
        return null;
    }
  }

  return (
    <Main>
      <div className="mb-6">
        <H1>Produksjon</H1>
        <p className="mb-2">
          Her kan du bygge fabrikker for å produsere våpen, kuler og narkotika.
        </p>
        <p className="mb-2">
          Du kan kun ha én aktiv fabrikk om gangen per karakter.
        </p>
      </div>

      {loading ? (
        <div>Laster...</div>
      ) : (
        <>
          {/* No active factory — show buy cards */}
          {!activeFactory ? (
            <div className="flex gap-2 flex-wrap">
              <Card
                size="w-60 h-80"
                imageSrc={guns}
                title="Våpenfabrikk"
                description="Produser våpen som kan benyttes til å angripe andre spillere."
                footer={
                  <Button
                    onClick={() => buyFactory("weapons")}
                    disabled={processing}
                  >
                    {processing ? "Behandler..." : "Bygg Våpenfabrikk"}
                  </Button>
                }
              />

              <Card
                size="w-60 h-80"
                imageSrc={bullets}
                title="Kulefabrikk"
                description="Produser ammunisjon som kan benyttes til å angripe andre spillere."
                footer={
                  <Button
                    onClick={() => buyFactory("bullets")}
                    disabled={processing}
                  >
                    {processing ? "Behandler..." : "Bygg Kulefabrikk"}
                  </Button>
                }
              />

              <Card
                size="w-60 h-80"
                imageSrc={narco}
                title="Narkolab"
                description="Produser narkotika som kan gi forskjellige fordeler i spillet."
                footer={
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => buyFactory("narco")}
                      disabled={processing}
                    >
                      {processing ? "Behandler..." : "Bygg Narkolab"}
                    </Button>
                  </div>
                }
              />

              <FactoryCard
                title="Våpenfabrikk"
                description={
                  <>
                    Produser våpen som kan benyttes til å angripe andre
                    spillere.
                  </>
                }
                price={1000000}
                imgSrc={
                  "https://purepng.com/public/uploads/large/purepng.com-assault-rifle-clipartassaultriflemetalgunwararmyclipart-4015201806205f2mw.png"
                }
                onBuy={() => buyFactory("weapons")}
              />

              <FactoryCard
                title="Kulefabrikk"
                description={
                  <>
                    Produser ammunisjon som kan benyttes til å angripe andre
                    spillere.
                  </>
                }
                price={1000000}
                imgSrc={bullets}
                onBuy={() => buyFactory("weapons")}
              />

              <FactoryCard
                title="Narkolab"
                description={
                  <>
                    Produser narkotika som kan gi forskjellige fordeler i
                    spillet.
                  </>
                }
                price={1000000}
                imgSrc={narco}
                onBuy={() => buyFactory("weapons")}
              />
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
