import { create } from 'zustand';

type ProjectStore = {
  activeProjectId: string | null;
  activeProjectName?: string;
  setActiveProject: (id: string, name?: string) => void;
  clearActiveProject: () => void;
};

export const useProjectStore = create<ProjectStore>((set) => ({
  activeProjectId: null,
  activeProjectName: undefined,
  setActiveProject: (id, name) =>
    set({ activeProjectId: id, activeProjectName: name }),
  clearActiveProject: () =>
    set({ activeProjectId: null, activeProjectName: undefined }),
}));