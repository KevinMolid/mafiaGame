// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import Box from "../../components/Box";
import JailBox from "../../components/JailBox";

// Functions
import {
  rewardXp,
  increaseHeat,
  arrest,
} from "../../Functions/RewardFunctions";

// Context
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";
import { useCharacter } from "../../CharacterContext";
import { Target } from "../../Interfaces/CharacterTypes";

// React
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Firebase
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Robbery = () => {
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const [helpActive, setHelpActive] = useState(false);
  const [targetCharacter, setTargetCharacter] = useState<string>("");
  const [isTargetRandom, setIsTargetRandom] = useState<boolean>(true);

  const { userData } = useAuth();
  const { userCharacter } = useCharacter();
  const { cooldowns, startCooldown } = useCooldown();
  const cooldownTime = 150;
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
  }, [userData, navigate, cooldowns]);

  if (!userCharacter) {
    return;
  }

  // Update target from input
  const handleTargetCharacterInputChange = (e: any) => {
    setTargetCharacter(e.target.value);
  };

  // Helper functions
  const displayMessage = (
    text: string,
    type: "success" | "failure" | "warning" | "info"
  ) => {
    setMessageType(type);
    setMessage(text);
  };

  const findRandomTarget = async (): Promise<
    (Target & { id: string }) | null
  > => {
    const charactersSnapshot = await getDocs(
      query(
        collection(db, "Characters"),
        where("location", "==", userCharacter.location)
      )
    );

    const potentialTargets = charactersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Target) }))
      .filter((char) => char.id !== userCharacter.id);

    if (potentialTargets.length === 0) {
      displayMessage("Det er ingen å rane i denne byen.", "failure");
      return null;
    }

    return potentialTargets[
      Math.floor(Math.random() * potentialTargets.length)
    ];
  };

  const findSpecificTarget = async (
    username: string
  ): Promise<(Target & { id: string }) | null> => {
    const targetSnapshot = await getDocs(
      query(
        collection(db, "Characters"),
        where("username_lowercase", "==", username.toLowerCase())
      )
    );

    if (targetSnapshot.empty) {
      displayMessage("Spilleren finnes ikke.", "warning");
      return null;
    }

    const target = {
      id: targetSnapshot.docs[0].id,
      ...(targetSnapshot.docs[0].data() as Target),
    };
    if (target.id === userCharacter.id) {
      displayMessage("Du kan ikke rane deg selv.", "failure");
      return null;
    }
    return target;
  };

  const handleRobberySuccess = async (target: Target & { id: string }) => {
    if (target.stats.money < 100) {
      displayMessage(
        `Du prøvde å rane ${target.username}, men fant ingen ting å stjele.`,
        "failure"
      );
      return;
    }

    const stealPercentage = Math.random() * (0.5 - 0.1) + 0.1;
    const stolenAmount = Math.floor(target.stats.money * stealPercentage);

    await updateDoc(doc(db, "Characters", target.id), {
      "stats.money": target.stats.money - stolenAmount,
    });
    await updateDoc(doc(db, "Characters", userCharacter.id), {
      "stats.money": userCharacter.stats.money + stolenAmount,
    });

    await addDoc(collection(db, "Characters", target.id, "alerts"), {
      type: "robbery",
      timestamp: serverTimestamp(),
      amountLost: stolenAmount,
      robberName: userCharacter.username,
      robberId: userCharacter.id,
      read: false,
    });

    rewardXp(userCharacter, 10);
    displayMessage(
      `Du ranet ${target.username} for $${stolenAmount.toLocaleString()}.`,
      "success"
    );
  };

  const handleRobberyFailure = async (target: Target) => {
    displayMessage(
      `Du prøvde å rane ${target.username}, men feilet. Bedre lykke neste gang!`,
      "failure"
    );

    if (
      userCharacter.stats.heat >= 50 ||
      Math.random() * 100 < userCharacter.stats.heat
    ) {
      arrest(userCharacter);
      displayMessage("Ranforsøket feilet, og du ble arrestert!", "failure");
    }
  };

  // Rob player
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!userCharacter || !userCharacter.id) {
      displayMessage("Spilleren ble ikke lastet.", "failure");
      return;
    }

    if (cooldowns["robbery"] > 0) {
      displayMessage("Du må vente før du kan utføre et nytt ran.", "warning");
      return;
    }

    if (!isTargetRandom && !targetCharacter) {
      displayMessage(
        "Du må angi et mål for å rane en bestemt spiller.",
        "warning"
      );
      return;
    }

    try {
      const target = isTargetRandom
        ? await findRandomTarget()
        : await findSpecificTarget(targetCharacter);

      if (!target) return;

      const foundPlayer = !isTargetRandom
        ? Math.random() <= 0.5 // 50% to find player
        : Math.random() <= 0.9; // 90% to find random
      if (!foundPlayer) {
        displayMessage(
          !isTargetRandom
            ? `Du fant ikke ${target.username}.`
            : "Du fant ingen å rane.",
          "failure"
        );
        increaseHeat(userCharacter, userCharacter.id, 1);
        startCooldown(cooldownTime, "robbery", userCharacter.id);
        return;
      }

      const success = Math.random() <= 0.75;
      if (success) {
        await handleRobberySuccess(target);
      } else {
        await handleRobberyFailure(target);
      }

      increaseHeat(userCharacter, userCharacter.id, 1);
      startCooldown(cooldownTime, "robbery", userCharacter.id);
    } catch (error) {
      console.error(error);
      displayMessage(
        "Det oppstod en feil under ranet. Prøv igjen senere.",
        "failure"
      );
    }
  };

  if (userCharacter?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main>
      <div className="flex items-baseline justify-between gap-4">
        <H1>Ran spiller</H1>
        {helpActive ? (
          <Button
            size="small"
            style="helpActive"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        ) : (
          <Button
            size="small"
            style="help"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        )}
      </div>

      <p className="mb-4">Her kan du rane andre spillere for penger.</p>

      {/* Info box */}
      {helpActive && (
        <div className="mb-4">
          <Box type="help">
            <H3>Rane en tilfeldig spiller</H3>
            <p>90% sjanse for å finne en tilfeldig spiller</p>
            <p className="mb-4">
              75% sjanse for å stjele 10-50% av spillerens utsetående penger
            </p>
            <H3>Rane en bestemt spiller</H3>
            <p>
              50% sjanse for å finne spilleren dersom vedkommende er i samme by
            </p>
            <p>
              75% sjanse for å stjele 10-50% av spillerens utsetående penger
            </p>
          </Box>
        </div>
      )}

      {cooldowns["robbery"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">
            {cooldowns["robbery"]}
          </span>{" "}
          sekunder før du kan rane en spiller.
        </p>
      )}

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2" action="">
        <H2>Hvem vil du rane?</H2>
        <ul className="flex gap-2 flex-wrap mb-4">
          <li
            className={
              "border px-4 py-2 flex-grow text-center cursor-pointer max-w-64 " +
              (isTargetRandom
                ? "bg-neutral-900 border-neutral-600"
                : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
            }
            onClick={() => setIsTargetRandom(true)}
          >
            <p className={isTargetRandom ? "text-white" : ""}>
              Tilfeldig spiller
            </p>
          </li>
          <li
            className={
              "border px-4 py-2 flex-grow text-center cursor-pointer max-w-64 " +
              (isTargetRandom
                ? "bg-neutral-800 hover:bg-neutral-700 border-transparent"
                : "bg-neutral-900 border-neutral-600")
            }
            onClick={() => setIsTargetRandom(false)}
          >
            <p className={isTargetRandom ? "" : "text-white"}>
              Bestemt spiller
            </p>
          </li>
        </ul>

        {!isTargetRandom && (
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            placeholder="Brukernavn"
            value={targetCharacter}
            onChange={handleTargetCharacterInputChange}
          />
        )}

        <div>
          <Button type="submit">Utfør ran</Button>
        </div>
      </form>
    </Main>
  );
};

export default Robbery;
