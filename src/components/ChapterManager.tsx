import React, { useState, useRef, DragEvent } from 'react';
import type { Project, Chapter, EbookParameters } from '../types/models'; // Added EbookParameters
import { chapterService } from '../services/chapterService';
import { llmService } from '../services/llmService';
import { GripVertical, Edit3, FileText, Sparkles, Trash2, Loader2 } from 'lucide-react'; // Keep this import

interface ChapterManagerProps {
  project: Project;
  chapters: Chapter[];
  onChaptersUpdated: (chapters: Chapter[]) => void;
}

const ChapterManager: React.FC<ChapterManagerProps> = ({
  project,
  chapters,
  onChaptersUpdated,
}) => {
  // Existing states...
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatingChapterId, setGeneratingChapterId] = useState<number | null>(null);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [editingContentChapterId, setEditingContentChapterId] = useState<number | null>(null);
  const [chapterContent, setChapterContent] = useState('');
  const [saveContentError, setSaveContentError] = useState<string | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false); // State for saving content manually

  // Drag and Drop State...
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: DragEvent<HTMLLIElement>, index: number) => {
    console.log('Drag Start:', index);
    dragItem.current = index;
    e.currentTarget.classList.add('opacity-50', 'bg-blue-100');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnter = (e: DragEvent<HTMLLIElement>, index: number) => {
    console.log('Drag Enter:', index);
    dragOverItem.current = index;
    e.currentTarget.classList.add('border-t-2', 'border-blue-500');
  };

  const handleDragLeave = (e: DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('border-t-2', 'border-blue-500');
  };

  const handleDragOver = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-t-2', 'border-blue-500');

    const dragItemIndex = dragItem.current;
    const dragOverItemIndex = dragOverItem.current;

    console.log('Drop:', `Dragged Index: ${dragItemIndex}`, `Over Index: ${dragOverItemIndex}`);

    if (dragItemIndex === null || dragOverItemIndex === null || dragItemIndex === dragOverItemIndex) {
      dragItem.current = null;
      dragOverItem.current = null;
      const draggedElement = document.querySelector(`li[draggable="true"][data-index="${dragItemIndex}"]`);
      draggedElement?.classList.remove('opacity-50', 'bg-blue-100');
      return;
    }

    const reorderedChapters = [...chapters];
    const [draggedItemContent] = reorderedChapters.splice(dragItemIndex, 1);
    reorderedChapters.splice(dragOverItemIndex, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    const updates = reorderedChapters.map((chapter, index) => ({
      id: chapter.id,
      order: index,
    }));

    onChaptersUpdated(reorderedChapters.map((chapter, index) => ({ ...chapter, order: index })));

    setChapterError(null);
    try {
      console.log("Updating chapter order in DB:", updates);
      const success = await chapterService.updateChapterOrder(updates);
      if (!success) {
        setChapterError("Failed to save the new chapter order.");
        onChaptersUpdated(chapters); // Revert UI
        console.error("Reverted chapter order due to DB update failure.");
      } else {
        console.log("Chapter order saved successfully.");
      }
    } catch (err) {
      console.error("Error updating chapter order:", err);
      setChapterError("An error occurred while saving the chapter order.");
      onChaptersUpdated(chapters); // Revert UI
    } finally {
      const allItems = e.currentTarget.parentElement?.querySelectorAll('li');
      allItems?.forEach(item => item.classList.remove('opacity-50', 'bg-blue-100', 'border-t-2', 'border-blue-500'));
    }
  };

  const handleDragEnd = (e: DragEvent<HTMLLIElement>) => {
    console.log('Drag End');
    e.currentTarget.classList.remove('opacity-50', 'bg-blue-100', 'border-t-2', 'border-blue-500');
    const allItems = e.currentTarget.parentElement?.querySelectorAll('li');
    allItems?.forEach(item => item.classList.remove('border-t-2', 'border-blue-500'));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // --- Other Functions ---
  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setChapterError(null);

    try {
      console.log("Generating plan prompt...");
      const planPrompt = await llmService.generateEbookPlanPrompt(project);

      console.log(`Processing plan prompt with configured LLM...`);
      const planResponse = await llmService.processLLMPrompt(planPrompt);

      if (planResponse) {
        console.log("Handling plan response...");
        let proceed = true;
        if (chapters.length > 0) {
          proceed = window.confirm('Generating a new plan will replace existing chapters. Continue?');
          if (proceed) {
            console.log("Deleting existing chapters...");
            for (const chapter of chapters) {
              await chapterService.deleteChapter(chapter.id);
            }
            console.log("Existing chapters deleted.");
            onChaptersUpdated([]); // Clear UI immediately
          }
        }

        if (proceed) {
          const success = await llmService.handleEbookPlanResponse(planResponse, project.id);
          if (success) {
            console.log("Ebook plan generated and chapters created.");
            const updatedChapters = await chapterService.getChaptersByProjectId(project.id);
            onChaptersUpdated(updatedChapters);
          } else {
            setChapterError("Failed to process LLM response or create chapters.");
          }
        } else {
          console.log("Plan generation cancelled by user.");
        }
      } else {
        setChapterError("LLM failed to generate a plan.");
      }

    } catch (err) {
      console.error("Error generating ebook plan:", err);
      setChapterError("An error occurred while generating the ebook plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleShowAddChapterForm = () => {
    setEditingChapter(null);
    setChapterTitle('');
    setChapterDescription('');
    setShowChapterForm(true);
  };

  const handleShowEditChapterForm = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterTitle(chapter.title);
    setChapterDescription(chapter.description);
    setShowChapterForm(true);
  };

  const handleCloseChapterForm = () => {
    setShowChapterForm(false);
    setEditingChapter(null);
    setChapterTitle('');
    setChapterDescription('');
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim() || !chapterDescription.trim()) {
      alert('Chapter title and description cannot be empty.');
      return;
    }
    setChapterError(null);
    try {
      if (editingChapter) {
        const updatedChapter = await chapterService.updateChapter(editingChapter.id, {
          title: chapterTitle,
          description: chapterDescription,
        });
        if (updatedChapter) {
          const updatedChapters = await chapterService.getChaptersByProjectId(project.id);
          onChaptersUpdated(updatedChapters);
        } else {
          setChapterError("Failed to update chapter.");
        }
      } else {
        const newChapter = await chapterService.createChapter(
          project.id,
          chapterTitle,
          chapterDescription
        );
        if (newChapter) {
          const updatedChapters = await chapterService.getChaptersByProjectId(project.id);
          onChaptersUpdated(updatedChapters);
        } else {
          setChapterError("Failed to create chapter.");
        }
      }
      handleCloseChapterForm();
    } catch (err) {
      console.error("Error saving chapter:", err);
      setChapterError("Failed to save chapter.");
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      setChapterError(null);
      try {
        const success = await chapterService.deleteChapter(chapterId);
        if (success) {
          const remainingChapters = await chapterService.getChaptersByProjectId(project.id);
          const updates = remainingChapters.map((chapter, index) => ({ id: chapter.id, order: index }));
          await chapterService.updateChapterOrder(updates);
          const finalChapters = await chapterService.getChaptersByProjectId(project.id);
          onChaptersUpdated(finalChapters);
        } else {
          setChapterError("Failed to delete chapter.");
        }
      } catch (err) {
        console.error(`Error deleting chapter ${chapterId}:`, err);
        setChapterError("Failed to delete chapter.");
      }
    }
  };

  const handleGenerateContent = async (chapterId: number) => {
    setGeneratingChapterId(chapterId);
    setChapterError(null);

    try {
      const chapterToGenerate = chapters.find(c => c.id === chapterId);
      if (!chapterToGenerate) {
        setChapterError(`Chapter with ID ${chapterId} not found.`);
        return;
      }

      let previousContent: string | null = null;
      const parameters: EbookParameters = project.parameters ? JSON.parse(project.parameters) : {};
      if (parameters.continueNarrative) {
        const currentIndex = chapters.findIndex(c => c.id === chapterId);
        if (currentIndex > 0) {
          previousContent = chapters[currentIndex - 1].content || null;
        }
      }

      console.log(`Generating content prompt for chapter ${chapterId}...`);
      const contentPrompt = await llmService.generateChapterContentPrompt(
        project,
        chapterToGenerate,
        previousContent
      );

      console.log(`Processing content prompt with configured LLM...`);
      const contentResponse = await llmService.processLLMPrompt(contentPrompt);

      if (contentResponse) {
        console.log("Handling chapter content response...");
        const success = await llmService.handleChapterContentResponse(contentResponse, chapterId);
        if (success) {
          console.log(`Content generated and saved for chapter ${chapterId}.`);
          const updatedChapters = await chapterService.getChaptersByProjectId(project.id);
          onChaptersUpdated(updatedChapters);
        } else {
          setChapterError("Failed to process LLM response or save chapter content.");
        }
      } else {
        setChapterError("LLM failed to generate chapter content.");
      }

    } catch (err) {
      console.error(`Error generating content for chapter ${chapterId}:`, err);
      setChapterError("An error occurred while generating chapter content.");
    } finally {
      setGeneratingChapterId(null);
    }
  };

  const handleShowEditContent = (chapter: Chapter) => {
    setEditingContentChapterId(chapter.id);
    setChapterContent(chapter.content || '');
    setSaveContentError(null);
  };

  const handleSaveContent = async (chapterId: number) => {
    setSaveContentError(null);
    setIsSavingContent(true);
    try {
      const updatedChapter = await chapterService.updateChapter(chapterId, { content: chapterContent });
      if (updatedChapter) {
        const updatedChapters = chapters.map(c => c.id === updatedChapter.id ? updatedChapter : c);
        onChaptersUpdated(updatedChapters);
        setEditingContentChapterId(null);
        setChapterContent('');
      } else {
        setSaveContentError("Failed to save chapter content.");
      }
    } catch (error) {
      console.error(`Error saving content for chapter ${chapterId}:`, error);
      setSaveContentError("An error occurred while saving chapter content.");
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleCancelEditContent = () => {
    setEditingContentChapterId(null);
    setChapterContent('');
    setSaveContentError(null);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">Chapters</h3>

      {/* Manual Add Chapter Button */}
      <button
        onClick={handleShowAddChapterForm}
        disabled={isGeneratingPlan || generatingChapterId !== null}
        className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        + Add Chapter Manually
      </button>

      {/* Add/Edit Chapter Form */}
      {showChapterForm && (
        <form onSubmit={handleSaveChapter} className="mb-6 p-4 border rounded bg-gray-50">
          <h4 className="text-lg font-medium mb-3">{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</h4>
          <div className="mb-4">
            <label htmlFor="chapterTitle" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="chapterTitle"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="chapterDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="chapterDescription"
              value={chapterDescription}
              onChange={(e) => setChapterDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              required
            ></textarea>
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingChapter ? 'Save Changes' : 'Add Chapter'}
            </button>
            <button
              type="button"
              onClick={handleCloseChapterForm}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {chapterError && <p className="text-red-600 text-sm mb-4">{chapterError}</p>}

      {chapters.length === 0 && !showChapterForm ? (
        <p className="text-gray-600 mb-4">No chapters found for this project. Use "Generate Ebook Plan" or "Add Chapter Manually".</p>
      ) : (
        <ul className="border rounded divide-y divide-gray-200">
          {chapters.map((chapter, index) => (
            <li
              key={chapter.id}
              className={`py-3 px-4 flex items-center group hover:bg-gray-50 transition-colors duration-150 ${
                editingContentChapterId === chapter.id ? 'flex-wrap' : ''
              }`}
              draggable={editingContentChapterId === null}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              title={editingContentChapterId === null ? "Drag to reorder chapters" : ""}
            >
              {/* Drag Handle */}
              {editingContentChapterId === null && (
                <span className="cursor-move text-gray-400 mr-3 group-hover:text-gray-600">
                  <GripVertical size={20} />
                </span>
              )}

              {/* Chapter Info */}
              <div className="flex-grow min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  Chapter {chapter.order + 1}: {chapter.title}
                </p>
                <p className="text-sm text-gray-600 truncate">{chapter.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex items-center space-x-1 ml-4">
                <button
                  onClick={() => handleShowEditChapterForm(chapter)}
                  disabled={isGeneratingPlan || generatingChapterId !== null}
                  className="p-1 text-gray-500 hover:text-yellow-600 focus:outline-none rounded-full hover:bg-gray-100 disabled:opacity-50"
                  title="Edit Title/Description"
                >
                  <Edit3 size={16} />
                </button>
                {chapter.content ? (
                  <button
                    onClick={() => handleShowEditContent(chapter)}
                    disabled={isGeneratingPlan || generatingChapterId !== null}
                    className="p-1 text-gray-500 hover:text-blue-600 focus:outline-none rounded-full hover:bg-gray-100 disabled:opacity-50"
                    title="Edit Content"
                  >
                    <FileText size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleGenerateContent(chapter.id)}
                    disabled={isGeneratingPlan || generatingChapterId !== null}
                    className="p-1 text-gray-500 hover:text-green-600 focus:outline-none rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate Content (LLM)"
                  >
                    {generatingChapterId === chapter.id ? (
                      <Loader2 size={16} className="animate-spin text-green-600" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteChapter(chapter.id)}
                  disabled={isGeneratingPlan || generatingChapterId !== null}
                  className="p-1 text-gray-500 hover:text-red-600 focus:outline-none rounded-full hover:bg-gray-100 disabled:opacity-50"
                  title="Delete Chapter"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Content Editor */}
              {editingContentChapterId === chapter.id && (
                <div className="mt-4 p-4 border rounded bg-gray-100 w-full">
                  <h4 className="text-lg font-medium mb-3">Edit Chapter Content</h4>
                  <textarea
                    value={chapterContent}
                    onChange={(e) => setChapterContent(e.target.value)}
                    rows={10}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    disabled={isSavingContent}
                  ></textarea>
                  <div className="mt-4 flex space-x-4 items-center">
                    <button
                      onClick={() => handleSaveContent(chapter.id)}
                      disabled={isSavingContent}
                      className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingContent ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      {isSavingContent ? 'Saving...' : 'Save Content'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditContent}
                      disabled={isSavingContent}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    {saveContentError && <span className="text-red-600 text-sm">{saveContentError}</span>}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              {chapter.content && editingContentChapterId !== chapter.id && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-800 max-h-40 overflow-y-auto w-full">
                  <h5 className="font-semibold mb-1">Content Preview:</h5>
                  <p className="whitespace-pre-wrap">{chapter.content.substring(0, 300)}...</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleGeneratePlan}
        disabled={isGeneratingPlan || generatingChapterId !== null}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeneratingPlan ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        {isGeneratingPlan ? 'Generating Plan...' : 'Generate Ebook Plan (LLM)'}
      </button>
    </div>
  );
};

export default ChapterManager;
