import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { LlmProvider, ProviderConfig } from './types';

// Helper to create OpenAI client instance
const getClient = (config: ProviderConfig): OpenAI => {
  // Ensure API key is provided for OpenAI
  if (!config.apiKey) {
    console.error("OpenAI API Key is required but not provided in settings.");
    // Throw an error or handle it gracefully depending on desired behavior
    throw new Error("OpenAI API Key missing.");
  }
  return new OpenAI({
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true, // Necessary for WebContainer environment
  });
};

export const openaiProvider: LlmProvider = {
  async listModels(config: ProviderConfig): Promise<string[] | null> {
    try {
      const openai = getClient(config);
      console.log('Fetching models from OpenAI...');
      const list = await openai.models.list();
      const models = list.data.map(model => model.id).sort();
      console.log(`Fetched ${models.length} models from OpenAI.`);
      // Filter for GPT models or specific types if needed
      // return models.filter(m => m.toLowerCase().includes('gpt'));
      return models;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      if (error instanceof OpenAI.APIError) {
        console.error(`OpenAI API Error: ${error.status} - ${error.message}`, error.error);
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
      console.log(`Sending chat completion request to OpenAI model "${config.model}"...`);
      const chatCompletion = await openai.chat.completions.create({
        messages: messages,
        model: config.model,
        // Add temperature, max_tokens etc. from config if needed later
      });

      const responseContent = chatCompletion.choices[0]?.message?.content;

      if (!responseContent) {
        console.warn('OpenAI chat response was empty.');
        return null;
      }
      console.log('Received OpenAI chat response.');
      return responseContent;
    } catch (error) {
      console.error('Error getting OpenAI chat completion:', error);
      if (error instanceof OpenAI.APIError) {
        console.error(`OpenAI API Error: ${error.status} - ${error.message}`, error.error);
      }
      return null;
    }
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
     try {
        // Simple test: try listing models
        const models = await this.listModels(config);
        return models !== null && models.length > 0;
     } catch (error) {
        // Error is logged within listModels
        return false;
     }
  }
};
