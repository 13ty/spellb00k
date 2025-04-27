import React, { useState, useEffect } from 'react';
import { X, Save, Wifi, WifiOff } from 'lucide-react';
import { loadLlmSettings, saveLlmSettings, type LlmSettings } from '../../lib/settingsService';
import { llmService } from '../../services/llmService'; // Correct: Import llmService

// Removed incorrect imports:
// import { projectService } from './projectService';
// import { chapterService } from './chapterService';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<LlmSettings>(loadLlmSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]); // State for models
  const [isFetchingModels, setIsFetchingModels] = useState(false); // State for fetching models


  // Reload settings and fetch models when modal opens
  useEffect(() => {
    if (isOpen) {
      const currentSettings = loadLlmSettings();
      setSettings(currentSettings);
      setSaveSuccess(false);
      setTestStatus('idle');
      setTestMessage(null);
      setAvailableModels([]); // Clear models initially
      // Fetch models for the initially loaded provider
      fetchModelsForProvider(currentSettings);
    }
  }, [isOpen]);

  const fetchModelsForProvider = async (currentSettings: LlmSettings) => {
      // Don't fetch if provider requires API key and it's missing (for OpenAI)
      if (currentSettings.provider === 'openai' && !currentSettings.apiKey) {
          console.log("Skipping model fetch for OpenAI: API key missing.");
          setAvailableModels([]);
          return;
      }
       // Don't fetch if provider requires Base URL and it's missing (Ollama/LMStudio)
      if ((currentSettings.provider === 'ollama' || currentSettings.provider === 'lmstudio') && !currentSettings.baseUrl) {
          console.log(`Skipping model fetch for ${currentSettings.provider}: Base URL missing.`);
          setAvailableModels([]);
          return;
      }


      setIsFetchingModels(true);
      setAvailableModels([]); // Clear previous models
      console.log(`Fetching models for provider: ${currentSettings.provider}`);
      // Ensure settings are saved before fetching models, as llmService reads from storage
      saveLlmSettings(currentSettings);
      try {
          const models = await llmService.listModels();
          if (models) {
              setAvailableModels(models);
              console.log("Available models fetched:", models);
              // Auto-select the first model if current selection is invalid or empty
              if (!currentSettings.model || !models.includes(currentSettings.model)) {
                  if (models.length > 0) {
                      setSettings(prev => ({ ...prev, model: models[0] }));
                      console.log(`Auto-selected model: ${models[0]}`);
                  } else {
                       setSettings(prev => ({ ...prev, model: '' })); // No models available
                  }
              }
          } else {
              console.warn(`Could not fetch models for ${currentSettings.provider}.`);
              setTestMessage(`Could not fetch models for ${currentSettings.provider}. Check connection and settings.`);
              setTestStatus('error'); // Indicate an issue
          }
      } catch (error) {
          console.error("Error fetching models:", error);
          setTestMessage(`Error fetching models for ${currentSettings.provider}.`);
          setTestStatus('error');
      } finally {
          setIsFetchingModels(false);
      }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newSettings = { ...settings, [name]: value };
    setSettings(newSettings);
    setSaveSuccess(false); // Reset success message on change
    setTestStatus('idle'); // Reset test status on change

    // If provider changed, fetch models for the new provider
    if (name === 'provider') {
        setAvailableModels([]); // Clear old models immediately
        fetchModelsForProvider(newSettings);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    saveLlmSettings(settings);
    // Note: llmService will pick up new settings on its next call automatically
    // No need to reinstantiate anything globally here.
    setIsSaving(false);
    setSaveSuccess(true);
    // Optionally close modal on save: onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage(null);
    console.log("Testing LLM connection with current settings in modal:", settings);

    // IMPORTANT: Save the current settings before testing,
    // because llmService.testConnection() reads from localStorage.
    saveLlmSettings(settings);

    // Use the refactored llmService method
    const connectionSuccess = await llmService.testConnection();

    if (connectionSuccess) {
        setTestStatus('success');
        setTestMessage(`Successfully connected to ${settings.provider}.`);
        console.log("Connection test successful.");
        // Fetch models again after successful test to ensure list is up-to-date
        fetchModelsForProvider(settings);
    } else {
        setTestStatus('error');
        setTestMessage(`Failed to connect to ${settings.provider}. Check URL/API Key, model name, network access, and Ollama/LMStudio server status.`);
        console.error("Connection test failed.");
        setAvailableModels([]); // Clear models on connection failure
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-6">Options</h2>

        {/* LLM Configuration Section */}
        <div className="mb-6 border-b pb-4">
          <h3 className="text-lg font-medium mb-3 text-gray-800">LLM Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                id="provider"
                name="provider"
                value={settings.provider}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="openai">OpenAI</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="lmstudio">LM Studio (Local)</option>
                {/* Add other providers here */}
              </select>
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Model Name
              </label>
               <div className="flex items-center space-x-2">
                 <select
                    id="model"
                    name="model"
                    value={settings.model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                    disabled={isFetchingModels || availableModels.length === 0}
                  >
                    {isFetchingModels ? (
                        <option>Loading models...</option>
                    ) : availableModels.length === 0 ? (
                        <option>No models found/available</option>
                    ) : (
                        <>
                         <option value="">Select a model...</option>
                         {availableModels.map(modelName => (
                           <option key={modelName} value={modelName}>{modelName}</option>
                         ))}
                        </>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => fetchModelsForProvider(settings)}
                    disabled={isFetchingModels}
                    className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    title="Refresh model list"
                  >
                     {isFetchingModels ? (
                         <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                     ) : (
                         <RefreshCw size={16} /> // Refresh icon
                     )}
                  </button>
               </div>
               <p className="mt-1 text-xs text-gray-500">
                {settings.provider === 'lmstudio' ? 'Select loaded model from LM Studio.' : 'Select model or type custom.'}
               </p>
            </div>
          </div>

          {/* Conditional Fields */}
          {settings.provider === 'openai' && (
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                value={settings.apiKey}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="sk-..."
              />
            </div>
          )}

          {(settings.provider === 'ollama' || settings.provider === 'lmstudio') && (
            <div className="mb-4">
              <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
                {settings.provider === 'ollama' ? 'Ollama' : 'LM Studio'} Base URL
              </label>
              <input
                type="text"
                id="baseUrl"
                name="baseUrl"
                value={settings.baseUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={settings.provider === 'ollama' ? "http://localhost:11434" : "http://localhost:1234/v1"}
              />
               <p className="mt-1 text-xs text-gray-500">
                {settings.provider === 'lmstudio' ? 'Include /v1 in the URL.' : 'Ensure server is running and accessible (check network/CORS).'}
               </p>
            </div>
          )}

          {/* Test Connection Button and Status */}
          <div className="flex items-center space-x-3 mt-4">
             <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
              >
                 {testStatus === 'testing' ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 ) : testStatus === 'success' ? (
                    <Wifi size={16} className="mr-2 text-green-600" />
                 ) : testStatus === 'error' ? (
                     <WifiOff size={16} className="mr-2 text-red-600" />
                 ) : null}
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
              {testMessage && (
                  <span className={`text-sm ${testStatus === 'success' ? 'text-green-600' : testStatus === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                      {testMessage}
                  </span>
              )}
          </div>

        </div>

        {/* TODO: Add Prompt Template Section */}
        {/* <div className="mb-6 border-b pb-4"> ... </div> */}

        {/* Save Button */}
        <div className="flex justify-end items-center space-x-3 mt-6">
           {saveSuccess && <span className="text-green-600 text-sm">Settings saved!</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Import RefreshCw icon
import { RefreshCw } from 'lucide-react';

export default OptionsModal;
