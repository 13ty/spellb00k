import React from 'react';
import type { Project, Chapter } from '../types/models';
import EbookParametersForm from './EbookParametersForm';
import ChapterManager from './ChapterManager';
import ChatInterface from './ChatInterface'; // Import the new ChatInterface component

interface ProjectDetailsProps {
  project: Project;
  chapters: Chapter[];
  loading: boolean; // Pass loading state down if needed by children
  error: string | null; // Pass error state down if needed by children
  onProjectUpdated: (updatedProject: Project) => void;
  onChaptersUpdated: (chapters: Chapter[]) => void;
  onCloseProject: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  chapters,
  loading,
  error,
  onProjectUpdated,
  onChaptersUpdated,
  onCloseProject,
}) => {
  // Note: Loading and Error states are primarily handled in App.tsx
  // but can be passed down if child components need to react to them.

  return (
    <div className="bg-white p-6 rounded shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Current Project: {project.name}</h2>
      <p className="text-gray-600 mb-4">{project.description || 'No description'}</p>

      {/* Ebook Parameters Form */}
      <EbookParametersForm
        project={project}
        onParametersUpdated={onProjectUpdated}
      />

      {/* Chapter List and Management */}
      <ChapterManager
        project={project}
        chapters={chapters}
        onChaptersUpdated={onChaptersUpdated}
      />

      {/* Chat Interface */}
      <ChatInterface
        project={project}
        // Pass currentChapterId here if chat needs to be chapter-specific
      />

      {/* TODO: Add sections for File Export/Import, etc. */}

      <button
        onClick={onCloseProject}
        className="mt-8 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Close Project
      </button>
    </div>
  );
};

export default ProjectDetails;
