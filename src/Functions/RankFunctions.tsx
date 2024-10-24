// Define rank thresholds
const ranks = [
  { name: "Nybegynner", minXP: 0, maxXP: 500 },
  { name: "Pøbel", minXP: 500, maxXP: 1500 },
  { name: "Svindler", minXP: 1500, maxXP: 4000 },
  { name: "Gangster", minXP: 4000, maxXP: 10000 },
  { name: "Torpedo", minXP: 10000, maxXP: 25000 },
  { name: "Leiemorder", minXP: 25000, maxXP: 50000 },
  { name: "Løytnant", minXP: 50000, maxXP: 100000 },
  { name: "Kaptein", minXP: 100000, maxXP: 200000 },
  { name: "Don", minXP: 200000, maxXP: 400000 },
  { name: "Gudfar", minXP: 400000, maxXP: Infinity },
];

// Define rank thresholds
const moneyRanks = [
  { name: "Fattig", minAmount: 0, maxAmount: 999 },
  { name: "Sliter", minAmount: 1000, maxAmount: 9999 },
  { name: "Arbeidsledig", minAmount: 10000, maxAmount: 99999 },
  { name: "Arbeidende", minAmount: 100000, maxAmount: 999999 },
  { name: "Millionær", minAmount: 1000000, maxAmount: 9999999 },
  { name: "Multimillionær", minAmount: 10000000, maxAmount: 99999999 },
  { name: "Mangemillionær", minAmount: 100000000, maxAmount: 999999999 },
  { name: "Milliardær", minAmount: 1000000000, maxAmount: 9999999999 },
  { name: "Multimilliardær", minAmount: 10000000000, maxAmount: 99999999999 },
  { name: "Mogul", minAmount: 100000000000, maxAmount: 999999999999 },
  { name: "Supermogul", minAmount: 1000000000000, maxAmount: Infinity },
];

// Function to get the current rank based on XP
export const getCurrentRank = (xp: number) => {
  const rank = ranks.find((rank) => xp >= rank.minXP && xp < rank.maxXP);
  return rank ? rank.name : "Ukjent rank";
};

// Function to get the current Money rank based on amount
export const getMoneyRank = (amount: number) => {
  const moneyRank = moneyRanks.find(
    (moneyRank) => amount >= moneyRank.minAmount && amount < moneyRank.maxAmount
  );
  return moneyRank ? moneyRank.name : "Ukjent rank";
};

// Function to get progress towards the next rank
export const getRankProgress = (xp: number) => {
  const currentRank = ranks.find((rank) => xp >= rank.minXP && xp < rank.maxXP);

  if (!currentRank) return { progress: 0, minXP: 0, maxXP: 0 };

  const { minXP, maxXP } = currentRank;

  // Calculate how much progress has been made within the current rank
  const progress = ((xp - minXP) / (maxXP - minXP)) * 100;

  return { progress: Math.min(progress, 100), minXP, maxXP };
};
