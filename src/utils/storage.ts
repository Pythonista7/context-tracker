// src/utils/storage.ts
import { LocalStorage } from "@raycast/api";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export interface Context {
  id: string;
  name: string;
  color: string;
  lastActive: string;
  notes: string[];
  resources: string[];
}

export const STORAGE_PATH = path.join(process.env.HOME!, ".dev-context-tracker");

// Ensure storage directory exists
async function ensureStorageDirectory() {
  await mkdir(STORAGE_PATH, { recursive: true });
}

// Get path to contexts file
function getContextsFilePath() {
  return path.join(STORAGE_PATH, "contexts.json");
}

export async function loadContexts(): Promise<Context[]> {
  try {
    const dataPath = getContextsFilePath();
    await ensureStorageDirectory();

    try {
      const data = await readFile(dataPath, "utf-8");
      if (!data.trim()) {
        // If file is empty, return default contexts
        return getDefaultContexts();
      }
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // If file doesn't exist, create with default contexts
        const defaultContexts = getDefaultContexts();
        await saveContexts(defaultContexts);
        return defaultContexts;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading contexts:', error);
    // Return default contexts as fallback
    return getDefaultContexts();
  }
}

function getDefaultContexts(): Context[] {
  return [
    {
      id: "work",
      name: "Work",
      color: "#FF6B6B",
      lastActive: "current",
      notes: [],
      resources: []
    },
    {
      id: "learning",
      name: "Learning",
      color: "#4ECDC4",
      lastActive: "",
      notes: [],
      resources: []
    }
  ];
}

export async function saveContexts(contexts: Context[]): Promise<void> {
  try {
    await ensureStorageDirectory();
    const dataPath = getContextsFilePath();
    
    // Validate contexts before saving
    if (!Array.isArray(contexts)) {
      throw new Error('Invalid contexts data: expected array');
    }

    // Ensure the JSON is properly formatted
    const jsonString = JSON.stringify(contexts, null, 2);
    
    // Write to a temporary file first
    const tempPath = `${dataPath}.temp`;
    await writeFile(tempPath, jsonString, 'utf-8');
    
    // Verify the JSON is valid by trying to read it
    const verificationRead = await readFile(tempPath, 'utf-8');
    JSON.parse(verificationRead); // This will throw if JSON is invalid
    
    // If verification passes, move the temp file to the real file
    await writeFile(dataPath, jsonString, 'utf-8');
  } catch (error) {
    console.error('Error saving contexts:', error);
    throw error;
  }
}

export async function getCurrentContext(): Promise<Context | null> {
  try {
    // First try LocalStorage
    const storedContext = await LocalStorage.getItem("currentContext");
    if (storedContext) {
      const parsed = JSON.parse(storedContext);
      // Validate the parsed context
      if (parsed && parsed.id && parsed.name) {
        return parsed;
      }
    }
    
    // Fallback to contexts file
    const contexts = await loadContexts();
    return contexts.find(c => c.lastActive === "current") || null;
  } catch (error) {
    console.error('Error getting current context:', error);
    return null;
  }
}

export async function saveCurrentContext(context: Context): Promise<void> {
  try {
    if (!context || !context.id || !context.name) {
      throw new Error('Invalid context data');
    }

    // First update LocalStorage
    const contextToStore = {
      ...context,
      lastActive: "current"
    };
    await LocalStorage.setItem("currentContext", JSON.stringify(contextToStore));

    // Then update contexts file
    const contexts = await loadContexts();
    const updatedContexts = contexts.map(c => ({
      ...c,
      lastActive: c.id === context.id ? "current" : "",
    }));
    await saveContexts(updatedContexts);
  } catch (error) {
    console.error('Error saving current context:', error);
    throw error;
  }
}