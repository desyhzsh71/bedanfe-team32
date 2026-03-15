'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, FolderKanban, Building2, Search } from 'lucide-react';
import { useProject, type Project } from '../lib/ProjectContext';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';

export default function ProjectSelector() {
  const { activeProject, setActiveProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const allProjects: Project[] = [];

      // Fetch personal projects
      try {
        const personalRes = await api.getPersonalProjects(token);
        console.log('📱 Personal projects response:', personalRes);
        
        if (personalRes.success && personalRes.data) {
          // Handle different response structures
          let personalProjects = [];
          
          if (Array.isArray(personalRes.data)) {
            personalProjects = personalRes.data;
          } else if (personalRes.data.projects && Array.isArray(personalRes.data.projects)) {
            personalProjects = personalRes.data.projects;
          } else if (personalRes.data.data && Array.isArray(personalRes.data.data)) {
            personalProjects = personalRes.data.data;
          }
          
          const mapped = personalProjects.map((p: any) => ({
            id: p.id,
            name: p.name,
            organizationId: undefined,
            organizationName: 'Personal',
            description: p.description,
            status: p.status
          } as Project));
          
          console.log(`✅ Loaded ${mapped.length} personal projects`);
          allProjects.push(...mapped);
        }
      } catch (error) {
        console.error('❌ Failed to fetch personal projects:', error);
      }

      // Fetch organizational projects
      try {
        const orgsRes = await api.getOrganizations(token);
        console.log('🏢 Organizations response:', orgsRes);
        
        if (orgsRes.success && orgsRes.data) {
          // Handle different response structures
          let organizations = [];
          
          if (Array.isArray(orgsRes.data)) {
            organizations = orgsRes.data;
          } else if (orgsRes.data.organizations && Array.isArray(orgsRes.data.organizations)) {
            organizations = orgsRes.data.organizations;
          } else if (orgsRes.data.data && Array.isArray(orgsRes.data.data)) {
            organizations = orgsRes.data.data;
          }
          
          console.log(`Found ${organizations.length} organizations`);
          
          // Fetch projects for each organization
          for (const org of organizations) {
            try {
              const orgProjectsRes = await api.getProjectsByOrganization(org.id, token);
              console.log(`📁 Projects for org ${org.name}:`, orgProjectsRes);
              
              if (orgProjectsRes.success && orgProjectsRes.data) {
                let orgProjects = [];
                
                if (Array.isArray(orgProjectsRes.data)) {
                  orgProjects = orgProjectsRes.data;
                } else if (orgProjectsRes.data.projects && Array.isArray(orgProjectsRes.data.projects)) {
                  orgProjects = orgProjectsRes.data.projects;
                } else if (orgProjectsRes.data.data && Array.isArray(orgProjectsRes.data.data)) {
                  orgProjects = orgProjectsRes.data.data;
                }
                
                const mapped = orgProjects.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  organizationId: org.id,
                  organizationName: org.name,
                  description: p.description,
                  status: p.status
                } as Project));
                
                console.log(`✅ Loaded ${mapped.length} projects from ${org.name}`);
                allProjects.push(...mapped);
              }
            } catch (error) {
              console.error(`❌ Failed to fetch projects for org ${org.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch organizations:', error);
      }

      console.log(`🎉 Total projects loaded: ${allProjects.length}`);
      setProjects(allProjects);
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProject = (project: Project) => {
    console.log('🔄 Selecting project:', project);
    setActiveProject(project);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all min-w-70"
      >
        <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          {activeProject?.organizationName === 'Personal' ? (
            <FolderKanban size={18} className="text-white" />
          ) : (
            <Building2 size={18} className="text-white" />
          )}
        </div>
        
        <div className="flex-1 text-left">
          {activeProject ? (
            <>
              <div className="text-xs text-gray-500">
                {activeProject.organizationName || 'Organization'}
              </div>
              <div className="font-medium text-gray-900 truncate">
                {activeProject.name}
              </div>
            </>
          ) : (
            <div className="text-gray-400">Select a project...</div>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col" style={{ maxHeight: '400px' }}>
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Project List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading projects...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p className="font-semibold mb-2">⚠️ Error</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchProjects}
                  className="mt-4 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                >
                  Retry
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {searchQuery ? 'No projects found' : 'No projects available'}
                <div className="mt-2 text-xs">
                  ({projects.length} total projects loaded)
                </div>
              </div>
            ) : (
              <div className="py-2">
                {filteredProjects.map(project => {
                  const isPersonal = project.organizationName === 'Personal' || !project.organizationId;
                  
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition
                        ${activeProject?.id === project.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${isPersonal
                          ? 'bg-linear-to-br from-blue-400 to-blue-600' 
                          : 'bg-linear-to-br from-teal-400 to-teal-600'
                        }
                      `}>
                        {isPersonal ? (
                          <FolderKanban size={16} className="text-white" />
                        ) : (
                          <Building2 size={16} className="text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {project.organizationName || 'Personal'} • {project.id.slice(0, 8)}
                        </div>
                      </div>

                      {activeProject?.id === project.id && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              {filteredProjects.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}