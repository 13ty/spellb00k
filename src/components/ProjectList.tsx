import React, { useState } from 'react';
import type { Project } from '../types/models';

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  onCreateProject: (name: string, description: string) => void;
  onLoadProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading,
  error,
  onCreateProject,
  onLoadProject,
  onDeleteProject,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject(newProjectName, newProjectDescription);
    // Reset form fields regardless of success, App.tsx handles state update
    setNewProjectName('');
    setNewProjectDescription('');
    setShowCreateForm(false);
  };

  if (loading) {
    return <p>Loading projects...</p>;
  }

  if (error) {
    return <p className="text-red-600">Error loading projects: {error}</p>;
  }

  return (
    <div className="bg-white p-6 rounded shadow-lg mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Projects</h2>

      {showCreateForm ? (
        <form onSubmit={handleCreateSubmit} className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="text-xl font-medium mb-3">Create New Project</h3>
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              id="projectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              id="projectDescription"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            ></textarea>
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          + Create New Project
        </button>
      )}

      {projects.length === 0 ? (
        <p className="text-gray-600">No projects found. Create a new one to get started!</p>
      ) : (
        <ul>
          {projects.map(project => (
            <li key={project.id} className="border-b last:border-b-0 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{project.name}</p>
                <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onLoadProject(project.id)}
                  className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Load
                </button>
                {/* TODO: Add Edit button */}
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectList;
