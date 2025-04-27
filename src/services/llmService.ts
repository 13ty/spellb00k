// src/services/llmService.ts
import { projectService } from './projectService';
import { chapterService } from './chapterService';
import type { Project, Chapter, EbookParameters, ChatMessage } from '../types/models';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { loadLlmSettings, type LlmSettings } from '../lib/settingsService'; // Import settings loader

// Import Provider Modules
import { openaiProvider } from '../providers/openaiProvider';
import { ollamaProvider } from '../providers/ollamaProvider';
import { lmstudioProvider } from '../providers/lmstudioProvider';
import type { LlmProvider, ProviderConfig } from '../providers/types'; // Import common types

/**
 * Gets the active LLM provider module based on saved settings.
 * @param settings - The loaded LLM settings.
 * @returns The corresponding provider module or null if invalid.
 */
const getActiveProvider = (settings: LlmSettings): LlmProvider | null => {
  switch (settings.provider) {
    case 'openai':
      return openaiProvider;
    case 'ollama':
      return ollamaProvider;
    case 'lmstudio': // Add LMStudio case
        return lmstudioProvider;
    // Add cases for other providers here
    default:
      console.error(`Unsupported LLM provider specified in settings: ${settings.provider}`);
      return null;
  }
};

/**
 * Creates the configuration object needed by provider methods.
 * @param settings - The loaded LLM settings.
 * @returns ProviderConfig object.
 */
const createProviderConfig = (settings: LlmSettings): ProviderConfig => {
    // Ensure a model is selected, falling back to defaults if necessary
    let model = settings.model;
    if (!model) {
        console.warn("No model specified in settings, falling back to default.");
        model = settings.provider === 'ollama' ? 'llama3' : // Example default for ollama
                settings.provider === 'lmstudio' ? 'loaded-model-id' : // Placeholder default for LMStudio
                'gpt-3.5-turbo'; // Default for OpenAI
    }

    return {
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: model,
    };
};


