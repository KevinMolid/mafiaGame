import { Timestamp } from "firebase/firestore";

export interface Stats {
  hp: number;
  xp: number;
  heat: number;
  bank: number;
  money: number;
  protection: number;
}

export interface Reputation {
  community: number;
  gangs: number;
  police: number;
  politics: number;
}

export interface CombatLoadout {
  activeAmmo?: {
    docId: string;
    qty: number;
    setAt: Timestamp;
  } | null;
}

export interface ActiveFamilyApplication {
  familyId: string;
  familyName: string;
  applicationId: string;
  applicationText: string;
  appliedAt: Timestamp;
}

export interface racingStats {
  wins: number;
  losses: number;
  rating: number;
}

/**
 * Everything that Character and Target share.
 * (No `id` and no Character-only fields here.)
 */
export interface PersonBase {
  role?: string;
  location: string;
  stats: Stats;
  racingStats?: racingStats;
  createdAt: Timestamp | Date;
  diedAt?: Timestamp | null;
  img: string;
  currentRank: number;
  lastCrimeTimestamp?: Timestamp | null;
  lastRobberyTimestamp?: Timestamp | null;
  lastGtaTimestamp?: Timestamp | null;
  lastActive?: Timestamp | null;
  profileText: string;
  reputation: Reputation;
  status: string;
  uid: string;
  username: string;
  username_lowercase: string;
  parkingFacilities?: any;
  cars?: any;
  airplane?: any;
  familyId?: string | null;
  familyName?: string | null;
  activeFamilyApplication?: ActiveFamilyApplication | null;
  inHospital?: boolean | null;
  hospitalDebt?: number | null;
  inJail?: boolean | null;
  jailReleaseTime?: any;
  conversations?: any;
  friends?: any;
  blacklist?: any;
  equipment?: Record<string, any>;
}

/** Handy helpers */
type WithId<T> = T & { id: string };

/**
 * Character = PersonBase + local doc id + player-only fields.
 */
export type Character = WithId<
  PersonBase & {
    createdAt: Timestamp | Date;
    combatLoadout?: CombatLoadout;
  }
>;

/**
 * Target = PersonBase with Firestore Timestamp for createdAt,
 * no local `id`, and no combatLoadout.
 */
export type Target = Omit<PersonBase, "createdAt"> & {
  createdAt: Timestamp;
};
