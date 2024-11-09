// Define rank thresholds
export const ranks = [
  { name: "Nybegynner", minXP: 0, maxXP: 50 },
  { name: "Pøbel", minXP: 50, maxXP: 150 },
  { name: "Svindler", minXP: 150, maxXP: 400 },
  { name: "Gangster", minXP: 400, maxXP: 1000 },
  { name: "Torpedo", minXP: 1000, maxXP: 2500 },
  { name: "Leiemorder", minXP: 2500, maxXP: 5000 },
  { name: "Løytnant", minXP: 5000, maxXP: 10000 },
  { name: "Kaptein", minXP: 10000, maxXP: 20000 },
  { name: "Don", minXP: 20000, maxXP: 40000 },
  { name: "Gudfar", minXP: 40000, maxXP: Infinity },
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
