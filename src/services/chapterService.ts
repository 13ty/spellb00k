// src/services/chapterService.ts
import { dbService } from '../lib/database';
import type { Chapter } from '../types/models';

export const chapterService = {
  /**
   * Creates a new chapter for a given project.
   * Determines the next order value automatically.
   * @param projectId - The ID of the project this chapter belongs to.
   * @param title - The title of the chapter.
   * @param description - The description of the chapter.
   * @param content - Optional initial content for the chapter.
   * @returns The newly created chapter object or null if creation failed.
   */
  async createChapter(
    projectId: number,
    title: string,
    description: string,
    content?: string
  ): Promise<Chapter | null> {
    try {
      // Determine the next order value for this project
      const result = await dbService.getOne<{ maxOrder: number | null }>(
        'SELECT MAX("order") as maxOrder FROM chapters WHERE projectId = ?',
        [projectId]
      );
      const nextOrder = (result?.maxOrder ?? -1) + 1; // Start order from 0 or handle null case

      // Insert the new chapter
      await dbService.run(
        'INSERT INTO chapters (projectId, title, description, content, "order") VALUES (?, ?, ?, ?, ?)',
        [projectId, title, description, content ?? null, nextOrder]
      );

      // Retrieve the newly created chapter
      const newChapter = await dbService.getOne<Chapter>(
        'SELECT * FROM chapters WHERE id = last_insert_rowid()'
      );

      return newChapter;
    } catch (error) {
      console.error('Error creating chapter:', error);
      return null;
    }
  },

  /**
   * Retrieves all chapters for a specific project, ordered by their sequence.
   * @param projectId - The ID of the project.
   * @returns An array of chapter objects.
   */
  async getChaptersByProjectId(projectId: number): Promise<Chapter[]> {
    try {
      const chapters = await dbService.get<Chapter>(
        'SELECT * FROM chapters WHERE projectId = ? ORDER BY "order" ASC',
        [projectId]
      );
      return chapters;
    } catch (error) {
      console.error(`Error getting chapters for project ID ${projectId}:`, error);
      return [];
    }
  },

  /**
   * Retrieves a single chapter by its ID.
   * @param id - The ID of the chapter.
   * @returns The chapter object or null if not found.
   */
  async getChapterById(id: number): Promise<Chapter | null> {
    try {
      const chapter = await dbService.getOne<Chapter>(
        'SELECT * FROM chapters WHERE id = ?',
        [id]
      );
      return chapter;
    } catch (error) {
      console.error(`Error getting chapter with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Updates an existing chapter.
   * @param id - The ID of the chapter to update.
   * @param updates - An object containing the fields to update (title, description, content, order).
   * @returns The updated chapter object or null if not found or update failed.
   */
  async updateChapter(
    id: number,
    updates: Partial<Pick<Chapter, 'title' | 'description' | 'content' | 'order'>>
  ): Promise<Chapter | null> {
    const fieldsToUpdate: string[] = [];
    const values: (string | number | null)[] = [];

    // Use quotes for "order" if necessary, depending on SQL dialect/driver specifics
    const orderKey = '"order"'; // Standard SQL identifier quoting

    if (updates.title !== undefined) {
      fieldsToUpdate.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fieldsToUpdate.push('description = ?');
      values.push(updates.description);
    }
    if (updates.content !== undefined) {
      fieldsToUpdate.push('content = ?');
      values.push(updates.content);
    }
    if (updates.order !== undefined) {
      fieldsToUpdate.push(`${orderKey} = ?`);
      values.push(updates.order);
    }

    if (fieldsToUpdate.length === 0) {
      console.warn('No fields provided for chapter update.');
      return this.getChapterById(id); // Return current chapter if no updates
    }

    // Add updatedAt trigger manually if not using DB triggers (DB triggers are set up)
    // fieldsToUpdate.push('updatedAt = CURRENT_TIMESTAMP');

    const sql = `UPDATE chapters SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    values.push(id);

    try {
      await dbService.run(sql, values);
      return this.getChapterById(id); // Fetch the updated chapter
    } catch (error) {
      console.error(`Error updating chapter with ID ${id}:`, error);
      return null;
    }
  },

   /**
   * Updates the order of multiple chapters, typically after a drag-and-drop operation.
   * This requires careful handling to avoid constraint violations if order is unique per project.
   * Assuming 'order' doesn't have a unique constraint per project for simplicity here.
   * A more robust implementation might involve temporary values or deferred constraints.
   * @param updates - An array of objects, each containing chapter `id` and new `order`.
   * @returns True if all updates were successful, false otherwise.
   */
  async updateChapterOrder(updates: { id: number; order: number }[]): Promise<boolean> {
    if (updates.length === 0) return true;

    // Simple approach: update each chapter individually.
    // For performance or complex constraints, a single transaction (if supported) or more complex SQL might be needed.
    // sql.js doesn't support complex transactions easily across multiple statements in this helper structure.
    try {
      for (const update of updates) {
        await dbService.run('UPDATE chapters SET "order" = ? WHERE id = ?', [
          update.order,
          update.id,
        ]);
      }
      // Note: This doesn't automatically re-fetch or return the updated chapters.
      // The caller might need to re-fetch the chapter list for the project.
      return true;
    } catch (error) {
      console.error('Error updating chapter order:', error);
      // Consider rollback logic if this were a real transaction
      return false;
    }
  },


  /**
   * Deletes a chapter.
   * Note: This might affect the ordering of subsequent chapters if not handled carefully
   * (e.g., re-numbering might be desired, but is not done automatically here).
   * @param id - The ID of the chapter to delete.
   * @returns True if deletion was successful, false otherwise.
   */
  async deleteChapter(id: number): Promise<boolean> {
    try {
      // Optional: Before deleting, get the chapter's projectId and order if re-ordering is needed.
      // const chapter = await this.getChapterById(id);
      await dbService.run('DELETE FROM chapters WHERE id = ?', [id]);
      // Optional: After deleting, re-order subsequent chapters for the same project if needed.
      // if (chapter) { await this.renumberChapters(chapter.projectId, chapter.order); }
      return true; // Assume success if no error thrown
    } catch (error) {
      console.error(`Error deleting chapter with ID ${id}:`, error);
      return false;
    }
  },

  // Optional helper function if re-numbering is needed after deletion or complex re-ordering
  /*
  async renumberChapters(projectId: number, startingOrder: number): Promise<void> {
    try {
      // This is a simplified example; actual renumbering might be more complex
      await dbService.run(
        'UPDATE chapters SET "order" = "order" - 1 WHERE projectId = ? AND "order" > ?',
        [projectId, startingOrder]
      );
    } catch (error) {
      console.error(`Error renumbering chapters for project ${projectId}:`, error);
    }
  }
  */
};

// Example Usage (can be removed or placed in a test file)
/*
import { projectService } from './projectService'; // Assuming projectService is in the same directory

async function testChapterService() {
  console.log("Initializing DB for chapter test...");
  await dbService.initialize(); // Ensure DB is ready

  console.log("Creating a test project first...");
  let testProject = await projectService.createProject('Chapter Test Project');
  if (!testProject) {
    console.error("Failed to create test project. Aborting chapter test.");
    return;
  }
  console.log("Test Project Created:", testProject);
  const projectId = testProject.id;

  console.log("Creating Chapter 1...");
  const chapter1 = await chapterService.createChapter(projectId, 'Introduction', 'Overview of the topic');
  console.log("Created Chapter 1:", chapter1);

  console.log("Creating Chapter 2...");
  const chapter2 = await chapterService.createChapter(projectId, 'Core Concepts', 'Detailed explanation');
  console.log("Created Chapter 2:", chapter2);

  console.log(`Listing chapters for project ${projectId}...`);
  const chapters = await chapterService.getChaptersByProjectId(projectId);
  console.log("Chapters:", chapters);

  if (chapter1) {
    console.log(`Getting chapter ${chapter1.id}...`);
    const fetchedChapter1 = await chapterService.getChapterById(chapter1.id);
    console.log("Fetched Chapter 1:", fetchedChapter1);

    console.log(`Updating chapter ${chapter1.id}...`);
    const updatedChapter1 = await chapterService.updateChapter(chapter1.id, {
      description: 'A revised overview of the topic',
      content: 'This is the full text of the introduction.'
    });
    console.log("Updated Chapter 1:", updatedChapter1);
  }

   if (chapter1 && chapter2) {
    console.log("Updating chapter order (swapping Chapter 1 and 2)...");
    const orderUpdateSuccess = await chapterService.updateChapterOrder([
        { id: chapter1.id, order: 1 },
        { id: chapter2.id, order: 0 }
    ]);
    console.log("Order update successful:", orderUpdateSuccess);

    console.log(`Listing chapters again for project ${projectId}...`);
    const reorderedChapters = await chapterService.getChaptersByProjectId(projectId);
    console.log("Reordered Chapters:", reorderedChapters);
  }


  if (chapter2) {
    console.log(`Deleting chapter ${chapter2.id}...`);
    const deleted = await chapterService.deleteChapter(chapter2.id);
    console.log("Deletion successful:", deleted);

    console.log(`Listing chapters again for project ${projectId}...`);
    const remainingChapters = await chapterService.getChaptersByProjectId(projectId);
    console.log("Remaining Chapters:", remainingChapters);
  }

  console.log("Cleaning up test project...");
  await projectService.deleteProject(projectId);

  console.log("Saving DB...");
  await dbService.save();
}

// Run the test function
// testChapterService().catch(console.error);
*/
