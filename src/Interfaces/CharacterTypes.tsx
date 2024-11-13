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

export interface Character {
  id: string;
  location: string;
  stats: Stats;
  createdAt: Timestamp | Date;
  diedAt?: Timestamp | null;
  img: string;
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
  familyId?: string | null;
  familyName?: string | null;
  activeFamilyApplication?: {
    familyId: string;
    familyName: string;
    applicationId: string;
    applicationText: string;
    appliedAt: Timestamp;
  } | null;
  inJail?: boolean | null;
  jailReleaseTime?: any;
}

export interface Target {
  location: string;
  stats: Stats;
  createdAt: Timestamp;
  diedAt?: Timestamp | null;
  img: string;
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
  familyId?: string | null;
  familyName?: string | null;
  activeFamilyApplication?: {
    familyId: string;
    familyName: string;
    applicationId: string;
    applicationText: string;
    appliedAt: Timestamp;
  } | null;
  inJail?: boolean | null;
  jailReleaseTime?: any;
}