// --- Main LLM Service (Dispatcher) ---
export const llmService = {

  // --- Prompt Generation (Provider Agnostic) ---

  async generateEbookPlanPrompt(project: Project): Promise<string> {
    // (Keep existing implementation - it's provider agnostic)
    const parameters: EbookParameters = project.parameters ? JSON.parse(project.parameters) : {};
    const promptTemplate = `
You are an expert book planner and outline creator. Your task is to generate a chapter-by-chapter plan for an ebook based on the following details.

**Project Goal/Main Idea:**
${project.description || 'Provide your main idea or description here'}

**Ebook Parameters:**
* Genre: ${parameters.genre || 'Specify genre'}
* Target Audience: ${parameters.targetAudience || 'Specify audience'}
* Writing Style: ${parameters.style || 'Specify style'}
* Desired Tone: ${parameters.tone || 'Specify tone'}
* Approximate Chapter Length: ${parameters.chapterLength || 'Specify chapter length'}
* Point of View: ${parameters.pointOfView || 'Specify point of view'}
* Other Instructions: ${parameters.customInstructions || 'Add custom instructions here'}
${parameters.narrativeHooks ? `* Narrative Hooks to incorporate: \n${parameters.narrativeHooks.split('\n').map(h => `  - ${h.trim()}`).join('\n')}` : ''}

**Instructions:**
Please provide a list of logical chapter titles for this ebook. For each chapter, write a concise 1-3 sentence description outlining the key topics or events it should cover. Ensure the chapters flow logically from one to the next. ${parameters.narrativeHooks ? 'Where appropriate, subtly weave in references or developments related to the specified Narrative Hooks.' : ''}

**Output Format:**
Present the output clearly, like this:

Chapter 1: [Chapter Title]
Description: [Chapter Description]

Chapter 2: [Chapter Title]
Description: [Chapter Description]

... (Continue for all planned chapters)
    `;
    return promptTemplate;
  },

  async generateChapterContentPrompt(
    project: Project,
    chapter: Chapter,
    previousChapterContent?: string | null
  ): Promise<string> {
    // (Keep existing implementation - it's provider agnostic)
     const parameters: EbookParameters = project.parameters ? JSON.parse(project.parameters) : {};
    const includePreviousContext = parameters.continueNarrative && previousChapterContent;

    const promptTemplate = `
You are a skilled author tasked with writing a specific chapter for an ebook.

**Overall Ebook Goal/Main Idea:**
${project.description || 'Provide your main idea or description here'}

**Chapter to Write:**
* Chapter Number: ${chapter.order + 1}
* Chapter Title: "${chapter.title}"
* Chapter Description (What this chapter should cover): ${chapter.description}

**Ebook Parameters (Apply to this chapter):**
* Genre: ${parameters.genre || 'Specify genre'}
* Target Audience: ${parameters.targetAudience || 'Specify audience'}
* Writing Style: ${parameters.style || 'Specify style'}
* Desired Tone: ${parameters.tone || 'Specify tone'}
* Approximate Chapter Length: ${parameters.chapterLength || 'Specify chapter length'}
* Point of View: ${parameters.pointOfView || 'Specify point of view'}
* Other Instructions: ${parameters.customInstructions || 'Add custom instructions here'}
${parameters.narrativeHooks ? `* Narrative Hooks to incorporate: \n${parameters.narrativeHooks.split('\n').map(h => `  - ${h.trim()}`).join('\n')}` : ''}

**Context (Optional but helpful):**
${includePreviousContext ? `* Previous Chapter Content Summary/Key Points:\n---\n${previousChapterContent?.substring(0, 1500)}...\n---` : '* Continue narrative from previous chapter (if applicable).'}

**Instructions:**
Write the full content for Chapter ${chapter.order + 1}: "${chapter.title}". Ensure the writing adheres to all the specified parameters and fulfills the chapter description. Aim for a length consistent with "${parameters.chapterLength}". Make the content engaging and relevant to the "${parameters.targetAudience}". ${includePreviousContext ? 'Continue the narrative or topic flow logically from the provided previous chapter content.' : 'Ensure the chapter fits logically within the overall book structure.'} ${parameters.narrativeHooks ? 'Where appropriate, subtly weave in references or developments related to the specified Narrative Hooks.' : ''}

**Output:**
Begin writing the chapter content directly.
    `;
    return promptTemplate;
  },

  // --- Provider Interaction Methods ---

  /**
   * Processes a single prompt (e.g., for plan generation).
   * Uses the configured provider and model from settings.
   * @param prompt - The prompt string.
   * @returns The LLM response content or null.
   */
  async processLLMPrompt(prompt: string): Promise<string | null> {
    const settings = loadLlmSettings();
    const provider = getActiveProvider(settings);
    if (!provider) return null;

    const config = createProviderConfig(settings);
    const messages: ChatCompletionMessageParam[] = [{ role: 'user', content: prompt }];

    try {
        return await provider.getChatCompletion(messages, config);
    } catch (error) {
        // Error should be logged within the provider method
        return null;
    }
  },

  /**
   * Gets a chat response based on history.
   * Uses the configured provider and model from settings.
   * @param projectId - ID of the project for context.
   * @param messages - History of chat messages (user/assistant roles).
   * @returns The assistant's response content or null.
   */
  async getChatResponse(
    projectId: number,
    messages: ChatMessage[] // Use our internal ChatMessage type here
  ): Promise<string | null> {
    const settings = loadLlmSettings();
    const provider = getActiveProvider(settings);
    if (!provider) return null;

    const config = createProviderConfig(settings);

    // Fetch project context for system prompt
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      console.error(`Project ${projectId} not found for chat context.`);
      return null;
    }
    const parameters: EbookParameters = project.parameters ? JSON.parse(project.parameters) : {};
    const systemMessageContent = `You are a helpful assistant working on an ebook project called "${project.name}".
Project Description: ${project.description || 'N/A'}
Ebook Parameters: ${JSON.stringify(parameters)}
${parameters.narrativeHooks ? `Key Narrative Hooks/Themes: ${parameters.narrativeHooks}` : ''}
Current Task: Respond helpfully to the user's message in the context of this ebook project.`;

    // Format messages for the provider (including system prompt)
    const formattedMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessageContent },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant', // Ensure role matches expected type
        content: msg.content,
      })),
    ];

     try {
        return await provider.getChatCompletion(formattedMessages, config);
    } catch (error) {
        // Error should be logged within the provider method
        return null;
    }
  },

  /**
   * Lists available models from the configured provider.
   * Uses the configured provider from settings.
   * @returns Array of model IDs or null.
   */
  async listModels(): Promise<string[] | null> {
    const settings = loadLlmSettings();
    const provider = getActiveProvider(settings);
    if (!provider) return null;

    const config = createProviderConfig(settings);

    try {
        return await provider.listModels(config);
    } catch (error) {
        // Error should be logged within the provider method
        return null;
    }
  },

   /**
   * Tests the connection to the configured provider.
   * Uses the configured provider from settings.
   * @returns True if connection is successful, false otherwise.
   */
  async testConnection(): Promise<boolean> {
    const settings = loadLlmSettings();
    const provider = getActiveProvider(settings);
    if (!provider?.testConnection) {
        console.warn(`Provider ${settings.provider} does not support testConnection.`);
        // Optionally try listModels as a basic test if testConnection is missing
        try {
            const models = await this.listModels();
            return models !== null; // Consider connection successful if listModels doesn't fail
        } catch {
            return false;
        }
    }

    const config = createProviderConfig(settings);

    try {
        return await provider.testConnection(config);
    } catch (error) {
        // Error should be logged within the provider method
        return false;
    }
  },


  // --- Response Handling (Provider Agnostic) ---

  async handleEbookPlanResponse(response: string, projectId: number): Promise<boolean> {
    // (Keep existing implementation)
     try {
      // Parse the response and create chapters
      const chapters = this.parseEbookPlanResponse(response);
      if (!chapters || chapters.length === 0) {
        console.warn('No chapters found in LLM response');
        return false;
      }
      // Create chapters in the database
      for (let i = 0; i < chapters.length; i++) {
        await chapterService.createChapter(
          projectId,
          chapters[i].title,
          chapters[i].description,
          chapters[i].content // content might be empty for plan response
        );
      }
      return true;
    } catch (error) {
      console.error('Error handling ebook plan response:', error);
      return false;
    }
  },

  parseEbookPlanResponse(response: string): Partial<Chapter>[] | null {
    // (Keep existing implementation)
     try {
      const chapters: Partial<Chapter>[] = [];
      const lines = response.split('\n');
      let currentChapter: Partial<Chapter> = {};
      let isDescription = false;
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('Chapter')) {
          if (isDescription && currentChapter.title) { chapters.push({ ...currentChapter }); }
          const titleMatch = trimmedLine.match(/^Chapter\s+\d+:\s*(.*)/);
          currentChapter = {
            title: titleMatch ? titleMatch[1].trim() : 'Untitled Chapter',
            description: '', content: '', order: chapters.length,
          };
          isDescription = false;
        } else if (trimmedLine.startsWith('Description:')) {
           if (currentChapter.title) {
              currentChapter.description = trimmedLine.substring('Description:'.length).trim();
              isDescription = true;
           }
        } else if (isDescription && currentChapter.title) {
           currentChapter.description += ' ' + trimmedLine;
        }
      }
      if (currentChapter.title) { chapters.push({ ...currentChapter }); }
      const validChapters = chapters.filter(c => c.title && c.description);
      if (chapters.length > 0 && validChapters.length === 0) {
          console.warn("Parsed chapters but none had valid title/description.");
          return null;
      }
      return validChapters.length > 0 ? validChapters : null;
    } catch (error) {
      console.error('Error parsing ebook plan response:', error);
      return null;
    }
  },

  async handleChapterContentResponse(response: string, chapterId: number): Promise<boolean> {
    // (Keep existing implementation)
     try {
      await chapterService.updateChapter(chapterId, { content: response });
      return true;
    } catch (error) {
      console.error('Error handling chapter content response:', error);
      return false;
    }
  },

  // --- Complex Flows (using other service methods) ---

  async generateChapterSequenceContent(
    projectId: number,
    startChapterId: number
    // Removed provider/model args - use settings
  ): Promise<boolean> {
    // This method now uses the refactored processLLMPrompt internally
    try {
      const project = await projectService.getProjectById(projectId);
      if (!project) {
        console.error(`Project with ID ${projectId} not found.`);
        return false;
      }
      const parameters: EbookParameters = project.parameters ? JSON.parse(project.parameters) : {};

      const allChapters = await chapterService.getChaptersByProjectId(projectId);
      const startChapterIndex = allChapters.findIndex(c => c.id === startChapterId);

      if (startChapterIndex === -1) {
        console.error(`Start chapter with ID ${startChapterId} not found in project ${projectId}.`);
        return false;
      }

      let success = true;

      for (let i = startChapterIndex; i < allChapters.length; i++) {
        const currentChapter = allChapters[i];
        console.log(`Generating content for Chapter ${currentChapter.order + 1}: "${currentChapter.title}" (ID: ${currentChapter.id})...`);

        let contextContent: string | null = null;
        if (parameters.continueNarrative && i > 0) {
            const prevChapter = allChapters[i - 1];
            contextContent = prevChapter.content || null;
            if (!contextContent) {
                 console.warn(`"Continue Narrative" is enabled, but previous chapter (ID: ${prevChapter.id}) has no content. Context will be limited.`);
            }
        }

        const contentPrompt = await this.generateChapterContentPrompt(
          project,
          currentChapter,
          contextContent
        );

        // Use the refactored processLLMPrompt which reads settings
        const contentResponse = await this.processLLMPrompt(contentPrompt);

        if (contentResponse) {
          const saveSuccess = await this.handleChapterContentResponse(contentResponse, currentChapter.id);
          if (!saveSuccess) {
            console.error(`Failed to save content for chapter ${currentChapter.id}. Continuing...`);
            success = false;
          }
          currentChapter.content = contentResponse; // Update for next iteration's context
        } else {
          console.error(`LLM failed to generate content for chapter ${currentChapter.id}. Skipping.`);
          success = false;
        }
      }

      console.log("Chapter sequence generation finished.");
      return success;
    } catch (error) {
      console.error('Error during chapter sequence generation:', error);
      return false;
    }
  }
};

// Example Usage section should be updated or removed as it uses old signatures
