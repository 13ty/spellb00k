import React, { useState, useEffect } from 'react';
import type { Project } from '../../types/models';
import { X } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectId: number, name: string, description: string) => Promise<void>; // Make async
  project: Project | null; // Project to edit
  loading: boolean; // Receive loading state
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, onSave, project, loading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load project data when modal opens or project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setError(null); // Clear error when project loads
    }
  }, [project, isOpen]); // Depend on isOpen to reset when reopened

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!project) {
      setError("No project selected for editing.");
      return;
    }
    if (!name.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
     try {
        await onSave(project.id, name, description);
        // Parent (App.tsx) handles closing on success
     } catch (err) {
        console.error("Error during project update call:", err);
        setError("Failed to initiate project update.");
     }
  };

   const handleClose = () => {
    if (loading) return; // Don't close while parent is processing
    // Don't reset state here, useEffect handles it based on project prop
    setError(null);
    onClose();
  };


  if (!isOpen || !project) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
         <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
          disabled={loading}
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-4">Edit Project Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="editProjectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="editProjectDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Goal/Main Idea)
            </label>
            <textarea
              id="editProjectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Briefly describe the ebook's main topic or goal..."
              disabled={loading}
            ></textarea>
             <p className="mt-1 text-xs text-gray-500">This helps the AI understand the context.</p>
          </div>
           {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
