// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H3 from "../../components/Typography/H3";
import H4 from "../../components/Typography/H4";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Button from "../../components/Button";
import Box from "../../components/Box";

import { compactMmSs } from "../../Functions/TimeFunctions";

import { useEffect, useMemo, useState } from "react";

import { useCharacter } from "../../CharacterContext";
import { useCooldown } from "../../CooldownContext";

import {
  getFirestore,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore();

// Adjust this to balance your economy
const COST_PER_HP = 5000; // kr per HP

const Hospital = () => {
  const { userCharacter } = useCharacter();
  const { jailRemainingSeconds } = useCooldown();
  const [helpActive, setHelpActive] = useState<boolean>(false);

  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "failure" | "important" | "warning"
  >("info");

  const [secondsInHospital, setSecondsInHospital] = useState(0);
  const [healedHp, setHealedHp] = useState(0);

  // Render nothing if character is null
  if (!userCharacter) {
    return null;
  }

  const currentDebt = userCharacter.hospitalDebt ?? 0;
  const currentMoney = userCharacter.stats.money ?? 0;

  // HP + cap
  const maxHp = 100;
  const currentHp = userCharacter.stats.hp ?? 0;
  const remainingHpCapacity = Math.max(0, maxHp - currentHp);

  // This is the actual HP the player can get right now
  const effectiveHealedHp = Math.min(healedHp, remainingHpCapacity);

  // If in jail, show JailBox
  if (userCharacter.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  // Helper to turn Firestore Timestamp / Date / string into Date
  const hospitalCheckinDate: Date | null = useMemo(() => {
    const t = (userCharacter as any).hospitalCheckinTime;
    if (!t) return null;

    // Firestore Timestamp
    if (t.seconds && typeof t.seconds === "number") {
      return new Date(t.seconds * 1000);
    }

    // Already a Date
    if (t instanceof Date) return t;

    // ISO string or similar
    if (typeof t === "string" || typeof t === "number") {
      return new Date(t);
    }

    return null;
  }, [userCharacter]);

  // Update secondsInHospital and healedHp while in hospital
  useEffect(() => {
    if (!userCharacter.inHospital || !hospitalCheckinDate) {
      setSecondsInHospital(0);
      setHealedHp(0);
      return;
    }

    const update = () => {
      const now = Date.now();
      const diffSeconds = Math.floor(
        (now - hospitalCheckinDate.getTime()) / 1000
      );
      setSecondsInHospital(diffSeconds);

      // 1 hp per 15 minutes = 900 seconds
      const intervals = Math.floor(diffSeconds / 900);
      setHealedHp(intervals); // theoretical healed HP from time
    };

    update();
    const interval = setInterval(update, 1000); // update every second
    return () => clearInterval(interval);
  }, [userCharacter.inHospital, hospitalCheckinDate]);

  // Cost is based on effective (capped) heal, not raw healedHp
  const costForCurrentStay = effectiveHealedHp * COST_PER_HP;

  const handleCheckIn = async () => {
    if (userCharacter.inHospital) {
      setMessageType("info");
      setMessage("Du er allerede innlagt på sykehus.");
      return;
    }

    // 🔴 NEW: block if full health
    if (remainingHpCapacity <= 0) {
      setMessageType("info");
      setMessage("Du har fullt liv og kan derfor ikke sjekke inn på sykehus.");
      return;
    }

    if (currentDebt > 0) {
      setMessageType("warning");
      setMessage(
        <>
          Du har en ubetalt sykehusregning på{" "}
          <strong>
            <i className="fa-solid fa-dollar-sign" />{" "}
            {currentDebt.toLocaleString("nb-NO")}
          </strong>
          . Betal regningen før du sjekker inn igjen.
        </>
      );
      return;
    }

    const characterRef = doc(db, "Characters", userCharacter.id);
    const batch = writeBatch(db);

    batch.update(characterRef, {
      inHospital: true,
      hospitalCheckinTime: serverTimestamp(),
    });

    await batch.commit();

    setMessageType("success");
    setMessage("Du sjekket inn på sykehuset.");
  };

  const handleCheckOut = async () => {
    if (!userCharacter.inHospital) {
      setMessageType("info");
      setMessage("Du er ikke innlagt på sykehus.");
      return;
    }

    const effectiveHeal = effectiveHealedHp; // already capped to max HP

    const characterRef = doc(db, "Characters", userCharacter.id);
    const batch = writeBatch(db);

    batch.update(characterRef, {
      "stats.hp": currentHp + effectiveHeal,
      inHospital: false,
      hospitalCheckinTime: null,
      hospitalDebt: currentDebt + costForCurrentStay,
    });

    await batch.commit();

    if (effectiveHeal > 0) {
      setMessageType("success");
      setMessage(
        <>
          Du ble skrevet ut og fikk <strong>{effectiveHeal} liv</strong>. Ny
          sykehusregning:{" "}
          <strong>
            <i className="fa-solid fa-dollar-sign" />{" "}
            {(currentDebt + costForCurrentStay).toLocaleString("nb-NO")}
          </strong>
          .
        </>
      );
    } else {
      setMessageType("info");
      setMessage(
        "Du ble skrevet ut uten behandling. Ingen ny kostnad ble lagt til."
      );
    }
  };

  const handlePayDebt = async () => {
    const debt = currentDebt;
    const money = currentMoney;

    if (debt <= 0) {
      setMessageType("info");
      setMessage("Du har ingen ubetalt sykehusregning.");
      return;
    }

    if (money <= 0) {
      setMessageType("failure");
      setMessage("Du har ikke penger til å betale sykehusregningen.");
      return;
    }

    const payment = Math.min(money, debt);
    const newMoney = money - payment;
    const newDebt = debt - payment;

    const characterRef = doc(db, "Characters", userCharacter.id);
    const batch = writeBatch(db);

    batch.update(characterRef, {
      "stats.money": newMoney,
      hospitalDebt: newDebt,
    });

    await batch.commit();

    if (newDebt === 0) {
      setMessageType("success");
      setMessage(
        <>
          Du betalte hele sykehusregningen på{" "}
          <strong>
            <i className="fa-solid fa-dollar-sign" />{" "}
            {debt.toLocaleString("nb-NO")}
          </strong>
          .
        </>
      );
    } else {
      setMessageType("info");
      setMessage(
        <>
          Du betalte{" "}
          <strong>
            <i className="fa-solid fa-dollar-sign" />{" "}
            {payment.toLocaleString("nb-NO")}
          </strong>{" "}
          på sykehusregningen. Gjenstående beløp:{" "}
          <strong>
            <i className="fa-solid fa-dollar-sign" />{" "}
            {newDebt.toLocaleString("nb-NO")}
          </strong>
          .
        </>
      );
    }
  };

  return (
    <Main img="">
      <div className="flex items-baseline justify-between gap-4">
        <H1>Sykehus</H1>
        {helpActive ? (
          <Button
            size="small-square"
            style="helpActive"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        ) : (
          <Button
            size="small-square"
            style="help"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        )}
      </div>

      <p className="mb-2">
        Her kan du sjekke inn på sykehus for å fylle opp liv.
      </p>

      {/* Info box */}
      {helpActive && (
        <div className="mb-4">
          <Box type="help" className="text-sm flex gap-x-8 flex-wrap">
            <article>
              <H4>Tid og kostnad</H4>
              <p className="mb-2">
                Sykehuset fyller opp{" "}
                <strong className="text-neutral-200">1 HP/15 min</strong> og
                koster{" "}
                <strong className="text-neutral-200">
                  <i className="fa-solid fa-dollar-sign"></i>{" "}
                  {COST_PER_HP.toLocaleString("nb-NO")}/HP
                </strong>
                . Du kan ikke få mer enn maks HP (<strong>{maxHp}</strong>).
              </p>
              <H4>Manglende betaling</H4>
              <p className="mb-2">
                Dersom du ikke har råd til å betale regningen etter endt
                sykehusopphold vil du stå til gjeld for sykehuset. Så lenge du
                står til gjeld, kan du ikke legges inn på sykehus før du har
                betalt regningen.
              </p>
              <p className="mb-2">
                For hver dag som går med gjeld til sykehuset vil det bli lagt
                til et straffegebyr på 1%.
              </p>
              <H4>Sikkerhet</H4>
              <p className="mb-2">
                Du kan ikke ble angrepet så lenge du er på sykehus.
              </p>
            </article>
          </Box>
        </div>
      )}

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      {/* Debt info section */}
      {currentDebt > 0 && (
        <Box>
          <H3>Ubetalt regning</H3>
          <p className="mb-2">
            Beløp:{" "}
            <strong className="text-neutral-200">
              <i className="fa-solid fa-dollar-sign" />{" "}
              {currentDebt.toLocaleString("nb-NO")}
            </strong>
          </p>
          <p className="mb-2">
            Du kan ikke sjekke inn på sykehuset igjen før regningen er betalt.
          </p>

          <Button onClick={handlePayDebt}>Betal regning</Button>
        </Box>
      )}

      {/* Hospital stay section */}
      {userCharacter.inHospital ? (
        <>
          <div className="mt-4 flex gap-x-8 gap-y-2 flex-wrap mb-4">
            <p>
              Status:{" "}
              <strong className="text-neutral-200 block text-xl">
                Innlagt
              </strong>
            </p>

            <p>
              Tid innlagt:{" "}
              <strong className="text-neutral-200 block text-xl">
                {compactMmSs(secondsInHospital)}
              </strong>
            </p>

            <p className="mb-1">
              Liv (kan hentes nå):{" "}
              <strong className="text-neutral-200 block text-xl">
                {effectiveHealedHp} hp
              </strong>
            </p>

            <p className="mb-1">
              Kostnad:{" "}
              <strong className="text-neutral-200 block text-xl">
                <i className="fa-solid fa-dollar-sign"></i>{" "}
                {costForCurrentStay.toLocaleString("nb-NO")}
              </strong>
            </p>
          </div>
          <Button onClick={handleCheckOut}>Sjekk ut</Button>
        </>
      ) : (
        currentDebt <= 0 && (
          <div className="mt-4">
            {remainingHpCapacity <= 0 && (
              <p className="mb-3">
                <strong className="text-neutral-200">Du har fullt liv</strong>{" "}
                og kan derfor ikke sjekke inn på sykehus.
              </p>
            )}
            {remainingHpCapacity > 0 && (
              <p className="mb-3">
                Du er ikke innlagt på sykehus. Sjekk inn for å begynne å
                regenerere liv.
              </p>
            )}

            {/* 🔴 Only show button if not full HP */}
            {remainingHpCapacity > 0 && (
              <Button onClick={handleCheckIn}>Sjekk inn</Button>
            )}
          </div>
        )
      )}
    </Main>
  );
};

export default Hospital;
