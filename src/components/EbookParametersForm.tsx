import React, { useState, useEffect } from 'react';
import type { Project, EbookParameters } from '../types/models';
import { projectService } from '../services/projectService';

interface EbookParametersFormProps {
  project: Project;
  onParametersUpdated: (updatedProject: Project) => void;
}

const EbookParametersForm: React.FC<EbookParametersFormProps> = ({ project, onParametersUpdated }) => {
  // Parse parameters from project or use defaults
  const initialParameters: EbookParameters = project.parameters
    ? JSON.parse(project.parameters)
    : {};

  const [genre, setGenre] = useState(initialParameters.genre || '');
  const [targetAudience, setTargetAudience] = useState(initialParameters.targetAudience || '');
  const [style, setStyle] = useState(initialParameters.style || '');
  const [tone, setTone] = useState(initialParameters.tone || '');
  const [chapterLength, setChapterLength] = useState(initialParameters.chapterLength || '');
  const [pointOfView, setPointOfView] = useState(initialParameters.pointOfView || '');
  const [customInstructions, setCustomInstructions] = useState(initialParameters.customInstructions || '');
  // New state for added parameters
  const [continueNarrative, setContinueNarrative] = useState(initialParameters.continueNarrative || false);
  const [narrativeHooks, setNarrativeHooks] = useState(initialParameters.narrativeHooks || '');


  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset form state when project changes
  useEffect(() => {
    const params: EbookParameters = project.parameters ? JSON.parse(project.parameters) : {};
    setGenre(params.genre || '');
    setTargetAudience(params.targetAudience || '');
    setStyle(params.style || '');
    setTone(params.tone || '');
    setChapterLength(params.chapterLength || '');
    setPointOfView(params.pointOfView || '');
    setCustomInstructions(params.customInstructions || '');
    // Reset new parameters
    setContinueNarrative(params.continueNarrative || false);
    setNarrativeHooks(params.narrativeHooks || '');
    setSaveSuccess(false); // Reset success message on project change
  }, [project]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const updatedParameters: EbookParameters = {
      genre: genre.trim() || undefined, // Use undefined if empty string
      targetAudience: targetAudience.trim() || undefined,
      style: style.trim() || undefined,
      tone: tone.trim() || undefined,
      chapterLength: chapterLength.trim() || undefined,
      pointOfView: pointOfView.trim() || undefined,
      customInstructions: customInstructions.trim() || undefined,
      // Add new parameters
      continueNarrative: continueNarrative,
      narrativeHooks: narrativeHooks.trim() || undefined,
    };

    try {
      // ##@@TAG: Update Project Parameters
      const updatedProject = await projectService.updateProject(project.id, {
        // Only pass name/description if they are editable in this form (they are not)
        // name: project.name, // Keep existing name
        // description: project.description, // Keep existing description
        parameters: updatedParameters, // Pass the full parameters object
      });

      if (updatedProject) {
        onParametersUpdated(updatedProject); // Notify parent component
        setSaveSuccess(true);
        // The useEffect above will update local state based on updatedProject prop
      } else {
        setSaveError('Failed to save parameters.');
      }
    } catch (error) {
      console.error('Error saving parameters:', error);
      setSaveError('An error occurred while saving parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-lg mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">Ebook Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Existing Fields */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Genre</label>
          <input
            type="text"
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">Target Audience</label>
          <input
            type="text"
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700">Writing Style</label>
          <input
            type="text"
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700">Desired Tone</label>
          <input
            type="text"
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="chapterLength" className="block text-sm font-medium text-gray-700">Approximate Chapter Length</label>
          <input
            type="text"
            id="chapterLength"
            value={chapterLength}
            onChange={(e) => setChapterLength(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            placeholder="e.g., Short, Medium, Long"
          />
        </div>
        <div>
          <label htmlFor="pointOfView" className="block text-sm font-medium text-gray-700">Point of View</label>
          <input
            type="text"
            id="pointOfView"
            value={pointOfView}
            onChange={(e) => setPointOfView(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            placeholder="e.g., First Person, Third Person"
          />
        </div>

        {/* New Fields */}
        <div className="md:col-span-2 border-t pt-4 mt-4">
           <label htmlFor="continueNarrative" className="flex items-center">
             <input
               type="checkbox"
               id="continueNarrative"
               checked={continueNarrative}
               onChange={(e) => setContinueNarrative(e.target.checked)}
               className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
             />
             <span className="ml-2 block text-sm font-medium text-gray-700">Continue Narrative (Use previous chapter context)</span>
           </label>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="narrativeHooks" className="block text-sm font-medium text-gray-700">Narrative Hooks (Optional)</label>
          <textarea
            id="narrativeHooks"
            value={narrativeHooks}
            onChange={(e) => setNarrativeHooks(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            placeholder="Enter recurring themes, jokes, or phrases, one per line..."
          ></textarea>
           <p className="mt-1 text-xs text-gray-500">Enter recurring elements the LLM should try to incorporate.</p>
        </div>


        <div className="md:col-span-2">
          <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700">Custom Instructions</label>
          <textarea
            id="customInstructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            placeholder="Any specific details, keywords, or constraints for the LLM..."
          ></textarea>
        </div>
      </div>

      <div className="mt-6 flex items-center space-x-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Parameters'}
        </button>
        {saveSuccess && <span className="text-green-600 text-sm">Parameters saved!</span>}
        {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
      </div>
    </div>
  );
};

export default EbookParametersForm;
