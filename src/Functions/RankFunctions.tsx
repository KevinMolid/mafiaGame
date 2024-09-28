export const getRank = (xp: number) => {
  if (xp >= 400000) return "Godfather";
  if (xp >= 200000) return "Don";
  if (xp >= 100000) return "Boss";
  if (xp >= 50000) return "Consigliere";
  if (xp >= 25000) return "Underboss";
  if (xp >= 10000) return "Lieutenant";
  if (xp >= 4000) return "Capo";
  if (xp >= 1500) return "Enforcer";
  if (xp >= 500) return "Thug";
  return "Street Hustler";
};
