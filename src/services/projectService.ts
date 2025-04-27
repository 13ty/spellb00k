// src/services/projectService.ts
import { dbService } from '../lib/database';
import type { Project, EbookParameters, Chapter, EbookProjectExport } from '../types/models';
import { chapterService } from './chapterService'; // Import chapterService to fetch chapters

// Helper to safely parse JSON parameters
function parseParameters(paramsString: string | null | undefined): EbookParameters | undefined {
  if (!paramsString) return undefined;
  try {
    return JSON.parse(paramsString);
  } catch (e) {
    console.error("Failed to parse project parameters:", e);
    return undefined; // Return undefined or a default object if parsing fails
  }
}

export const projectService = {
  /**
   * Creates a new project in the database.
   * @param name - The name of the project.
   * @param description - Optional description for the project.
   * @param parameters - Optional ebook parameters.
   * @returns The newly created project object or null if creation failed.
   */
  async createProject(
    name: string,
    description?: string,
    parameters?: EbookParameters
  ): Promise<Project | null> {
    const paramsString = parameters ? JSON.stringify(parameters) : null;
    try {
      // ##@@TAG: Create Project
      await dbService.run(
        'INSERT INTO projects (name, description, parameters) VALUES (?, ?, ?)',
        [name, description ?? null, paramsString]
      );

      // Retrieve the last inserted project using last_insert_rowid()
      // Note: last_insert_rowid() is session-specific, which is fine for sql.js in this context
      const newProject = await dbService.getOne<Project>(
        'SELECT * FROM projects WHERE id = last_insert_rowid()'
      );

      // We need to manually parse parameters back if needed, though the raw Project type expects string
      // If the Project type definition changes to expect EbookParameters object, parsing is needed here.
      // For now, we return the raw object from DB which matches the Project interface (parameters as string)

      return newProject; // newProject already includes createdAt/updatedAt defaults from DB
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  },

  /**
   * Retrieves all projects from the database.
   * @returns An array of project objects.
   */
  async listProjects(): Promise<Project[]> {
    try {
      const projects = await dbService.get<Project>('SELECT * FROM projects ORDER BY createdAt DESC');
      // Again, parameters are stored as JSON strings. No parsing needed here unless the consumer expects objects.
      return projects;
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  },

  /**
   * Retrieves a single project by its ID.
   * @param id - The ID of the project to retrieve.
   * @returns The project object or null if not found.
   */
  async getProjectById(id: number): Promise<Project | null> {
    try {
      const project = await dbService.getOne<Project>(
        'SELECT * FROM projects WHERE id = ?',
        [id]
      );
      // Parameters remain as string as per the Project interface
      return project;
    } catch (error) {
      console.error(`Error getting project with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Updates an existing project.
   * @param id - The ID of the project to update.
   * @param updates - An object containing the fields to update.
   * @returns The updated project object or null if not found or update failed.
   */
  async updateProject(
    id: number,
    updates: Partial<Pick<Project, 'name' | 'description'>> & { parameters?: EbookParameters }
  ): Promise<Project | null> {
    const fieldsToUpdate: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fieldsToUpdate.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fieldsToUpdate.push('description = ?');
      values.push(updates.description);
    }
    if (updates.parameters !== undefined) {
      fieldsToUpdate.push('parameters = ?');
      values.push(JSON.stringify(updates.parameters));
    }

    if (fieldsToUpdate.length === 0) {
      console.warn('No fields provided for update.');
      return this.getProjectById(id); // Return current project if no updates
    }

    // Add updatedAt trigger manually if not using DB triggers (DB triggers are set up)
    // fieldsToUpdate.push('updatedAt = CURRENT_TIMESTAMP');

    const sql = `UPDATE projects SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    values.push(id);

    try {
      await dbService.run(sql, values);
      return this.getProjectById(id); // Fetch the updated project
    } catch (error) {
      console.error(`Error updating project with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Deletes a project and its associated chapters (due to ON DELETE CASCADE).
   * @param id - The ID of the project to delete.
   * @returns True if deletion was successful, false otherwise.
   */
  async deleteProject(id: number): Promise<boolean> {
    try {
      await dbService.run('DELETE FROM projects WHERE id = ?', [id]);
      // Verify deletion (optional)
      // const project = await this.getProjectById(id);
      // return project === null;
      return true; // Assume success if no error thrown
    } catch (error) {
      console.error(`Error deleting project with ID ${id}:`, error);
      return false;
    }
  },

  /**
   * Exports a project's data (details, parameters, chapters) to a structured object.
   * @param projectId - The ID of the project to export.
   * @returns A structured object suitable for JSON export, or null if the project is not found.
   */
  async exportProjectToJson(projectId: number): Promise<EbookProjectExport | null> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        console.warn(`Project with ID ${projectId} not found for export.`);
        return null;
      }

      const chapters = await chapterService.getChaptersByProjectId(projectId);

      // Format chapters for export (omit DB-specific fields)
      const exportedChapters = chapters.map(chapter => ({
        title: chapter.title,
        description: chapter.description,
        content: chapter.content,
        order: chapter.order,
      }));

      // Parse parameters from string to object for export
      const parameters = parseParameters(project.parameters);

      const exportData: EbookProjectExport = {
        name: project.name,
        description: project.description,
        parameters: parameters,
        chapters: exportedChapters,
        // Optionally add chat messages here if needed
        // chatMessages: await chatService.getMessages(projectId) // Requires chatService import
      };

      return exportData;

    } catch (error) {
      console.error(`Error exporting project with ID ${projectId} to JSON:`, error);
      return null;
    }
  }
};

// Example Usage (can be removed or placed in a test file)
/*
import { dbService } from '../lib/database';
import { chapterService } from './chapterService'; // Ensure chapterService is imported for exportProjectToJson example
// import { chatService } from './chatService'; // Uncomment if including chat messages in export example

async function testProjectService() {
  console.log("Initializing DB for test...");
  await dbService.initialize(); // Ensure DB is ready

  // ... (previous test code for create, list, get, update, delete) ...

  // Test Export
  console.log("Creating a test project for export...");
  const exportTestProject = await projectService.createProject(
    'Export Test Ebook',
    'A project to test JSON export',
    { genre: 'Mystery', chapterLength: 'short' }
  );

  if (exportTestProject) {
      await chapterService.createChapter(exportTestProject.id, 'Chapter 1', 'Intro');
      await chapterService.createChapter(exportTestProject.id, 'Chapter 2', 'Middle');
      await chapterService.updateChapter( (await chapterService.getChaptersByProjectId(exportTestProject.id))[0].id, { content: 'Content for chapter 1.' });

      console.log(`Exporting project ${exportTestProject.id} to JSON...`);
      const exportedData = await projectService.exportProjectToJson(exportTestProject.id);
      console.log("Exported Data:", JSON.stringify(exportedData, null, 2));

      console.log("Cleaning up export test project...");
      await projectService.deleteProject(exportTestProject.id);
  }


  console.log("Saving DB...");
  await dbService.save();
}

// Run the test function
// testProjectService().catch(console.error);
*/
