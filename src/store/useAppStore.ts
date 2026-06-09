import { create } from 'zustand';
import type { IconItem, Project, SpriteConfig } from '../types';

const STORAGE_KEY = 'css-sprite-tool-data';

interface PersistedData {
  projects: Project[];
  icons: IconItem[];
}

interface AppState {
  projects: Project[];
  icons: IconItem[];
  activeProjectId: string | null;
  generatorIcons: IconItem[];
  spriteConfig: SpriteConfig;

  addIcons: (icons: IconItem[]) => void;
  removeIcon: (id: string) => void;
  clearGeneratorIcons: () => void;
  setGeneratorIcons: (icons: IconItem[]) => void;
  updateSpriteConfig: (config: Partial<SpriteConfig>) => void;

  createProject: (name: string, description?: string) => Project;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  setActiveProject: (id: string | null) => void;
  addIconsToProject: (projectId: string, iconIds: string[]) => void;
  removeIconFromProject: (projectId: string, iconId: string) => void;

  getIconsInProject: (projectId: string) => IconItem[];
}

function loadFromStorage(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        projects: parsed.projects || [],
        icons: parsed.icons || [],
      };
    }
  } catch {
    /* ignore */
  }
  return { projects: [], icons: [] };
}

function saveToStorage(projects: Project[], icons: IconItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, icons }));
  } catch {
    /* ignore */
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const initialData = loadFromStorage();

export const useAppStore = create<AppState>((set, get) => ({
  projects: initialData.projects,
  icons: initialData.icons,
  activeProjectId: initialData.projects[0]?.id || null,
  generatorIcons: [],
  spriteConfig: {
    columns: 5,
    spacing: 4,
    bgColor: 'transparent',
    classPrefix: 'sprite',
    retina: false,
  },

  addIcons: (icons) => {
    set((state) => {
      const newIcons = [...state.icons, ...icons];
      saveToStorage(state.projects, newIcons);
      return { icons: newIcons };
    });
  },

  removeIcon: (id) => {
    set((state) => {
      const newIcons = state.icons.filter((i) => i.id !== id);
      const newProjects = state.projects.map((p) => ({
        ...p,
        iconIds: p.iconIds.filter((iid) => iid !== id),
      }));
      saveToStorage(newProjects, newIcons);
      return { icons: newIcons, projects: newProjects };
    });
  },

  clearGeneratorIcons: () => set({ generatorIcons: [] }),

  setGeneratorIcons: (icons) => set({ generatorIcons: icons }),

  updateSpriteConfig: (config) =>
    set((state) => ({
      spriteConfig: { ...state.spriteConfig, ...config },
    })),

  createProject: (name, description = '') => {
    const project: Project = {
      id: generateId(),
      name,
      description,
      iconIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => {
      const newProjects = [...state.projects, project];
      saveToStorage(newProjects, state.icons);
      return { projects: newProjects, activeProjectId: project.id };
    });
    return project;
  },

  deleteProject: (id) => {
    set((state) => {
      const project = state.projects.find((p) => p.id === id);
      const projectIconIds = new Set(project?.iconIds || []);
      const newProjects = state.projects.filter((p) => p.id !== id);
      const remainingProjectIconIds = new Set(
        newProjects.flatMap((p) => p.iconIds)
      );
      const orphanedIds = [...projectIconIds].filter(
        (iid) => !remainingProjectIconIds.has(iid)
      );
      const newIcons = state.icons.filter((i) => !orphanedIds.includes(i.id));
      saveToStorage(newProjects, newIcons);
      return {
        projects: newProjects,
        icons: newIcons,
        activeProjectId:
          state.activeProjectId === id
            ? newProjects[0]?.id || null
            : state.activeProjectId,
      };
    });
  },

  renameProject: (id, name) => {
    set((state) => {
      const newProjects = state.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      );
      saveToStorage(newProjects, state.icons);
      return { projects: newProjects };
    });
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  addIconsToProject: (projectId, iconIds) => {
    set((state) => {
      const newProjects = state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              iconIds: [...new Set([...p.iconIds, ...iconIds])],
              updatedAt: Date.now(),
            }
          : p
      );
      saveToStorage(newProjects, state.icons);
      return { projects: newProjects };
    });
  },

  removeIconFromProject: (projectId, iconId) => {
    set((state) => {
      const newProjects = state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              iconIds: p.iconIds.filter((id) => id !== iconId),
              updatedAt: Date.now(),
            }
          : p
      );
      saveToStorage(newProjects, state.icons);
      return { projects: newProjects };
    });
  },

  getIconsInProject: (projectId) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return [];
    const iconMap = new Map(state.icons.map((i) => [i.id, i]));
    return project.iconIds
      .map((id) => iconMap.get(id))
      .filter((i): i is IconItem => !!i);
  },
}));

export { generateId };
