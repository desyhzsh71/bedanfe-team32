'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export interface Project {
  id: string;
  name: string;
  organizationId?: string;
  organizationName?: string;
  description?: string;
  status?: string;
}

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  isLoading: boolean;
  clearProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('activeProject');
      if (stored) {
        const parsed: Project = JSON.parse(stored);

        if (parsed?.id && parsed?.name) {
          setActiveProjectState(parsed);
        } else {
          localStorage.removeItem('activeProject');
        }
      }
    } catch (err) {
      console.error('Failed to load activeProject:', err);
      localStorage.removeItem('activeProject');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setActiveProject = useCallback((project: Project | null) => {
    setActiveProjectState(project);

    if (project) {
      localStorage.setItem('activeProject', JSON.stringify(project));
      console.log('Active project set:', project.name);
    } else {
      localStorage.removeItem('activeProject');
    }
  }, []);

  const clearProject = useCallback(() => {
    setActiveProjectState(null);
    localStorage.removeItem('activeProject');
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        setActiveProject,
        clearProject,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}