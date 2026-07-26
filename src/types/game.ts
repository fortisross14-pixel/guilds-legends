export type GuildTier = 'Local' | 'Regional' | 'National' | 'Continental' | 'World';
export type HeroClass = 'Guardian' | 'Duelist' | 'Ranger' | 'Rogue' | 'Cleric' | 'Mage' | 'Berserker' | 'Bard';
export type MissionRisk = 'Low' | 'Medium' | 'High' | 'Deadly';
export type MissionStatus = 'available' | 'active' | 'resolved';
export type Screen = 'command' | 'heroes' | 'missions' | 'world' | 'rankings' | 'chronicle' | 'headquarters';
export type GoalKind = 'tutorial' | 'season' | 'legacy';

export interface Attributes {
  might: number;
  finesse: number;
  mind: number;
  spirit: number;
  presence: number;
  endurance: number;
}

export interface Hero {
  id: string;
  name: string;
  heroClass: HeroClass;
  age: number;
  power: number;
  potential: number;
  form: number;
  fatigue: number;
  health: number;
  renown: number;
  loyalty: number;
  trait: string;
  flaw: string;
  dream: string;
  status: 'Available' | 'On mission' | 'Injured' | 'Retired' | 'Dead';
  appointment?: string;
  attributes: Attributes;
  career: {
    missions: number;
    wins: number;
    titles: number;
    fame: number;
    injuries: string[];
  };
  history: { date: string; text: string }[];
}

export interface Mission {
  id: string;
  title: string;
  family: string;
  issuer: string;
  description: string;
  risk: MissionRisk;
  duration: number;
  rewardGold: number;
  rewardFame: number;
  recommended: HeroClass[];
  secondaryGoal: string;
  status: MissionStatus;
  assignedHeroIds: string[];
  remaining: number;
  tutorialTag?: string;
}

export interface RivalGuild {
  id: string;
  name: string;
  ethos: string;
  fame: number;
  power: number;
  titles: number;
  treasury: number;
  trend: number;
}

export interface Facility {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  description: string;
}

export interface Goal {
  id: string;
  kind: GoalKind;
  title: string;
  instruction: string;
  progress: number;
  target: number;
  reward: string;
  completed: boolean;
  screen: Screen;
  priority: number;
}

export interface ChronicleEntry {
  id: string;
  date: string;
  category: 'Guild' | 'Hero' | 'Mission' | 'Tournament' | 'World';
  title: string;
  text: string;
  importance: number;
}

export interface GameState {
  version: number;
  seed: number;
  year: number;
  month: number;
  tier: GuildTier;
  guildName: string;
  founder: string;
  gold: number;
  fame: number;
  legacy: number;
  localRank: number;
  screen: Screen;
  selectedHeroId: string;
  selectedMissionId: string;
  heroes: Hero[];
  missions: Mission[];
  rivals: RivalGuild[];
  facilities: Facility[];
  goals: Goal[];
  chronicle: ChronicleEntry[];
  headlines: string[];
  alignment?: 'Town Council' | 'Border Baron' | 'Independent';
  notifications: string[];
}
