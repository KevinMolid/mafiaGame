export type FamilyMember = {
  id: string;
  name: string;
  rank: string;
};

export type FamilyEvent = {
  characterId: string;
  characterName: string;
  timestamp: Date;
  type: string;
};

export type FamilyData = {
  id: string;
  name: string;
  leaderName: string;
  leaderId: string;
  events?: FamilyEvent[];
  members: FamilyMember[];
  createdAt: Date;
  rules: string;
  wealth: number;
};
