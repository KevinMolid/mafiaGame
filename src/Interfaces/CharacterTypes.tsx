export interface Stats {
  hp: number;
  xp: number;
  heat: number;
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
  lastCrimeTimestamp?: Date;
  profileText: string;
  reputation: Reputation;
  status: string;
  uid: string;
  username: string;
  parkingFacilities?: any;
  cars?: any;
  familyId?: string;
  familyName?: string;
}
