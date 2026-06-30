import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAiStudies } from "../../src/openaiImages";
import type { SourceImage } from "../../src/types";

const sourceImage: SourceImage = {
  id: "source-1",
  name: "portrait",
  dataUrl: "data:image/png;base64,cmVm",
  comment: "Soft north light and quiet expression.",
};

const options = {
  apiKey: " sk-test ",
  subjectPrompt: "A new portrait subject.",
  stylePrompt: "Painterly but grounded.",
  quality: "medium" as const,
  size: "1024x1536" as const,
};

describe("generateAiStudies", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "crypto",
      {
        randomUUID: vi.fn()
          .mockReturnValueOnce("study-1")
          .mockReturnValueOnce("study-2")
          .mockReturnValueOnce("study-3")
          .mockReturnValueOnce("study-4")
          .mockReturnValueOnce("study-5"),
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates five study records from successful image edit responses", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith("data:image/png")) {
        return {
          blob: async () => new Blob(["reference"], { type: "image/png" }),
        } as Response;
      }

      return new Response(JSON.stringify({ data: [{ b64_json: "generated-image" }] }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const studies = await generateAiStudies([sourceImage], options);

    expect(studies).toHaveLength(5);
    expect(studies[0]).toEqual({
      id: "study-1",
      title: "Study 01",
      dataUrl: "data:image/jpeg;base64,generated-image",
      recipe: "AI-generated original reference; balanced portrait, direct gaze, calm painterly structure.",
    });

    const apiCalls = fetchMock.mock.calls.filter(([input]) => String(input).includes("/v1/images/edits"));
    expect(apiCalls).toHaveLength(5);
    expect(apiCalls[0][1]).toMatchObject({
      method: "POST",
      headers: { Authorization: "Bearer sk-test" },
    });
    const body = apiCalls[0][1]?.body as FormData;
    expect(body.get("model")).toBe("gpt-image-2");
    expect(body.get("quality")).toBe("medium");
    expect(String(body.get("prompt"))).toContain("Reference 1: Soft north light and quiet expression.");
  });

  it("requires at least one source image", async () => {
    await expect(generateAiStudies([], options)).rejects.toThrow("Add at least one reference image");
  });

  it("requires an api key", async () => {
    await expect(generateAiStudies([sourceImage], { ...options, apiKey: " " })).rejects.toThrow("OpenAI API key");
  });

  it("surfaces api error messages", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith("data:image/png")) {
        return {
          blob: async () => new Blob(["reference"], { type: "image/png" }),
        } as Response;
      }

      return new Response(JSON.stringify({ error: { message: "Image quota exceeded." } }), {
        headers: { "Content-Type": "application/json" },
        status: 429,
      });
    }));

    await expect(generateAiStudies([sourceImage], options)).rejects.toThrow("Image quota exceeded.");
  });
});
