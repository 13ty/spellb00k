import React, { useState, useEffect } from 'react';
import { projectService } from './services/projectService';
import { chapterService } from './services/chapterService';
import { dbService } from './lib/database';
import type { Project, Chapter } from './types/models';

// Import Components
import TopMenuBar from './components/TopMenuBar';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
// Import Modals
import NewProjectModal from './components/modals/NewProjectModal';
import EditProjectModal from './components/modals/EditProjectModal';
import OptionsModal from './components/modals/OptionsModal'; // Import Options Modal

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true); // Global loading state
  const [error, setError] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]); // Chapters for the current project

  // State for Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null); // Store project being edited
  const [showOptionsModal, setShowOptionsModal] = useState(false); // State for Options Modal


  // --- Effects ---
  useEffect(() => {
    const initializeAndFetchProjects = async () => {
      setLoading(true); // Start loading
      setError(null);
      try {
        // ##@@TAG: DB Initialization
        console.log("Initializing database service...");
        await dbService.initialize();
        console.log("Database initialized.");

        console.log("Attempting to list projects..."); // Added log
        const projectList = await projectService.listProjects();
        console.log(`Found ${projectList.length} projects.`);
        setProjects(projectList);
      } catch (err) {
        console.error("Detailed initialization error:", err); // Log the actual error object
        setError("Failed to load application data.");
      } finally {
        setLoading(false); // Finish loading
      }
    };

    initializeAndFetchProjects();
  }, []);

  // --- Project CRUD Handlers ---

  const handleCreateProject = async (name: string, description: string) => {
    setLoading(true); // Indicate loading state for modal
    setError(null);
    try {
      // ##@@TAG: Create Project
      const newProject = await projectService.createProject(name, description);
      if (newProject) {
        setProjects(prev => [...prev, newProject].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); // Add and sort
        console.log(`Project ${newProject.id} created.`);
        setShowNewProjectModal(false); // Close modal on success
      } else {
         setError("Failed to create project."); // Show error in global area
         // Keep modal open on failure? Or close and show global error? Let's close.
         setShowNewProjectModal(false);
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Failed to create project.");
      setShowNewProjectModal(false); // Close modal on error
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  const handleLoadProject = async (projectId: number) => {
     setLoading(true);
     setError(null);
     setCurrentProject(null); // Clear current project while loading
     setChapters([]); // Clear chapters while loading
     try {
        // ##@@TAG: Load Project
        const project = await projectService.getProjectById(projectId);
        if (project) {
           setCurrentProject(project);
           console.log("Project loaded:", project);
           // ##@@TAG: Fetch Chapters
           const projectChapters = await chapterService.getChaptersByProjectId(projectId);
           setChapters(projectChapters);
           console.log("Chapters loaded:", projectChapters);
        } else {
           setError(`Project with ID ${projectId} not found.`);
        }
     } catch (err) {
        console.error(`Error loading project ${projectId}:`, err);
        setError("Failed to load project.");
     } finally {
        setLoading(false);
     }
  };

  const handleUpdateProject = async (projectId: number, name: string, description: string) => {
     setLoading(true); // Indicate loading state for modal
     setError(null);
     try {
        // ##@@TAG: Update Project
        const updatedProject = await projectService.updateProject(projectId, { name, description });
        if (updatedProject) {
            // Update project in the list
            setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
            // Update current project if it's the one being edited
            if (currentProject?.id === projectId) {
                setCurrentProject(updatedProject);
            }
            console.log(`Project ${projectId} updated.`);
            setShowEditProjectModal(false); // Close modal on success
            setProjectToEdit(null); // Clear project being edited
        } else {
            setError("Failed to update project."); // Show global error
            setShowEditProjectModal(false); // Close modal on failure
            setProjectToEdit(null);
        }
     } catch (err) {
        console.error(`Error updating project ${projectId}:`, err);
        setError("Failed to update project.");
        setShowEditProjectModal(false); // Close modal on error
        setProjectToEdit(null);
     } finally {
        setLoading(false); // Stop loading indicator
     }
  };


  const handleDeleteProject = async (projectId: number) => {
    // Confirmation happens in ProjectList component
    setLoading(true);
    setError(null);
    try {
      // ##@@TAG: Delete Project
      const success = await projectService.deleteProject(projectId);
      if (success) {
        setProjects(projects.filter(p => p.id !== projectId));
        if (currentProject?.id === projectId) {
           setCurrentProject(null);
           setChapters([]);
        }
        console.log(`Project ${projectId} deleted.`);
      } else {
         setError("Failed to delete project.");
      }
    } catch (err) {
      console.error(`Error deleting project ${projectId}:`, err);
      setError("Failed to delete project.");
    } finally {
      setLoading(false);
    }
  };

  // --- State Update Handlers (from child components) ---

  const handleProjectParametersUpdated = (updatedProject: Project) => {
    // Called when EbookParametersForm saves
    setCurrentProject(updatedProject);
    // Also update the project in the main projects list
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleChaptersUpdated = (updatedChapters: Chapter[]) => {
    // Called when ChapterManager modifies chapters
    setChapters(updatedChapters);
  };

  const handleCloseProject = () => {
    setCurrentProject(null);
    setChapters([]);
  };

  // --- File Save/Load Functions (Triggered from TopMenuBar) ---

  const handleSaveToFile = async () => {
    if (!currentProject) return; // Should be disabled in menu, but double-check
    setLoading(true);
    setError(null);
    try {
      const dbData = await dbService.exportDatabase();
      if (dbData) {
        const blob = new Blob([dbData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Sanitize filename
        const filename = `${currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'spell-b00k'}.db`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Project database saved to file.");
      } else {
        setError("Failed to export database.");
      }
    } catch (err) {
      console.error("Error saving database to file:", err);
      setError("Failed to save project to file.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setCurrentProject(null); // Clear current project
    setChapters([]); // Clear chapters
    setProjects([]); // Clear project list before loading

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // ##@@TAG: Load DB From File
        const success = await dbService.loadDatabaseFromFile(data);
        if (success) {
          console.log("Database loaded from file.");
          // Re-fetch projects from the newly loaded DB to update the list
          const projectList = await projectService.listProjects();
          setProjects(projectList);
          // Do not auto-load a project, let user choose from the list
        } else {
          setError("Failed to load database from file. The file might be corrupted or invalid.");
           // Attempt to re-initialize an empty DB state if loading fails badly
           await dbService.initialize();
           setProjects([]); // Ensure project list is empty
        }
      } catch (err) {
        console.error("Error reading or loading file:", err);
        setError("Failed to load project from file.");
         // Attempt to re-initialize an empty DB state
         await dbService.initialize();
         setProjects([]);
      } finally {
        setLoading(false);
        // Clear the file input value so the same file can be selected again
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.onerror = (err) => {
      console.error("File reading error:", err);
      setError("Error reading file.");
      setLoading(false);
       if (event.target) {
            event.target.value = '';
       }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- Menu Bar Action Triggers ---
  const handleNewProjectClick = () => {
    setShowNewProjectModal(true); // Open the modal
  };

  const handleEditProjectClick = () => {
    if (!currentProject) return;
    setProjectToEdit(currentProject); // Set the project to be edited
    setShowEditProjectModal(true); // Open the modal
  };

  const handleShowOptionsClick = () => {
     setShowOptionsModal(true); // Open the Options modal
  };


  // --- Render Logic ---

  // Display global loading indicator or error if needed
  if (loading && projects.length === 0 && !currentProject) { // Show initial loading
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopMenuBar
        loading={loading}
        currentProject={currentProject}
        onNewProjectClick={handleNewProjectClick} // Updated handler
        onSaveProject={handleSaveToFile}
        onLoadProjectClick={() => { /* Handled by hidden input trigger */ }}
        onEditProjectClick={handleEditProjectClick} // Updated handler
        onShowOptionsClick={handleShowOptionsClick} // Updated handler
        onLoadFromFile={handleLoadFromFile}
      />

      <main className="p-8">
        {/* Display Global Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <span className="text-xl">×</span>
            </button>
          </div>
        )}

        {/* Render Project List or Project Details */}
        {!currentProject ? (
          <ProjectList
            projects={projects}
            loading={loading} // Pass loading state for list-specific indicators
            onLoadProject={handleLoadProject}
            onDeleteProject={handleDeleteProject}
            // TODO: Add onEditProject trigger here? Or rely on menu only when project is loaded?
          />
        ) : (
          <ProjectDetails
            project={currentProject}
            chapters={chapters}
            loading={loading} // Pass loading state
            onProjectUpdated={handleProjectParametersUpdated} // For parameter form updates
            onChaptersUpdated={handleChaptersUpdated}
            onCloseProject={handleCloseProject}
            // Add onEditProjectDetails={handleEditProjectClick} ? To allow editing from details view?
          />
        )}

        {/* Render Modals */}
        <NewProjectModal
            isOpen={showNewProjectModal}
            onClose={() => setShowNewProjectModal(false)}
            onCreate={handleCreateProject}
            loading={loading} // Pass loading state to modal
        />
        <EditProjectModal
            isOpen={showEditProjectModal}
            onClose={() => { setShowEditProjectModal(false); setProjectToEdit(null); }}
            onSave={handleUpdateProject}
            project={projectToEdit} // Pass the project being edited
            loading={loading} // Pass loading state to modal
        />
        <OptionsModal
            isOpen={showOptionsModal}
            onClose={() => setShowOptionsModal(false)}
            // Pass save handler if needed, currently saves directly to localStorage
        />

      </main>
    </div>
  );
}

export default App;
