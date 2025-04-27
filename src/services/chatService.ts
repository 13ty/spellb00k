// src/services/chatService.ts
import { dbService } from '../lib/database';
import type { ChatMessage } from '../types/models';

export const chatService = {
  /**
   * Adds a new chat message to the database.
   * @param projectId - The ID of the project the message belongs to.
   * @param role - The role of the message sender ('user', 'assistant', 'system').
   * @param content - The message text.
   * @param chapterId - Optional: The ID of the chapter context for the message.
   * @returns The newly created chat message object or null if creation failed.
   */
  async addMessage(
    projectId: number,
    role: ChatMessage['role'],
    content: string,
    chapterId?: number
  ): Promise<ChatMessage | null> {
    try {
      // ##@@TAG: Create Chat Message
      await dbService.run(
        'INSERT INTO messages (projectId, chapterId, role, content) VALUES (?, ?, ?, ?)',
        [projectId, chapterId ?? null, role, content]
      );

      // Retrieve the newly created message
      const newMessage = await dbService.getOne<ChatMessage>(
        'SELECT * FROM messages WHERE id = last_insert_rowid()'
      );

      return newMessage;
    } catch (error) {
      console.error('Error adding chat message:', error);
      return null;
    }
  },

  /**
   * Retrieves chat messages for a specific project, optionally filtered by chapter.
   * Messages are ordered by creation time.
   * @param projectId - The ID of the project.
   * @param chapterId - Optional: The ID of the chapter to filter messages by.
   * @returns An array of chat message objects.
   */
  async getMessages(projectId: number, chapterId?: number): Promise<ChatMessage[]> {
    try {
      let sql = 'SELECT * FROM messages WHERE projectId = ?';
      const params: (number | null)[] = [projectId];

      if (chapterId !== undefined) {
        sql += ' AND chapterId IS ?';
        params.push(chapterId);
      } else {
         // If no chapterId is specified, retrieve messages not linked to a specific chapter
         // or retrieve all messages for the project? Let's retrieve all for the project for now.
         // If we want only project-level messages, change WHERE clause to `WHERE projectId = ? AND chapterId IS NULL`
      }

      sql += ' ORDER BY createdAt ASC'; // Order by time

      // ##@@TAG: Fetch Chat Messages
      const messages = await dbService.get<ChatMessage>(sql, params);
      return messages;
    } catch (error) {
      console.error(`Error getting chat messages for project ID ${projectId}:`, error);
      return [];
    }
  },

   /**
   * Deletes all chat messages for a specific project, optionally filtered by chapter.
   * Useful for clearing chat history.
   * @param projectId - The ID of the project.
   * @param chapterId - Optional: The ID of the chapter to filter messages by.
   * @returns True if deletion was successful, false otherwise.
   */
  async clearMessages(projectId: number, chapterId?: number): Promise<boolean> {
     try {
        let sql = 'DELETE FROM messages WHERE projectId = ?';
        const params: (number | null)[] = [projectId];

        if (chapterId !== undefined) {
           sql += ' AND chapterId IS ?';
           params.push(chapterId);
        }

        // ##@@TAG: Delete Chat Messages
        await dbService.run(sql, params);
        console.log(`Cleared chat messages for project ${projectId}${chapterId !== undefined ? ` and chapter ${chapterId}` : ''}.`);
        return true;
     } catch (error) {
        console.error(`Error clearing chat messages for project ID ${projectId}:`, error);
        return false;
     }
   }

  // TODO: Add function to integrate chat history into LLM prompts (might live in llmService or here)
};

// Example Usage (can be removed or placed in a test file)
/*
import { dbService } from '../lib/database';
import { projectService } from './projectService';
import { chapterService } from './chapterService';

async function testChatService() {
  console.log("Initializing DB for chat test...");
  await dbService.initialize();

  console.log("Creating a test project...");
  let testProject = await projectService.createProject('Chat Test Project');
  if (!testProject) { console.error("Failed to create test project."); return; }
  const projectId = testProject.id;

  console.log("Creating a test chapter...");
  let testChapter = await chapterService.createChapter(projectId, 'Test Chapter 1', 'Description');
   if (!testChapter) { console.error("Failed to create test chapter."); return; }
   const chapterId = testChapter.id;


  console.log("Adding messages...");
  await chatService.addMessage(projectId, 'user', 'Hello LLM!');
  await chatService.addMessage(projectId, 'assistant', 'Hello User!');
  await chatService.addMessage(projectId, 'user', 'How are you?', chapterId); // Chapter-specific message
  await chatService.addMessage(projectId, 'assistant', 'I am fine, thank you!', chapterId); // Chapter-specific message


  console.log("Getting all messages for project...");
  const allMessages = await chatService.getMessages(projectId);
  console.log("All Messages:", allMessages);

  console.log(`Getting messages for chapter ${chapterId}...`);
  const chapterMessages = await chatService.getMessages(projectId, chapterId);
  console.log("Chapter Messages:", chapterMessages);

  console.log("Clearing chapter-specific messages...");
  await chatService.clearMessages(projectId, chapterId);
  const remainingMessages = await chatService.getMessages(projectId);
  console.log("Remaining Messages after clearing chapter:", remainingMessages);

   console.log("Clearing all project messages...");
   await chatService.clearMessages(projectId);
   const finalMessages = await chatService.getMessages(projectId);
   console.log("Remaining Messages after clearing project:", finalMessages);


  console.log("Cleaning up test project...");
  await projectService.deleteProject(projectId);

  console.log("Saving DB...");
  await dbService.save();
}

// To run the test, uncomment the line below
// testChatService().catch(console.error);
*/
