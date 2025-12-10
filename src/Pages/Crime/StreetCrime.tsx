// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H4 from "../../components/Typography/H4";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Box from "../../components/Box";

// functions
import { compactMmSs } from "../../Functions/TimeFunctions";
import { arrest } from "../../Functions/RewardFunctions";

import { activityConfig } from "../../config/GameConfig";

// React
import { useState, useEffect, ReactNode } from "react";

// Firebase / routing
import { useNavigate } from "react-router-dom";

// Context
import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";

import { getFirestore, doc, writeBatch } from "firebase/firestore";

const db = getFirestore();

const StreetCrime = () => {
  const { userCharacter } = useCharacter();
  const { jailRemainingSeconds } = useCooldown();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const { cooldowns, startCooldown } = useCooldown();

  const crimes = activityConfig.crime.crimes;

  const [selectedCrime, setSelectedCrime] = useState<string>(
    localStorage.getItem("selectedCrime") || "Lommetyveri"
  );
  const [message, setMessage] = useState<ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");
  const [helpActive, setHelpActive] = useState<boolean>(false);

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
  }, [userData, navigate]);

  // Save selectedCrime to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("selectedCrime", selectedCrime);
  }, [selectedCrime]);

  // Finn konfig for valgt crime
  const selectedCrimeConfig =
    crimes.find((c) => c.name === selectedCrime) ?? crimes[0];

  const cooldownKey = selectedCrimeConfig.cooldownKey || "crime";
  const remainingCooldown = cooldowns[cooldownKey] ?? 0;

  // Function for comitting a crime
  const handleClick = async () => {
    if (!userCharacter || !selectedCrimeConfig) {
      setMessageType("warning");
      setMessage("Du må velge en handling!");
      return;
    }

    // Sjekk cooldown for valgt handling
    if (remainingCooldown > 0) {
      setMessageType("warning");
      setMessage(
        `Du må vente før du kan utføre ${selectedCrimeConfig.name.toLowerCase()}.`
      );
      return;
    }

    const crime = selectedCrimeConfig;
    const characterRef = doc(db, "Characters", userCharacter.id);

    // Determine success/failure
    const success = Math.random() < crime.successRate;

    if (success) {
      // Rewards
      const xpReward = crime.xpReward || 0;
      const moneyReward = Math.floor(
        crime.minMoneyReward +
          Math.random() * (crime.maxMoneyReward - crime.minMoneyReward)
      );

      // Clamp heat to 50 when incrementing
      const newHeat = Math.min(50, (userCharacter.stats.heat || 0) + 1);

      // Commit only the success path writes
      const batch = writeBatch(db);
      batch.update(characterRef, {
        "stats.xp": (userCharacter.stats.xp || 0) + xpReward,
        "stats.money": (userCharacter.stats.money || 0) + moneyReward,
        "stats.heat": newHeat,
      });
      await batch.commit();

      setMessage(
        <>
          Du utførte <strong>{crime.name}</strong>.
          {moneyReward && xpReward ? (
            <>
              {" "}
              Du fikk{" "}
              <strong>
                <i className="fa-solid fa-dollar-sign"></i> {money(moneyReward)}
              </strong>{" "}
              og <strong>{xpReward} XP</strong>!
            </>
          ) : xpReward ? (
            <>
              {" "}
              Du fikk <strong>{xpReward} XP</strong>!
            </>
          ) : (
            <>
              {" "}
              Du fikk{" "}
              <strong>
                <i className="fa-solid fa-dollar-sign"></i> {money(moneyReward)}
              </strong>
              !
            </>
          )}
        </>
      );
      setMessageType("success");
      await startCooldown(cooldownKey);
      return;
    }

    // Failure path
    const newHeat = Math.min(50, (userCharacter.stats.heat || 0) + 1);
    const jailChancePct = newHeat;
    const shouldJail = Math.random() * 100 < jailChancePct;

    if (shouldJail) {
      // IMPORTANT: do NOT commit any pending batch after arrest
      await arrest(userCharacter);
      setMessage("Handlingen feilet, og du ble arrestert!");
      setMessageType("failure");
      await startCooldown(cooldownKey);
      return;
    } else {
      // Failed but not jailed: just add (clamped) heat
      const batch = writeBatch(db);
      batch.update(characterRef, { "stats.heat": newHeat });
      await batch.commit();

      setMessage(
        `Du prøvde å utføre ${crime.name}, men feilet. Bedre lykke neste gang!`
      );
      setMessageType("failure");
      await startCooldown(cooldownKey);
      return;
    }
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  // Helpers
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const money = (n: number) => n.toLocaleString("nb-NO");

  return (
    <Main>
      <div className="flex items-baseline justify-between gap-4">
        <H1>Kriminalitet</H1>
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

      <p className="pb-2">
        Her kan du gjøre kriminelle handlinger for å tjene penger og få
        erfaring.
      </p>

      {/* Info box */}
      {helpActive && (
        <div className="mb-4">
          <Box type="help" className="text-sm flex gap-x-8 flex-wrap">
            <article>
              <H4>Hvordan utføre kriminalitet</H4>
              <p className="mb-2">
                Velg ønsket kriminell handling, og trykk på &quot;Utfør
                handling&quot;. Du kan velge mellom &quot;Lommetyveri&quot;,
                &quot;Herverk&quot;, &quot;Stjel verdisaker&quot; eller
                &quot;Ran butikk&quot;.
              </p>
              <H4>Sjanse for suksess, belønning og cooldown</H4>
              {crimes.map((crime) => (
                <p key={crime.id}>
                  {crime.name}:{" "}
                  <strong className="text-neutral-200">
                    +{crime.xpReward} XP
                  </strong>{" "}
                  og{" "}
                  <strong className="text-neutral-200">
                    {crime.minMoneyReward} - {crime.maxMoneyReward}
                  </strong>
                  {", cooldown: "}
                  <strong className="text-neutral-200">
                    {compactMmSs(crime.cooldownSeconds)}
                  </strong>
                </p>
              ))}
              <p className="mb-4"></p>
            </article>
          </Box>
        </div>
      )}

      {remainingCooldown > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">
            {compactMmSs(remainingCooldown)}
          </span>{" "}
          før du kan gjøre {selectedCrimeConfig.name.toLowerCase()} igjen.
        </p>
      )}

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      <ul className="grid grid-cols-2 gap-2 mb-4 max-w-[500px]">
        {crimes.map((crime) => (
          <li
            key={crime.id}
            className="flex flex-1 flex-grow min-w-[max-content]"
          >
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selectedCrime === crime.name}
              onClick={() => setSelectedCrime(crime.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedCrime(crime.name);
                }
              }}
              className={
                "relative border px-4 py-2 flex-1 flex-grow min-w-[max-content] text-center cursor-pointer " +
                (selectedCrime === crime.name
                  ? "bg-neutral-900 border-neutral-600"
                  : "bg-neutral-800 hover:bg-neutral-900 border-transparent hover:border-neutral-600")
              }
            >
              <p
                className={
                  selectedCrime === crime.name
                    ? "text-sand-400 font-bold"
                    : "font-bold"
                }
              >
                {crime.name}
              </p>

              {/* Chance of success */}
              <p className="text-neutral-200 text-xl font-bold">
                {pct(crime.successRate)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Button onClick={handleClick}>Utfør handling</Button>
    </Main>
  );
};

export default StreetCrime;
