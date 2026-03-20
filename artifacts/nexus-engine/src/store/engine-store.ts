import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlayMode,
  ActiveRun,
  EmotionalClimate,
  NarrativeTurn,
  AppSettings,
  WorldBuilderConfig,
} from '../engine/types';

interface EngineState {
  playerId: string | null;
  setPlayerId: (id: string) => void;

  currentGame: string | null;
  setCurrentGame: (gameId: string | null) => void;

  playMode: PlayMode;
  setPlayMode: (mode: PlayMode) => void;

  activeRun: ActiveRun | null;
  setActiveRun: (run: ActiveRun | null) => void;
  updateActiveRun: (partial: Partial<ActiveRun>) => void;

  addNarrativeTurn: (turn: NarrativeTurn) => void;
  updateLastNarrativeTurn: (partial: Partial<NarrativeTurn>) => void;
  addInnerVoice: (thought: string) => void;
  setSuggestedActions: (actions: string[]) => void;
  setEmotionalClimate: (climate: EmotionalClimate) => void;

  pastRuns: Array<{ runId: string; gameId: string; summary?: string; character?: any; eraConfig?: any; endCause?: string; endedAt?: string; turnCount?: number }>;
  addPastRun: (run: EngineState['pastRuns'][number]) => void;

  savedWorlds: WorldBuilderConfig[];
  saveWorld: (world: WorldBuilderConfig) => void;
  deleteWorld: (id: string) => void;

  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      playerId: null,
      setPlayerId: (id) => set({ playerId: id }),

      currentGame: null,
      setCurrentGame: (gameId) => set({ currentGame: gameId }),

      playMode: 'HUMANO',
      setPlayMode: (mode) => set({ playMode: mode }),

      activeRun: null,
      setActiveRun: (run) => set({ activeRun: run }),
      updateActiveRun: (partial) =>
        set((state) => ({
          activeRun: state.activeRun ? { ...state.activeRun, ...partial } : null,
        })),

      addNarrativeTurn: (turn) =>
        set((state) => ({
          activeRun: state.activeRun
            ? {
                ...state.activeRun,
                narrativeHistory: [...state.activeRun.narrativeHistory, turn],
                turnCount: state.activeRun.turnCount + 1,
              }
            : null,
        })),

      updateLastNarrativeTurn: (partial) =>
        set((state) => {
          if (!state.activeRun) return {};
          const history = [...state.activeRun.narrativeHistory];
          if (history.length === 0) return {};
          history[history.length - 1] = { ...history[history.length - 1], ...partial };
          return { activeRun: { ...state.activeRun, narrativeHistory: history } };
        }),

      addInnerVoice: (thought) =>
        set((state) => ({
          activeRun: state.activeRun
            ? {
                ...state.activeRun,
                innerVoiceLog: [...state.activeRun.innerVoiceLog.slice(-9), thought],
              }
            : null,
        })),

      setSuggestedActions: (actions) =>
        set((state) => ({
          activeRun: state.activeRun ? { ...state.activeRun, suggestedActions: actions } : null,
        })),

      setEmotionalClimate: (climate) =>
        set((state) => ({
          activeRun: state.activeRun ? { ...state.activeRun, emotionalClimate: climate } : null,
        })),

      pastRuns: [],
      addPastRun: (run) =>
        set((state) => ({ pastRuns: [run, ...state.pastRuns].slice(0, 50) })),

      savedWorlds: [],
      saveWorld: (world) =>
        set((state) => ({
          savedWorlds: [
            world,
            ...state.savedWorlds.filter((w) => w.id !== world.id),
          ],
        })),
      deleteWorld: (id) =>
        set((state) => ({ savedWorlds: state.savedWorlds.filter((w) => w.id !== id) })),

      settings: {
        explicitMode: false,
        showNpcDescriptors: false,
        otherPerspectives: false,
        defaultVoice: 'third_person',
        textSize: 'md',
        imageGenEnabled: true,
      },
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
    }),
    {
      name: 'nexus-engine-v2',
      partialize: (state) => ({
        playerId: state.playerId,
        currentGame: state.currentGame,
        playMode: state.playMode,
        activeRun: state.activeRun,
        pastRuns: state.pastRuns,
        savedWorlds: state.savedWorlds,
        settings: state.settings,
      }),
    }
  )
);
