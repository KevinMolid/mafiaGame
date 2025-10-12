// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import InfoBox from "../../components/InfoBox";
import FactoryCard from "../../components/FactoryCard";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";

// Images
import Weapons from "./WeaponFactory";
import Bullets from "./Bullets";
import Narcotics from "./Narcotics";

// React
import React, { useEffect, useState, ReactNode } from "react";

// Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  DocumentSnapshot,
  updateDoc,
  deleteField,
  runTransaction,
  increment,
} from "firebase/firestore";
import firebaseConfig from "../../firebaseConfig";

import { useCharacter } from "../../CharacterContext";

type ActiveFactory = {
  type: "weapons" | "bullets" | "narco";
  purchasedAt?: any;
};

type FactoryKind = ActiveFactory["type"];
type FactoryDef = {
  type: FactoryKind;
  title: string;
  description: React.ReactNode;
  price: number;
  img: string;
};

const FACTORIES: FactoryDef[] = [
  {
    type: "weapons",
    title: "Våpenfabrikk",
    description: <>Produser våpen som kan brukes til å angripe spillere.</>,
    price: 100_000,
    img: "/images/illustrations/guns4.png",
  },
  {
    type: "bullets",
    title: "Kulefabrikk",
    description: (
      <>Produser ammunisjon som kan brukes til å angripe spillere.</>
    ),
    price: 1_000_000,
    img: "/images/illustrations/bullets2.png",
  },
  {
    type: "narco",
    title: "Narkolab",
    description: <>Produser narkotika som kan gi ulike fordeler i spillet.</>,
    price: 1_000_000,
    img: "/images/illustrations/narco2.png",
  },
];

const FACTORY_PRICE = Object.fromEntries(
  FACTORIES.map((f) => [f.type, f.price])
) as Record<FactoryKind, number>;

const FACTORY_TITLE = Object.fromEntries(
  FACTORIES.map((f) => [f.type, f.title])
) as Record<FactoryKind, string>;

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
  const [showSellConfirm, setShowSellConfirm] = useState(false);

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
    if (processing || !userCharacter?.id) return;
    setProcessing(true);

    const price = FACTORY_PRICE[type];
    const charRef = doc(db, "Characters", userCharacter!.id);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(charRef);
        if (!snap.exists()) {
          setMessageType("failure");
          setMessage("Spilleren ble ikke funnet.");
        }

        const data = snap.data() as any;
        const currentMoney: number = data?.stats?.money ?? 0;

        // already has a factory
        if (data?.activeFactory) {
          throw new Error("Du har allerede en aktiv fabrikk.");
        }

        if (currentMoney < price) {
          throw new Error("Du har ikke nok penger til å kjøpe fabrikken.");
        }

        tx.update(charRef, {
          "stats.money": increment(-price),
          activeFactory: {
            type,
            purchasedAt: serverTimestamp(),
          } as ActiveFactory,
        });
      });

      setActiveFactory({
        type,
        purchasedAt: serverTimestamp(),
      } as ActiveFactory);
      setMessageType("success");
      setMessage(
        <p>
          Fabrikken ble kjøpt for{" "}
          <strong>
            <i className="fa-solid fa-dollar-sign"></i>{" "}
            {price.toLocaleString("NO-nb")}
          </strong>
          .
        </p>
      );
    } catch (error: any) {
      console.error("Failed to buy factory:", error);
      setMessageType("failure");
      setMessage(
        <p>{error?.message ?? "Noe gikk galt ved kjøpet. Prøv igjen."}</p>
      );
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
      setShowSellConfirm(false);
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
          <ConfirmDialog
            open={showSellConfirm}
            title="Legge ned fabrikken?"
            description={
              <div className="text-sm">
                <p className="pb-2">
                  Dette vil slette all produksjon og fremgang i denne fabrikken.
                </p>
                <p className="pb-2">Denne handlingen kan ikke angres!</p>
              </div>
            }
            confirmLabel="Ja, legg ned"
            cancelLabel="Avbryt"
            loading={loading}
            onConfirm={sellFactory}
            onCancel={() => setShowSellConfirm(false)}
          />
          <div className="flex justify-between items-baseline">
            <H1>
              {activeFactory ? FACTORY_TITLE[activeFactory.type] : "Produksjon"}
            </H1>
            {activeFactory && (
              <Button
                style="text"
                size="text"
                onClick={() => {
                  if (processing) return;
                  setShowSellConfirm(true);
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
                {FACTORIES.map((f) => (
                  <FactoryCard
                    key={f.type}
                    title={f.title}
                    description={f.description}
                    price={f.price}
                    img={f.img}
                    onBuy={() => buyFactory(f.type)}
                  />
                ))}
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
