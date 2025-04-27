import React, { useRef } from 'react';
import type { Project } from '../types/models';
import { Settings, FolderPlus, Edit3, Save, FolderOpen } from 'lucide-react';

interface TopMenuBarProps {
  loading: boolean;
  currentProject: Project | null;
  onNewProjectClick: () => void;
  onSaveProject: () => void;
  onLoadProjectClick: () => void;
  onEditProjectClick: () => void;
  onShowOptionsClick: () => void;
  onLoadFromFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TopMenuBar: React.FC<TopMenuBarProps> = ({
  loading,
  currentProject,
  onNewProjectClick,
  onSaveProject,
  onLoadProjectClick,
  onEditProjectClick,
  onShowOptionsClick,
  onLoadFromFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <nav className="bg-gray-800 text-white p-4 mb-8 rounded shadow-lg flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <img src="/logo.jpg" alt="Spell-b00k Logo" className="h-8 w-auto" />
      </div>
      <div className="flex items-center space-x-4">
        {/* Projects Dropdown/Menu - Removed py-2 from group, added negative margin to dropdown */}
        <div className="relative group"> {/* Removed py-2 */}
          <button className="flex items-center px-3 py-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700">
            Projects
            <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
            </svg>
          </button>
          {/* Dropdown Menu Items - Added slight negative top margin */}
          <div className="absolute right-0 z-10 mt-[-2px] w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block"> {/* Changed mt-0 to mt-[-2px] */}
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              {/* Menu items remain the same */}
              <button
                onClick={onNewProjectClick}
                disabled={loading}
                className="text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
                role="menuitem"
              >
                <FolderPlus size={16} className="mr-2" /> New Project
              </button>
              <button
                onClick={handleLoadClick}
                disabled={loading}
                className="text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
                role="menuitem"
              >
                <FolderOpen size={16} className="mr-2" /> Load Project...
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={onLoadFromFile}
                disabled={loading}
                accept=".db"
              />
              <button
                onClick={onSaveProject}
                disabled={loading || !currentProject}
                className="text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
                role="menuitem"
              >
                <Save size={16} className="mr-2" /> Save Project
              </button>
              <button
                onClick={onEditProjectClick}
                disabled={loading || !currentProject}
                className="text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
                role="menuitem"
              >
                <Edit3 size={16} className="mr-2" /> Edit Project
              </button>
            </div>
          </div>
        </div>

        {/* Options Button */}
        <button
          onClick={onShowOptionsClick}
          disabled={loading}
          className="flex items-center px-3 py-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Options"
        >
          <Settings size={20} className="mr-1" /> Options
        </button>
      </div>
    </nav>
  );
};

export default TopMenuBar;
