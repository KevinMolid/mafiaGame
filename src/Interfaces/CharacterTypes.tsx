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
}

export interface Target {
  location: string;
  stats: Stats;
  createdAt: Date;
  diedAt?: Date | null;
  img: string;
  lastCrimeTimestamp?: Date | null;
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
}
