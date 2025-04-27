// src/lib/settingsService.ts

// Define the structure of our settings
export interface LlmSettings {
  provider: 'openai' | 'ollama' | string; // Allow custom string for future providers
  apiKey: string; // For OpenAI primarily
  baseUrl: string; // For Ollama or other self-hosted
  model: string; // Default model for the selected provider
}

const SETTINGS_KEY = 'spellb00k_llm_settings';

// Default settings
const defaultSettings: LlmSettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'http://localhost:11434', // Default Ollama URL
  model: 'gpt-3.5-turbo', // Default OpenAI model
};

/**
 * Loads LLM settings from localStorage.
 * @returns The loaded settings or default settings if none found.
 */
export function loadLlmSettings(): LlmSettings {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      // Merge with defaults to ensure all keys are present
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error("Error loading LLM settings from localStorage:", error);
  }
  return defaultSettings;
}

/**
 * Saves LLM settings to localStorage.
 * @param settings - The settings object to save.
 */
export function saveLlmSettings(settings: LlmSettings): void {
  try {
    // Basic validation before saving
    const settingsToSave: LlmSettings = {
        provider: settings.provider?.trim() || defaultSettings.provider,
        apiKey: settings.apiKey?.trim() || '', // Allow empty API key
        baseUrl: settings.baseUrl?.trim() || defaultSettings.baseUrl,
        model: settings.model?.trim() || '', // Allow empty model initially
    };
    // Set default model based on provider if model is empty
    if (!settingsToSave.model) {
        settingsToSave.model = settingsToSave.provider === 'ollama' ? 'llama3' : defaultSettings.model; // Example default for ollama
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
    console.log("LLM settings saved:", settingsToSave);
  } catch (error) {
    console.error("Error saving LLM settings to localStorage:", error);
  }
}
