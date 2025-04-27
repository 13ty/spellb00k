# Backend Documentation

This document provides an overview of the backend services implemented for the Spell-b00k Ebook Generator application. These services handle data storage (in-memory via `sql.js` with manual file export/import), retrieval, and interaction with Large Language Models (LLMs).

## 1. Database Service (`src/lib/database.ts`)

**Purpose:** Manages the in-memory SQLite database using `sql.js`. Handles database initialization, export to/import from `Uint8Array` (for manual file save/load), and provides core functions for executing SQL queries. **Note:** Database state is lost when the browser tab is closed unless explicitly saved to a file by the user.

**Key Functions:**

*   `initialize()`: Initializes the in-memory database and creates tables if they don't exist.
*   `run(sql, params)`: Executes SQL commands (INSERT, UPDATE, DELETE, CREATE).
*   `get<T>(sql, params)`: Executes SELECT queries and returns an array of results.
*   `getOne<T>(sql, params)`: Executes SELECT queries and returns a single result or null.
*   `exportDatabase()`: Exports the current database state as a binary array (`Uint8Array`).
*   `loadDatabaseFromFile(data)`: Loads database state from a binary array, replacing the current in-memory database.

**Location:** `/home/project/src/lib/database.ts`

## 2. Project Service (`src/services/projectService.ts`)

**Purpose:** Provides functions for managing ebook projects stored in the `projects` table. Uses the `dbService` for database interactions.

**Key Functions:**

*   `createProject(name, description, parameters)`: Creates a new project.
*   `listProjects()`: Retrieves all projects.
*   `getProjectById(id)`: Retrieves a specific project by ID.
*   `updateProject(id, updates)`: Updates an existing project's details (name, description, parameters).
*   `deleteProject(id)`: Deletes a project and its associated chapters/messages (due to foreign key cascade).
*   `exportProjectToJson(projectId)`: Exports a project's data (details, parameters, chapters) to a structured object suitable for JSON export.

**Location:** `/home/project/src/services/projectService.ts`

## 3. Chapter Service (`src/services/chapterService.ts`)

**Purpose:** Provides functions for managing chapters associated with projects, stored in the `chapters` table. Uses the `dbService` for database interactions.

**Key Functions:**

*   `createChapter(projectId, title, description, content)`: Creates a new chapter for a project, automatically setting the order.
*   `getChaptersByProjectId(projectId)`: Retrieves all chapters for a specific project, ordered by sequence.
*   `getChapterById(id)`: Retrieves a specific chapter by ID.
*   `updateChapter(id, updates)`: Updates an existing chapter's details (title, description, content, order).
*   `updateChapterOrder(updates)`: Updates the order of multiple chapters (used for drag-and-drop).
*   `deleteChapter(id)`: Deletes a chapter.

**Location:** `/home/project/src/services/chapterService.ts`

## 4. LLM Service (`src/services/llmService.ts`) - Dispatcher

**Purpose:** Acts as a central dispatcher for LLM interactions. It loads LLM settings (provider, API key/URL, model) from `settingsService` and delegates the actual API calls to the appropriate provider module located in `src/providers/`. It also handles provider-agnostic tasks like prompt generation and response parsing.

**Key Functions:**

*   `generateEbookPlanPrompt(project)`: Creates the prompt string for generating the ebook plan.
*   `generateChapterContentPrompt(project, chapter, previousChapterContent)`: Creates the prompt string for generating content for a specific chapter.
*   `processLLMPrompt(prompt)`: Sends a single prompt to the configured LLM provider and returns the raw response. Used for plan generation, potentially chapter content.
*   `getChatResponse(projectId, messages)`: Sends chat history (with context) to the configured LLM provider and returns the assistant's response.
*   `listModels()`: Lists available models from the configured LLM provider.
*   `testConnection()`: Tests the connection to the configured LLM provider.
*   `handleEbookPlanResponse(response, projectId)`: Parses the LLM response for the ebook plan and creates chapters in the database.
*   `handleChapterContentResponse(response, chapterId)`: Saves the generated content from the LLM response to a specific chapter.
*   `parseEbookPlanResponse(response)`: Internal helper to parse the raw LLM plan response into a structured format.
*   `generateChapterSequenceContent(projectId, startChapterId)`: Generates content for a sequence of chapters using the configured provider.

**Location:** `/home/project/src/services/llmService.ts`

## 5. LLM Providers (`src/providers/`)

**Purpose:** Contains modules for specific LLM providers, each implementing a common `LlmProvider` interface (`src/providers/types.ts`). These modules handle the actual API communication with the respective LLM services.

**Implemented Providers:**

*   `openaiProvider.ts`: Interacts with the official OpenAI API using an API key.
*   `ollamaProvider.ts`: Interacts with a local Ollama instance using its OpenAI-compatible API (via `baseUrl`) and native `/api/tags` endpoint for model listing.
*   `lmstudioProvider.ts`: Interacts with a local LM Studio instance using its OpenAI-compatible API (via `baseUrl`).

**Location:** `/home/project/src/providers/`

## 6. Chat Service (`src/services/chatService.ts`)

**Purpose:** Manages chat messages associated with projects and chapters, stored in the `messages` table. Uses the `dbService` for database interactions.

**Key Functions:**

*   `addMessage(projectId, role, content, chapterId)`: Adds a new chat message.
*   `getMessages(projectId, chapterId)`: Retrieves chat messages for a project, optionally filtered by chapter.
*   `clearMessages(projectId, chapterId)`: Deletes chat messages for a project, optionally filtered by chapter.

**Location:** `/home/project/src/services/chatService.ts`

## 7. Settings Service (`src/lib/settingsService.ts`)

**Purpose:** Handles saving and loading LLM configuration settings (`provider`, `apiKey`, `baseUrl`, `model`) to/from the browser's `localStorage`.

**Key Functions:**

*   `loadLlmSettings()`: Loads settings from `localStorage` or returns defaults.
*   `saveLlmSettings(settings)`: Saves the provided settings object to `localStorage`.

**Location:** `/home/project/src/lib/settingsService.ts`

---
