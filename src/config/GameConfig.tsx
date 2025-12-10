// ACTIVITIES

// Optional types

export type CrimeConfigEntry = {
  id: string;
  name: string;
  role: "fast-xp" | "fast-money" | "balanced" | "laidback";
  cooldownKey: string;
  cooldownSeconds: number;
  successRate: number;
  xpReward: number;
  minMoneyReward: number;
  maxMoneyReward: number;
};

export type ActivityConfig = {
  crime: {
    // cooldownSeconds?: number; // you can also centralize cooldowns later if you want
    crimes: CrimeConfigEntry[];
  };
  gta: {
    street: {
      successChance: number;
      xpReward: number;
    };
    player: {
      baseSuccessChance: number; // 50% before security
      xpReward: number;
    };
  };
  robbery: {
    randomFindChance: number;
    specificFindChance: number;
    successChance: number;
    xpReward: number;
  };
};

export const activityConfig: ActivityConfig = {
  crime: {
    crimes: [
      // FAST XP – kort CD, høyest XP/min
      {
        id: "Lommetyveri",
        name: "Lommetyveri",
        role: "fast-xp",
        cooldownKey: "crimeLommetyveri",
        cooldownSeconds: 60,
        successRate: 0.75,
        xpReward: 8, // 8 xp/min
        minMoneyReward: 1_000,
        maxMoneyReward: 4_000, // 2500/min
      },

      // FAST PENGER – kort CD, høyest penger/min
      {
        id: "Herverk",
        name: "Herverk",
        role: "fast-money",
        cooldownKey: "crimeHerverk",
        cooldownSeconds: 60,
        successRate: 0.75,
        xpReward: 4, // 4 xp/min
        minMoneyReward: 2_000,
        maxMoneyReward: 8_000, // 5000/min
      },

      // BALANSERT – litt lengre CD, ok XP og penger
      {
        id: "verdisaker",
        name: "Stjel verdisaker",
        role: "balanced",
        cooldownKey: "crimeVerdisaker",
        cooldownSeconds: 180, // 3 min
        successRate: 0.75,
        xpReward: 15, // 5 xp/min
        minMoneyReward: 6_000,
        maxMoneyReward: 12_000, // 3000/min
      },

      // SUPER LAIDBACK – veldig lang CD, store enkeltgevinster men minst per minutt
      {
        id: "butikk",
        name: "Ran butikk",
        role: "laidback",
        cooldownKey: "crimeButikk",
        cooldownSeconds: 600, // 10 min
        successRate: 0.75,
        xpReward: 30, // 3 xp/min
        minMoneyReward: 10_000,
        maxMoneyReward: 26_000, // 1800/min
      },
    ],
  },

  gta: {
    street: {
      successChance: 0.75, // previously SUCCESS_CHANCE_STREET
      xpReward: 7, // rewardXp(userCharacter, 10)
    },
    player: {
      baseSuccessChance: 0.5, // 50% base before security
      xpReward: 10, // rewardXp(userCharacter, 15)
    },
  },

  robbery: {
    randomFindChance: 0.9, // 90% to find random target
    specificFindChance: 0.5, // 50% to find specific target
    successChance: 0.75, // 75% success once found
    xpReward: 6, // rewardXp(userCharacter, 10)
  },
};

// RANKS

export type RankId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type UnlockKey =
  | "crime.basic"
  | "car-theft"
  | "messages"
  | "robbery"
  | "forum"
  | "family-join"
  | "heist"
  | "big-heist"
  | "murder"
  | "advanced-heist"
  | "family-create"
  | "epic-heist"
  | "epic-gear";

export type RankDefinition = {
  id: RankId;
  name: string;
  minXp: number;
  maxXp: number;
  unlockKeys: UnlockKey[];
};

// All unlock keys → human readable labels (Norwegian)
export const unlockLabels: Record<UnlockKey, string> = {
  "crime.basic": "Kan utføre Kriminalitet",

  "car-theft": "Kan utføre Biltyveri",
  messages: "Kan sende meldinger",

  robbery: "Kan utføre Ran",
  forum: "Kan skrive i Forum",

  "family-join": "Kan bli medlem av Familie",
  heist: "Kan starte/delta i Brekk",

  "big-heist": "Kan delta i Stort Brekk",

  murder: "Kan utføre Drap",

  "advanced-heist": "Kan starte/delta i Avansert Brekk",

  "family-create": "Kan opprette Familie",

  "epic-heist": "Kan starte/delta i Episk Brekk",

  "epic-gear": "Kan bruke Episk utstyr",
};

