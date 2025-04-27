import React from 'react';
import type { Project } from '../types/models';

interface FileOperationsProps {
  loading: boolean;
  currentProject: Project | null;
  onSaveToFile: () => void;
  onLoadFromFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileOperations: React.FC<FileOperationsProps> = ({
  loading,
  currentProject,
  onSaveToFile,
  onLoadFromFile,
}) => {
  return (
    <div className="bg-white p-6 rounded shadow-lg mb-8 flex items-center space-x-4">
      <h2 className="text-2xl font-semibold text-gray-700">File Operations</h2>
      <button
        onClick={onSaveToFile}
        disabled={loading || !currentProject} // Disable if loading or no project loaded
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Project to File
      </button>
      <label className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        Load Project from File
        <input type="file" className="hidden" onChange={onLoadFromFile} disabled={loading} accept=".db" />
      </label>
    </div>
  );
};

export default FileOperations;
