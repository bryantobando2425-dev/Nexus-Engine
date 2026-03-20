export type PlayMode = 'HUMANO' | 'DIOS';

export type EmotionalClimate =
  | 'sereno'
  | 'ansioso'
  | 'de_duelo'
  | 'euforico'
  | 'entumecido'
  | 'desesperado'
  | 'esperanzador'
  | 'traumatizado';

export interface Descriptor {
  value: string;
  tooltip?: string;
}

export interface CharacterDescriptors {
  estadoFisico: string;
  condicionMental: string;
  combate: string;
  habilidadesSociales: string;
  conocimiento: string;
  condicionSocial: string;
  reputacionLocal: string;
  relacionesActivas: string[];
}

export interface NarrativeTurn {
  id: string;
  role: 'user' | 'narrator' | 'dream' | 'perspective';
  text: string;
  imageUrl?: string;
  imagePrompt?: string;
  ingameDate?: string;
  mood?: string;
  eventType?: string;
  legacyWeight?: number;
  timestamp: number;
}

export interface WorldState {
  currentLocation: { name: string; description: string };
  season: string;
  weather: string;
  timeOfDay: string;
  ingameYear: number;
  ingameDate: string;
  ingameAge: number;
}

export interface ActiveRun {
  runId: string;
  gameId: string;
  playMode: PlayMode;
  character: Record<string, any>;
  eraConfig: Record<string, any>;
  worldState: WorldState;
  descriptors: CharacterDescriptors;
  narrativeHistory: NarrativeTurn[];
  innerVoiceLog: string[];
  emotionalClimate: EmotionalClimate;
  suggestedActions: string[];
  secretsQueue: string[];
  consequenceQueue: Array<{ description: string; scheduledTurn: number; sourceAction: string }>;
  turnCount: number;
}

export interface GameConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: 'playable' | 'locked';
  backgroundGradient: string;
  accentColor: string;
  narrativePersonality: string;
  defaultVoice: string;
  allowsGodMode: boolean;
}

export interface WorldBuilderConfig {
  id: string;
  name: string;
  eraLabel: string;
  yearRange: [number, number];
  geography: string;
  techLevel: string;
  politicalSystem: string;
  religion: string;
  economy: string;
  languages: string;
  fauna: string;
  specialRules: {
    magic: boolean;
    magicType?: string;
    customDiseases?: string[];
    customRules?: string[];
  };
  dangerLevel: number;
  predefinedEvents: Array<{ year: number; description: string }>;
  freeNotes: string;
  createdAt: number;
}

export interface AppSettings {
  explicitMode: boolean;
  showNpcDescriptors: boolean;
  otherPerspectives: boolean;
  defaultVoice: string;
  textSize: 'sm' | 'md' | 'lg';
  imageGenEnabled: boolean;
}
