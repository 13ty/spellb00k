import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { LlmProvider, ProviderConfig } from './types';

// Helper to create OpenAI client instance configured for Ollama
const getClient = (config: ProviderConfig): OpenAI => {
  if (!config.baseUrl) {
    console.error("Ollama Base URL is required but not provided in settings.");
    throw new Error("Ollama Base URL missing.");
  }
  // Ensure the base URL ends with /v1 for OpenAI compatibility
  const baseUrl = config.baseUrl.endsWith('/v1') ? config.baseUrl : `${config.baseUrl}/v1`;

  return new OpenAI({
    apiKey: 'ollama', // API key is not required for Ollama but library expects something
    baseURL: baseUrl,
    dangerouslyAllowBrowser: true,
  });
};

export const ollamaProvider: LlmProvider = {
  async listModels(config: ProviderConfig): Promise<string[] | null> {
    // Ollama's OpenAI-compatible /v1/models endpoint might not list all local models reliably.
    // A better approach is to use Ollama's native /api/tags endpoint.
    if (!config.baseUrl) {
        console.error("Ollama Base URL is required for listing models.");
        return null;
    }
    // Use native endpoint
    const tagsUrl = config.baseUrl.endsWith('/') ? `${config.baseUrl}api/tags` : `${config.baseUrl}/api/tags`;
    try {
        console.log(`Fetching models from Ollama native endpoint: ${tagsUrl}...`);
        const response = await fetch(tagsUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        // Assuming the response structure is { models: [{ name: "model:tag", ... }, ...] }
        const models = data?.models?.map((model: any) => model.name).sort() || [];
        console.log(`Fetched ${models.length} models from Ollama.`);
        return models;
    } catch (error) {
        console.error('Error fetching Ollama models via /api/tags:', error);
        // Fallback attempt via OpenAI compatible endpoint (might be less accurate)
        try {
            console.log('Attempting fallback: Fetching models from Ollama OpenAI-compatible endpoint...');
            const openai = getClient(config);
            const list = await openai.models.list();
            const models = list.data.map(model => model.id).sort();
            console.log(`Fetched ${models.length} models via fallback.`);
            return models;
        } catch (fallbackError) {
             console.error('Error fetching Ollama models via OpenAI endpoint fallback:', fallbackError);
             return null;
        }
    }
  },

  async getChatCompletion(
    messages: ChatCompletionMessageParam[],
    config: ProviderConfig
  ): Promise<string | null> {
    try {
      const openai = getClient(config);
      console.log(`Sending chat completion request to Ollama model "${config.model}" via OpenAI compatibility...`);
      const chatCompletion = await openai.chat.completions.create({
        messages: messages,
        model: config.model, // Ollama uses the model name directly
        // Ollama might ignore temperature/other params via this endpoint, check Ollama docs
      });

      const responseContent = chatCompletion.choices[0]?.message?.content;

      if (!responseContent) {
        console.warn('Ollama chat response was empty.');
        return null;
      }
      console.log('Received Ollama chat response.');
      return responseContent;
    } catch (error) {
      console.error('Error getting Ollama chat completion:', error);
       if (error instanceof OpenAI.APIError) {
        // Ollama might return OpenAI-like errors
        console.error(`Ollama API Error: ${error.status} - ${error.message}`, error.error);
      }
      return null;
    }
  },

   async testConnection(config: ProviderConfig): Promise<boolean> {
     // Test by trying to list models using the native endpoint first
     if (!config.baseUrl) return false;
     const tagsUrl = config.baseUrl.endsWith('/') ? `${config.baseUrl}api/tags` : `${config.baseUrl}/api/tags`;
     try {
        const response = await fetch(tagsUrl, { method: 'GET', mode: 'cors' }); // Ensure CORS mode if needed
        // Check if the response status is OK (2xx) or potentially redirect (3xx)
        // Also handle potential CORS errors if Ollama isn't configured correctly.
        console.log("Ollama connection test status:", response.status);
        return response.ok;
     } catch (error) {
        console.error('Ollama connection test failed:', error);
        return false;
     }
  }
};
