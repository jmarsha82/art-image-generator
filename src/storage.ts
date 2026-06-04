import Dexie, { type Table } from "dexie";
import type { ProjectState } from "./types";

const PROJECT_ID = "local-composition-studio";

class StudioDatabase extends Dexie {
  projects!: Table<ProjectState, string>;

  constructor() {
    super("composition-studio");
    this.version(1).stores({
      projects: "id, updatedAt",
    });
  }
}

export const db = new StudioDatabase();

export async function loadProject(): Promise<ProjectState> {
  const existing = await db.projects.get(PROJECT_ID);

  return (
    existing ?? {
      id: PROJECT_ID,
      sources: [],
      studies: [],
      updatedAt: Date.now(),
    }
  );
}

export async function saveProject(state: Omit<ProjectState, "id" | "updatedAt">) {
  await db.projects.put({
    id: PROJECT_ID,
    ...state,
    updatedAt: Date.now(),
  });
}
