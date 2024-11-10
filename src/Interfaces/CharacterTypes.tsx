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
  createdAt: Date;
  diedAt?: Date | null;
  img: string;
  lastCrimeTimestamp?: Date | null;
  lastRobberyTimestamp?: Date | null;
  lastGtaTimestamp?: Date | null;
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
    appliedAt: Date;
  } | null;
  inJail?: boolean | null;
  jailReleaseTime?: any;
}

export interface Target {
  location: string;
  stats: Stats;
  createdAt: Date;
  diedAt?: Date | null;
  img: string;
  lastCrimeTimestamp?: Date | null;
  lastRobberyTimestamp?: Date | null;
  lastGtaTimestamp?: Date | null;
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
    appliedAt: Date;
  } | null;
  inJail?: boolean | null;
  jailReleaseTime?: any;
}
