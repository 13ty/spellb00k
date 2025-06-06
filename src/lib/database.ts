// src/lib/database.ts
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// Define the expected path for the WASM file in the public directory
const SQL_WASM_PATH = '/sql-wasm.wasm'; // Path relative to the public root

async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  if (!SQL) {
    try {
      console.log("Attempting to initialize SQL.js with locateFile...");
      // Use locateFile to explicitly point to the WASM file served by Vite
      SQL = await initSqlJs({
        locateFile: (file) => {
            console.log(`locateFile called with: ${file}. Returning: ${SQL_WASM_PATH}`);
            // Ensure it always returns the correct path relative to the root
            return SQL_WASM_PATH;
        }
      });
      console.log("SQL.js initialized successfully.");
    } catch (err) {
        console.error("Failed to initialize SQL.js:", err);
        if (err instanceof Error) {
            console.error("Error name:", err.name);
            console.error("Error message:", err.message);
            console.error("Error stack:", err.stack);
        }
         throw new Error(`SQL.js initialization failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Initialize a new, empty database in memory
  console.log('Initializing new in-memory database.');
  try {
    db = new SQL.Database();
  } catch (error) {
     console.error("Failed to create SQL.Database instance:", error);
     throw new Error(`Failed to create database instance: ${error instanceof Error ? error.message : error}`);
  }


  // Create tables if they don't exist (idempotent)
  try {
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          parameters TEXT, -- Store parameters as JSON string
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS chapters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          projectId INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          content TEXT,
          "order" INTEGER NOT NULL, -- Use quotes for reserved keyword
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);

       // ##@@TAG: Create Messages Table
       db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          projectId INTEGER NOT NULL,
          chapterId INTEGER, -- Optional: NULL if message is not chapter-specific
          role TEXT NOT NULL, -- 'user', 'assistant', 'system'
          content TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE
        );
      `);


      // Optional: Add triggers to update 'updatedAt' timestamps automatically
      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_project_updatedAt
        AFTER UPDATE ON projects
        FOR EACH ROW
        BEGIN
          UPDATE projects SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
      `);

      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_chapter_updatedAt
        AFTER UPDATE ON chapters
        FOR EACH ROW
        BEGIN
          UPDATE chapters SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
      `);
      console.log("Database tables ensured.");
  } catch (error) {
      console.error("Error ensuring database tables:", error);
      db?.close();
      db = null;
      throw new Error(`Failed to set up database tables: ${error instanceof Error ? error.message : error}`);
  }


  console.log('In-memory database initialized successfully.');
  return db;
}

/**
 * Exports the current database state as a Uint8Array.
 * This is used by the "Save Project to File" functionality.
 * @returns A Uint8Array representing the database file.
 */
async function exportDatabase(): Promise<Uint8Array | null> {
    // Ensure DB is initialized before exporting
    const currentDb = await initializeDatabase();
    try {
        const data = currentDb.export();
        console.log('Database exported to Uint8Array.');
        return data;
    } catch (error) {
        console.error('Error exporting database:', error);
        return null;
    }
}

/**
 * Loads database data from a Uint8Array, replacing the current in-memory database.
 * This is used by the "Load Project from File" functionality.
 * WARNING: This replaces the entire database state.
 * @param data - The Uint8Array containing the database file data.
 * @returns True if successful, false otherwise.
 */
async function loadDatabaseFromFile(data: Uint8Array): Promise<boolean> {
    if (!SQL) {
         // Initialize SQL.js if it hasn't been already
         try {
            console.log("Initializing SQL.js for file load...");
            // Use locateFile here too
            SQL = await initSqlJs({
                locateFile: (file) => {
                    console.log(`locateFile (load) called with: ${file}. Returning: ${SQL_WASM_PATH}`);
                    return SQL_WASM_PATH;
                }
            });
            console.log("SQL.js initialized for file load.");
         } catch (error) {
             console.error('Failed to initialize SQL.js for loading:', error);
             return false;
         }
    }
    if (db) {
        // Close the current database connection before loading a new one
        try {
            db.close();
            console.log('Closed current in-memory database connection.');
        } catch (error) {
            console.error('Error closing current database:', error);
            // Continue loading, but log the error
        }
    }

    try {
        // Create a new database instance from the loaded data
        console.log("Attempting to load database from provided data...");
        db = new SQL.Database(data);
        console.log('Database loaded from file data into memory.');
        return true;
    } catch (error) {
        console.error('Error loading database from file data:', error);
        db = null; // Ensure db is null if loading failed
        return false;
    }
}


// Function to run SQL commands (INSERT, UPDATE, DELETE, CREATE, etc.)
async function run(sql: string, params: (string | number | null | Uint8Array)[] = []): Promise<void> {
  const currentDb = await initializeDatabase(); // Ensures DB is ready
  currentDb.run(sql, params);
}

// Function to get results (SELECT) - returns array of objects
async function get<T>(sql: string, params: (string | number | null | Uint8Array)[] = []): Promise<T[]> {
    const currentDb = await initializeDatabase(); // Ensures DB is ready
    const stmt = currentDb.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
}

// Function to get a single result (SELECT) - returns single object or null
async function getOne<T>(sql: string, params: (string | number | null | Uint8Array)[] = []): Promise<T | null> {
    const results = await get<T>(sql, params);
    return results.length > 0 ? results[0] : null;
}


export const dbService = {
  initialize: initializeDatabase,
  run,
  get,
  getOne,
  exportDatabase,
  loadDatabaseFromFile,
};
