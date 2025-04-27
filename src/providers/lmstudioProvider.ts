import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { LlmProvider, ProviderConfig } from './types';

// Helper to create OpenAI client instance configured for LMStudio
const getClient = (config: ProviderConfig): OpenAI => {
  if (!config.baseUrl) {
    console.error("LMStudio Base URL is required but not provided in settings.");
    throw new Error("LMStudio Base URL missing.");
  }
  // Base URL from settings should already include /v1 according to LMStudio docs
  return new OpenAI({
    apiKey: 'lmstudio', // API key is not required but library expects something
    baseURL: config.baseUrl,
    dangerouslyAllowBrowser: true,
  });
};

export const lmstudioProvider: LlmProvider = {
  async listModels(config: ProviderConfig): Promise<string[] | null> {
    try {
      const openai = getClient(config);
      console.log('Fetching models from LMStudio...');
      // LMStudio's /v1/models lists *loaded* models
      const list = await openai.models.list();
      // The 'id' usually contains the path or identifier used within LMStudio
      const models = list.data.map(model => model.id).sort();
      console.log(`Fetched ${models.length} models from LMStudio (currently loaded).`);
      return models;
    } catch (error) {
      console.error('Error fetching LMStudio models:', error);
      if (error instanceof OpenAI.APIError) {
        console.error(`LMStudio API Error: ${error.status} - ${error.message}`, error.error);
      }
      return null;
    }
  },

  async getChatCompletion(
    messages: ChatCompletionMessageParam[],
    config: ProviderConfig
  ): Promise<string | null> {
    try {
      const openai = getClient(config);
      console.log(`Sending chat completion request to LMStudio model "${config.model}"...`);
      const chatCompletion = await openai.chat.completions.create({
        messages: messages,
        // For LMStudio, the model parameter might need to be the specific identifier
        // shown in LMStudio, not just a generic name. User needs to ensure this matches.
        model: config.model,
        // Add temperature etc. if supported and needed
      });

      const responseContent = chatCompletion.choices[0]?.message?.content;

      if (!responseContent) {
        console.warn('LMStudio chat response was empty.');
        return null;
      }
      console.log('Received LMStudio chat response.');
      return responseContent;
    } catch (error) {
      console.error('Error getting LMStudio chat completion:', error);
       if (error instanceof OpenAI.APIError) {
        console.error(`LMStudio API Error: ${error.status} - ${error.message}`, error.error);
      }
      return null;
    }
  },

   async testConnection(config: ProviderConfig): Promise<boolean> {
     try {
        // Simple test: try listing loaded models
        const models = await this.listModels(config);
        // Successful connection even if no models are loaded (returns empty array)
        return models !== null;
     } catch (error) {
        // Error is logged within listModels
        return false;
     }
  }
};
