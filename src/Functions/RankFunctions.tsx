// Define rank thresholds
const ranks = [
  { name: "Street Hustler", minXP: 0, maxXP: 500 },
  { name: "Thug", minXP: 500, maxXP: 1500 },
  { name: "Enforcer", minXP: 1500, maxXP: 4000 },
  { name: "Capo", minXP: 4000, maxXP: 10000 },
  { name: "Lieutenant", minXP: 10000, maxXP: 25000 },
  { name: "Underboss", minXP: 25000, maxXP: 50000 },
  { name: "Consigliere", minXP: 50000, maxXP: 100000 },
  { name: "Boss", minXP: 100000, maxXP: 200000 },
  { name: "Don", minXP: 200000, maxXP: 400000 },
  { name: "Godfather", minXP: 400000, maxXP: Infinity }, // Highest rank
];

// Function to get the current rank based on XP
export const getCurrentRank = (xp: number) => {
  const rank = ranks.find((rank) => xp >= rank.minXP && xp < rank.maxXP);
  return rank ? rank.name : "Unknown Rank";
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
