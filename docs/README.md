# Spell-b00k Documentation

Welcome to the documentation for Spell-b00k, an Ebook Generator application.

## Overview

Spell-b00k aims to assist users in planning, outlining, and generating content for ebooks using Large Language Models (LLMs). It provides a user interface for managing projects, chapters, and interacting with configured LLM providers.

## Key Features

*   **Project Management:** Create, load, save, edit, and delete ebook projects.
*   **Ebook Parameters:** Define parameters like genre, audience, style, tone, and specific LLM instructions (including narrative continuity and hooks).
*   **Chapter Management:**
    *   Manually add, edit, and delete chapters.
    *   Generate chapter outlines (plan) using an LLM based on project parameters.
    *   Reorder chapters using drag-and-drop.
*   **Content Generation:**
    *   Generate content for individual chapters using an LLM.
    *   Generate content for a sequence of chapters, optionally using previous chapter context.
    *   Edit generated chapter content.
*   **LLM Interaction:**
    *   Interactive chat interface for discussing the project with an LLM.
    *   Configurable LLM provider support (OpenAI, Ollama, LM Studio currently).
    *   Select specific models for the chosen provider.
    *   Test connection to the configured LLM provider.
*   **Persistence:** Save and load entire project state (including chapters and messages) to/from local `.db` files.

## Getting Started

1.  **Installation:** Run `npm install` to install dependencies.
2.  **Configuration:**
    *   Open the application and click the "Options" button in the top menu bar.
    *   Select your desired LLM provider (e.g., OpenAI, Ollama, LM Studio).
    *   Enter the required credentials (API Key for OpenAI, Base URL for Ollama/LM Studio). Ensure local servers (Ollama/LM Studio) are running and accessible.
    *   Select a model compatible with your chosen provider.
    *   Use "Test Connection" to verify settings.
    *   Click "Save Settings".
3.  **Usage:**
    *   Use the "Projects" menu to create a "New Project" or "Load Project..." from a previously saved `.db` file.
    *   Once a project is loaded:
        *   Edit the project name and description via the "Projects" -> "Edit Project" menu option.
        *   Configure "Ebook Parameters" for the LLM.
        *   Use the "Chapters" section to "Generate Ebook Plan", "Add Chapter Manually", or manage existing chapters (edit details, generate/edit content, reorder, delete).
        *   Use the "Chat" section to interact with the configured LLM about your project.
    *   Remember to use "Projects" -> "Save Project" to save your progress to a `.db` file before closing the application.

## Project Structure

*   **`public/`**: Static assets (images, WASM file).
*   **`src/`**: Main application source code.
    *   **`components/`**: React UI components.
        *   **`modals/`**: Modal dialog components.
    *   **`lib/`**: Core libraries and services (database, settings).
    *   **`providers/`**: Modules for specific LLM provider interactions.
    *   **`services/`**: Business logic services (project, chapter, chat, llm dispatcher).
    *   **`types/`**: TypeScript type definitions.
    *   `App.tsx`: Main application component, state management.
    *   `main.tsx`: Application entry point.
*   **`docs/`**: Project documentation.

*(More details can be added here as needed)*
