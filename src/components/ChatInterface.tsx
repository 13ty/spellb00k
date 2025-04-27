import React, { useState, useEffect, useRef } from 'react';
import type { Project, ChatMessage } from '../types/models';
import { chatService } from '../services/chatService';
import { llmService } from '../services/llmService';
import { Send, RefreshCw } from 'lucide-react'; // Added RefreshCw just in case, Send is used

interface ChatInterfaceProps {
  project: Project;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ project }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedMessages = await chatService.getMessages(project.id);
        setMessages(fetchedMessages);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
        setError('Failed to load chat history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [project.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessageContent = newMessage;
    const currentUserMessages = [...messages];

    const optimisticUserMessage: ChatMessage = {
      id: Date.now(),
      projectId: project.id,
      role: 'user',
      content: userMessageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMessage]);
    setNewMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const addedUserMessage = await chatService.addMessage(
        project.id, 'user', userMessageContent
      );

      if (!addedUserMessage) {
         setError("Failed to send your message. Please try again.");
         setMessages(currentUserMessages);
         setIsLoading(false);
         return;
      }

      const messagesForLlm = [...currentUserMessages, addedUserMessage];

      console.log("Getting LLM chat response...");
      const llmResponseContent = await llmService.getChatResponse(
          project.id,
          messagesForLlm
      );

      if (llmResponseContent) {
         const addedAssistantMessage = await chatService.addMessage(
             project.id, 'assistant', llmResponseContent
         );
         if (addedAssistantMessage) {
            // Replace optimistic user message with the real one if needed,
            // then add assistant message. For simplicity, just add assistant message.
            // Find index of optimistic message
            // const optimisticIndex = messages.findIndex(m => m.id === optimisticUserMessage.id);
            // setMessages(prev => [
            //     ...prev.slice(0, optimisticIndex), // Messages before
            //     addedUserMessage, // Real user message
            //     ...prev.slice(optimisticIndex + 1), // Messages after (if any)
            //     addedAssistantMessage // New assistant message
            // ]);
             setMessages(prev => [...prev, addedAssistantMessage]); // Simpler update
         } else {
             setError("LLM responded, but failed to save the response.");
         }
      } else {
         setError("The assistant failed to respond. Please try again.");
         // Revert optimistic user message on LLM failure
         setMessages(currentUserMessages);
      }

    } catch (err) {
      console.error('Error sending message or getting LLM response:', err);
      setError('An error occurred during the chat interaction.');
      setMessages(currentUserMessages); // Revert on general error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">Chat</h3>
      {/* Apply papyrus background using Tailwind classes */}
      <div
        className="h-96 overflow-y-auto border rounded p-4 mb-4 flex flex-col space-y-2 bg-[url('/papyrus-bg.jpg')] bg-cover bg-center"
        // style={{ backgroundImage: "url('/papyrus-bg.jpg')" }} // Alternative inline style
      >
        {isLoading && messages.length === 0 && <p className="text-gray-700 bg-white/70 p-1 rounded backdrop-blur-sm">Loading chat history...</p>}
        {error && <p className="text-red-700 bg-red-100/70 p-1 rounded backdrop-blur-sm">{error}</p>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-[80%] shadow ${ // Added shadow
              msg.role === 'user'
                ? 'bg-blue-200/80 self-end backdrop-blur-sm' // Added transparency + blur
                : 'bg-yellow-100/80 self-start backdrop-blur-sm' // Changed assistant bg + added transparency/blur
            }`}
          >
            <span className="font-bold capitalize text-sm text-gray-800">{msg.role}</span>
            <p className="text-sm text-black">{msg.content}</p> {/* Ensure text is readable */}
            <span className="text-xs text-gray-600 block text-right mt-1">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && messages.length > 0 && (
            <div className="p-2 rounded max-w-[80%] bg-gray-200/80 self-start animate-pulse shadow backdrop-blur-sm">
                 <span className="font-bold capitalize text-sm text-gray-800">Assistant</span>
                 <p className="text-sm text-gray-500">thinking...</p>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !newMessage.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} className="mr-1" /> Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
