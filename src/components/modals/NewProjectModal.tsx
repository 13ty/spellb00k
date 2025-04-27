import React, { useState } from 'react';
import { X } from 'lucide-react'; // Import close icon

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>; // Make async to handle loading state
  loading: boolean; // Receive loading state from parent
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreate, loading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    try {
      await onCreate(name, description);
      // Parent component (App.tsx) will handle closing the modal on success via state update
      // Reset local state for next time
      setName('');
      setDescription('');
    } catch (err) {
        // Error handling is likely done in App.tsx's onCreate handler,
        // but we can show a local error too if needed.
        console.error("Error during project creation call:", err);
        setError("Failed to initiate project creation.");
    }
  };

  const handleClose = () => {
    if (loading) return; // Don't close while parent is processing
    // Reset state on close
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };


  if (!isOpen) {
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
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newProjectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="newProjectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="newProjectDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Goal/Main Idea)
            </label>
            <textarea
              id="newProjectDescription"
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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
