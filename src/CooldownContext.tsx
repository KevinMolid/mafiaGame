import { createContext, useContext, useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

type CooldownContextType = {
  cooldowns: { [key: string]: number };
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
  const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});
  const db = getFirestore();

  // Effect to handle the countdown timer for each cooldown
  useEffect(() => {
    const activeCooldowns = Object.keys(cooldowns).filter(
      (type) => cooldowns[type] > 0
    );

    if (activeCooldowns.length > 0) {
      const timer = setInterval(() => {
        setCooldowns((prevCooldowns) => {
          const updatedCooldowns = { ...prevCooldowns };
          activeCooldowns.forEach((type) => {
            if (updatedCooldowns[type] > 0) {
              updatedCooldowns[type] -= 1;
            }
          });
          return updatedCooldowns;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldowns]);

  // Start cooldown for a specified duration
  const startCooldown = async (
    duration: number,
    cooldownType: string,
    activeCharacter: string
  ) => {
    setCooldowns((prevCooldowns) => ({
      ...prevCooldowns,
      [cooldownType]: duration,
    }));

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

        setCooldowns((prevCooldowns) => ({
          ...prevCooldowns,
          [cooldownType]: remainingCooldown > 0 ? remainingCooldown : 0,
        }));
      }
    }
  };

  return (
    <CooldownContext.Provider
      value={{ cooldowns, startCooldown, fetchCooldown }}
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
