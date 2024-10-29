export type FamilyMember = {
  id: string;
  name: string;
  rank: string;
};

export type FamilyData = {
  id: string;
  name: string;
  leaderName: string;
  leaderId: string;
  members: FamilyMember[];
  createdAt: Date;
  rules: string;
  wealth: number;
};