// 🔢 XP thresholds moved from RankFunctions.tsx,
// but using your new unlock mapping.
export const rankDefinitions: RankDefinition[] = [
  {
    id: 1,
    name: "Nybegynner",
    minXp: 0,
    maxXp: 60,
    unlockKeys: ["crime.basic"],
  },
  {
    id: 2,
    name: "Pøbel",
    minXp: 60,
    maxXp: 260,
    unlockKeys: ["car-theft", "messages"],
  },
  {
    id: 3,
    name: "Svindler",
    minXp: 260,
    maxXp: 760,
    unlockKeys: ["robbery", "forum"],
  },
  {
    id: 4,
    name: "Gangster",
    minXp: 760,
    maxXp: 1760,
    unlockKeys: ["family-join", "heist"],
  },
  {
    id: 5,
    name: "Torpedo",
    minXp: 1760,
    maxXp: 3760,
    unlockKeys: ["big-heist"],
  },
  {
    id: 6,
    name: "Leiemorder",
    minXp: 3760,
    maxXp: 7760,
    unlockKeys: ["murder"],
  },
  {
    id: 7,
    name: "Løytnant",
    minXp: 7760,
    maxXp: 15760,
    unlockKeys: ["advanced-heist"],
  },
  {
    id: 8,
    name: "Kaptein",
    minXp: 15760,
    maxXp: 31760,
    unlockKeys: ["family-create"],
  },
  {
    id: 9,
    name: "Gudfar",
    minXp: 31760,
    maxXp: 63760,
    unlockKeys: ["epic-heist"],
  },
  {
    id: 10,
    name: "Don",
    minXp: 63760,
    maxXp: Infinity,
    unlockKeys: ["epic-gear"],
  },
];

// 💰 Money ranks moved from RankFunctions.tsx
export type MoneyRankDefinition = {
  name: string;
  minAmount: number;
  maxAmount: number;
};

export const moneyRanks: MoneyRankDefinition[] = [
  { name: "Raka fant", minAmount: 0, maxAmount: 9 },
  { name: "Lutfattig", minAmount: 10, maxAmount: 99 },
  { name: "Fattig", minAmount: 100, maxAmount: 999 },
  { name: "Sliter", minAmount: 1000, maxAmount: 9999 },
  { name: "Arbeidsledig", minAmount: 10000, maxAmount: 99999 },
  { name: "Arbeidende", minAmount: 100000, maxAmount: 999999 },
  { name: "Millionær", minAmount: 1000000, maxAmount: 9999999 },
  { name: "Mangemillionær", minAmount: 10000000, maxAmount: 99999999 },
  { name: "Businessmann", minAmount: 100000000, maxAmount: 999999999 },
  { name: "Milliardær", minAmount: 1000000000, maxAmount: 9999999999 },
  { name: "Mangemilliardær", minAmount: 10000000000, maxAmount: 99999999999 },
  { name: "Mogul", minAmount: 100000000000, maxAmount: 999999999999 },
  { name: "Supermogul", minAmount: 1000000000000, maxAmount: Infinity },
];

export type RankRewardConfig = {
  money?: number;
  diamonds?: number;
  unlocks: UnlockKey[];
};

// 🎁 Central place for rank rewards (money + diamonds + unlocks)
export function getRankReward(rank: number): RankRewardConfig | null {
  const def = rankDefinitions.find((r) => r.id === rank);
  if (!def) return null;

  const base: RankRewardConfig = {
    unlocks: def.unlockKeys,
  };

  // 💰💎 Money/diamond rewards per rank
  switch (rank) {
    case 1: // Nybegynner
      base.money = 0;
      base.diamonds = 0;
      break;
    case 2: // Pøbel
      base.money = 10_000;
      base.diamonds = 0;
      break;
    case 3: // Svindler
      base.money = 30_000;
      base.diamonds = 0;
      break;
    case 4: // Gangster
      base.money = 100_000;
      base.diamonds = 1;
      break;
    case 5: // Torpedo
      base.money = 250_000;
      base.diamonds = 3;
      break;
    case 6: // Leiemorder
      base.money = 1_000_000;
      base.diamonds = 5;
      break;
    case 7: // Løytnant
      base.money = 2_500_000;
      base.diamonds = 10;
      break;
    case 8: // Kaptein
      base.money = 10_000_000;
      base.diamonds = 20;
      break;
    case 9: // Gudfar
      base.money = 25_000_000;
      base.diamonds = 50;
      break;
    case 10: // Don
      base.money = 50_000_000;
      base.diamonds = 100;
      break;
  }

  return base;
}

// Helper for UI: combine unlock labels into one text line
export function getRankPerksText(rankId: RankId): string {
  const def = rankDefinitions.find((r) => r.id === rankId);
  if (!def) return "";
  return def.unlockKeys.map((key) => unlockLabels[key] ?? key).join(", ");
}

// Helper for logic: get rank definition from XP
export function getRankDefinitionForXp(xp: number): RankDefinition {
  // pick the highest rank where xp >= minXp
  const sorted = [...rankDefinitions].sort((a, b) => b.minXp - a.minXp);
  const match = sorted.find((r) => xp >= r.minXp);
  return match ?? rankDefinitions[0];
}
