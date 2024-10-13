import { createContext, useContext, useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

type CooldownContextType = {
  cooldownTime: number;
  startCooldown: (duration: number, activeCharacter: string) => void;
  fetchCooldown: (activeCharacter: string) => void;
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

      // Cleanup the interval on unmount or when cooldownTime reaches 0
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  // Start cooldown for a specified duration
  const startCooldown = async (duration: number, activeCharacter: string) => {
    setCooldownTime(duration);

    const timestamp = new Date().getTime(); // Current time in milliseconds
    await updateDoc(doc(db, "Characters", activeCharacter), {
      lastCrimeTimestamp: timestamp,
    });
  };

  // Fetch cooldown time from the database
  const fetchCooldown = async (activeCharacter: string) => {
    const characterRef = doc(db, "Characters", activeCharacter);
    const characterSnap = await getDoc(characterRef);

    if (characterSnap.exists()) {
      const characterData = characterSnap.data();
      const lastCrimeTimestamp = characterData.lastCrimeTimestamp;

      if (lastCrimeTimestamp) {
        const currentTime = new Date().getTime();
        const elapsedTime = Math.floor(
          (currentTime - lastCrimeTimestamp) / 1000
        ); // in seconds
        const remainingCooldown = 90 - elapsedTime;

        if (remainingCooldown > 0) {
          setCooldownTime(remainingCooldown);
        } else {
          setCooldownTime(0); // No cooldown
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
