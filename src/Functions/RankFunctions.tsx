import {
  rankDefinitions,
  moneyRanks as moneyRankDefinitions,
  RankId,
  getRankPerksText,
} from "../config/GameConfig";

export const ranks = rankDefinitions.map((def) => ({
  rank: def.id,
  name: def.name,
  minXP: def.minXp,
  maxXP: def.maxXp,
  perks: getRankPerksText(def.id as RankId),
}));

// Re-export moneyRanks for backwards compatibility
export const moneyRanks = moneyRankDefinitions;

// Function to get the current rank based on XP
export const getCurrentRank = (xp: number, type: string = "text") => {
  const rank = ranks.find((rank) => xp >= rank.minXP && xp < rank.maxXP);
  if (type === "number") {
    return rank ? rank.rank : 0;
  } else {
    return rank ? rank.name : "Ukjent rank";
  }
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
