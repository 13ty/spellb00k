import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Configuration needed by provider methods
export interface ProviderConfig {
  apiKey?: string; // Optional: For OpenAI
  baseUrl?: string; // Optional: For Ollama, LMStudio, etc.
  model: string; // Required model name for the provider
  // Add other potential config like temperature, max_tokens later if needed globally
}

// Common interface for all LLM providers
export interface LlmProvider {
  /**
   * Lists available models from the provider.
   * Note: For local providers, this might require specific endpoints or might
   * return only loaded models depending on the API.
   */
  listModels(config: ProviderConfig): Promise<string[] | null>;

  /**
   * Gets a chat completion response based on the provided messages.
   */
  getChatCompletion(
    messages: ChatCompletionMessageParam[],
    config: ProviderConfig
  ): Promise<string | null>;

  /**
   * Optional: Tests the connection to the provider.
   * Could be a simple call like listModels or a dedicated health check.
   */
  testConnection?(config: ProviderConfig): Promise<boolean>;
}
