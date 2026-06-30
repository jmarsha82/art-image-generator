import { afterEach, describe, expect, it } from "vitest";
import { db, loadProject, saveProject } from "../../src/storage";

describe("project storage", () => {
  afterEach(async () => {
    await db.projects.clear();
  });

  it("returns a default local project when nothing has been saved", async () => {
    const project = await loadProject();

    expect(project).toMatchObject({
      id: "local-composition-studio",
      sources: [],
      studies: [],
    });
    expect(project.updatedAt).toEqual(expect.any(Number));
  });

  it("persists source images and generated studies", async () => {
    await saveProject({
      sources: [
        {
          id: "source-1",
          name: "portrait.png",
          dataUrl: "data:image/png;base64,cmVm",
          comment: "Cool rim light.",
        },
      ],
      studies: [
        {
          id: "study-1",
          title: "Study 01",
          dataUrl: "data:image/jpeg;base64,b3V0",
          recipe: "AI-generated original reference.",
        },
      ],
    });

    const project = await loadProject();

    expect(project.id).toBe("local-composition-studio");
    expect(project.sources).toHaveLength(1);
    expect(project.studies[0].title).toBe("Study 01");
    expect(project.updatedAt).toEqual(expect.any(Number));
  });
});
