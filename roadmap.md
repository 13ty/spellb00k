# Spell-b00k Project Roadmap

This document outlines the development progress and remaining tasks for the Spell-b00k Ebook Generator application.

**Current Status:** Debugging WASM loading issues and UI glitches (Projects menu hover). Local testing environment setup pending resolution of WASM issue.

## Phase 1: Backend Development (Mostly Complete)

**Goal:** Implement core data management and LLM interaction logic.

### Completed Tasks:

*   [x] Project Setup (Vite, React, TypeScript, Tailwind CSS)
*   [x] Local Database Setup (`sql.js`)
    *   [x] Database initialization (`dbService.initialize`)
    *   [x] Basic SQL execution functions (`run`, `get`, `getOne`)
    *   [x] Table schema definition (`projects`, `chapters`, `messages`)
    *   [x] Database Export/Import (`dbService.exportDatabase`, `dbService.loadDatabaseFromFile`) - *Note: Operates in-memory, requires manual save/load via UI.*
*   [x] Data Models (`src/types/models.ts`)
    *   [x] Define `Project`, `Chapter`, `EbookParameters`, `ChatMessage` interfaces
    *   [x] Added `continueNarrative`, `narrativeHooks` to `EbookParameters`
*   [x] Project Management Service (`src/services/projectService.ts`)
    *   [x] Create, List, Get, Update, Delete Project functions
    *   [x] Export Project to JSON function (`exportProjectToJson`)
*   [x] Chapter Management Service (`src/services/chapterService.ts`)
    *   [x] Create, Get by Project, Get by ID, Update, Delete Chapter functions
    *   [x] Update Chapter Order (`updateChapterOrder`) for drag-and-drop
*   [x] LLM Service Refactoring (`src/services/llmService.ts` as Dispatcher)
    *   [x] Prompt generation logic (`generateEbookPlanPrompt`, `generateChapterContentPrompt`) - Updated for new parameters.
    *   [x] Response handling logic (`handleEbookPlanResponse`, `handleChapterContentResponse`, `parseEbookPlanResponse`)
    *   [x] Modular Provider Structure (`src/providers/`)
        *   [x] Defined `LlmProvider` interface (`src/providers/types.ts`)
        *   [x] Implemented `openaiProvider.ts`
        *   [x] Implemented `ollamaProvider.ts` (OpenAI compatible API + native tags)
        *   [x] Implemented `lmstudioProvider.ts` (OpenAI compatible API)
    *   [x] `llmService` acts as dispatcher, loading settings and calling active provider.
    *   [x] Implemented `listModels` and `testConnection` via providers.
    *   [x] Implemented `getChatResponse` via providers.
    *   [x] Implemented `generateChapterSequenceContent` using configured provider.
*   [x] Settings Service (`src/lib/settingsService.ts`)
    *   [x] Save/Load LLM settings (provider, apiKey, baseUrl, model) to `localStorage`.
*   [x] Chat Service (`src/services/chatService.ts`)
    *   [x] Add, Get, Clear chat messages.

### Remaining/Ongoing Tasks:

*   [ ] **Error Handling & Validation:** Improve error handling across all services and add input validation (Ongoing).
*   [ ] **File Export/Import (Advanced):** Implement export to other formats (Markdown, potentially basic text). JSON export for project data structure is done via `projectService`.
*   [ ] **Chat Integration:** Integrate chat more deeply with chapter generation (e.g., using chat context for generation, allowing edits via chat).

## Phase 2: Frontend Development (In Progress)

**Goal:** Build the user interface to interact with the backend services.

### Completed Tasks:

*   [x] **Basic Layout & Navigation:** Set up the main application layout (`App.tsx`).
*   [x] **Top Menu Bar (`TopMenuBar.tsx`):**
    *   [x] Replaced `FileOperations` component.
    *   [x] "Projects" dropdown (New, Load, Save, Edit). - *UI Glitch (hover) - Fix Attempted*
    *   [x] "Options" button.
    *   [x] Integrated Logo.
*   [x] **Project Management UI:**
    *   [x] List existing projects (`ProjectList.tsx`).
    *   [x] Load/Delete projects from list.
    *   [x] Modal for Creating New Projects (`NewProjectModal.tsx`).
    *   [x] Modal for Editing Projects (`EditProjectModal.tsx`) - Includes description.
*   [x] **Ebook Parameters UI:**
    *   [x] Form to input/edit project parameters (`EbookParametersForm.tsx`).
    *   [x] Added fields for `continueNarrative` and `narrativeHooks`.
*   [x] **Chapter Outline UI (`ChapterManager.tsx`):**
    *   [x] Display the list of chapters.
    *   [x] Trigger ebook plan generation from LLM (clears existing chapters after confirmation).
    *   [x] Manually add/edit/delete chapters.
    *   [x] Implement drag-and-drop reordering of chapters (Native HTML5 API).
*   [x] **Chapter Content UI (`ChapterManager.tsx`):**
    *   [x] Display content preview.
    *   [x] Allow editing chapter content in a textarea.
    *   [x] Trigger chapter content generation from LLM.
*   [x] **LLM Configuration UI (`OptionsModal.tsx`):**
    *   [x] Select LLM provider (OpenAI, Ollama, LM Studio).
    *   [x] Input API keys/endpoints.
    *   [x] Select Model (dynamic list fetching).
    *   [x] Test Connection button.
    *   [x] Save settings to `localStorage`.
*   [x] **Chat Interface (`ChatInterface.tsx`):**
    *   [x] Display chat history.
    *   [x] Input field for user messages.
    *   [x] Send messages to backend/LLM (using configured provider).
    *   [x] Basic styling with Papyrus background.

### Remaining/Ongoing Tasks:

*   [ ] **UI Glitches:** Fix "Projects" menu hover issue. (Ongoing)
*   [ ] **WASM Loading:** Resolve persistent WASM loading error. (Ongoing)
*   [ ] **Progress Indicators:** Show better loading states during LLM calls and other async operations.
*   [ ] **Chapter Outline UI:** Allow direct editing of chapter titles/descriptions in the list (optional enhancement).
*   [ ] **Refinements:** Improve overall UI/UX based on testing.

## Phase 3: Refinement & Additional Features (Future)

**Goal:** Improve user experience, add advanced features.

### Potential Tasks:

*   [ ] Rich text editor for chapter content (e.g., Markdown editor).
*   [ ] Export to different formats (PDF, EPUB - might be complex).
*   [ ] Advanced parameter options (e.g., temperature, max tokens).
*   [ ] Advanced context management for LLM calls (e.g., summarizing previous chapters instead of full text).
*   [ ] Prompt Template Management (Allow user editing/selection in Options).
*   [ ] Theme/Template Switching (UI customization).
*   [ ] "Report Bug" feature.
*   [ ] User authentication (if needed for cloud storage later).
*   [ ] Testing (Unit, Integration).
*   [ ] Performance optimizations (especially addressing preview lag if possible).

---
