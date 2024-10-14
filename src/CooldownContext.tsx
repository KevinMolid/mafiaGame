import { createContext, useContext, useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

type CooldownContextType = {
  cooldownTime: number;
  startCooldown: (
    duration: number,
    cooldownType: string,
    activeCharacter: string
  ) => void;
  fetchCooldown: (
    cooldownType: string,
    duration: number,
    activeCharacter: string
  ) => void;
};

const CooldownContext = createContext<CooldownContextType | undefined>(
  undefined
);

export const CooldownProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const db = getFirestore();

  // Effect to handle the countdown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  // Start cooldown for a specified duration
  const startCooldown = async (
    duration: number,
    cooldownType: string,
    activeCharacter: string
  ) => {
    setCooldownTime(duration);

    const timestamp = new Date().getTime();
    const field = `last${
      cooldownType.charAt(0).toUpperCase() + cooldownType.slice(1)
    }Timestamp`;

    await updateDoc(doc(db, "Characters", activeCharacter), {
      [field]: timestamp,
    });
  };

  // Fetch cooldown time from the database
  const fetchCooldown = async (
    cooldownType: string,
    duration: number,
    activeCharacter: string
  ) => {
    const characterRef = doc(db, "Characters", activeCharacter);
    const characterSnap = await getDoc(characterRef);

    if (characterSnap.exists()) {
      const characterData = characterSnap.data();
      const field = `last${
        cooldownType.charAt(0).toUpperCase() + cooldownType.slice(1)
      }Timestamp`;
      const lastTimestamp = characterData[field];

      if (lastTimestamp) {
        const currentTime = new Date().getTime();
        const elapsedTime = Math.floor((currentTime - lastTimestamp) / 1000); // in seconds
        const remainingCooldown = duration - elapsedTime;

        if (remainingCooldown > 0) {
          setCooldownTime(remainingCooldown);
        } else {
          setCooldownTime(0);
        }
      }
    }
  };

  return (
    <CooldownContext.Provider
      value={{ cooldownTime, startCooldown, fetchCooldown }}
    >
      {children}
    </CooldownContext.Provider>
  );
};

export const useCooldown = () => {
  const context = useContext(CooldownContext);
  if (!context) {
    throw new Error("useCooldown must be used within a CooldownProvider");
  }
  return context;
};
