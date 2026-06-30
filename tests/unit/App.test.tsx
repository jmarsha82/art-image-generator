import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/App";
import { generateAiStudies } from "../../src/openaiImages";
import { loadProject, saveProject } from "../../src/storage";

vi.mock("../../src/openaiImages", () => ({
  generateAiStudies: vi.fn(),
}));

vi.mock("../../src/storage", () => ({
  loadProject: vi.fn(),
  saveProject: vi.fn(),
}));

const mockedGenerateAiStudies = vi.mocked(generateAiStudies);
const mockedLoadProject = vi.mocked(loadProject);
const mockedSaveProject = vi.mocked(saveProject);

describe("App", () => {
  beforeEach(() => {
    mockedGenerateAiStudies.mockReset();
    mockedLoadProject.mockResolvedValue({
      id: "local-composition-studio",
      sources: [],
      studies: [],
      updatedAt: 1,
    });
    mockedSaveProject.mockResolvedValue();
  });

  it("renders the empty composition studio state", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Composition Studio" })).toBeInTheDocument();
    expect(await screen.findByText("0/5")).toBeInTheDocument();
    expect(screen.getByText(/Loaded from \.env|Missing VITE_OPENAI_API_KEY/)).toBeInTheDocument();
    expect(screen.getAllByText(/Ready for AI image generation/)).toHaveLength(5);
  });

  it("generates studies and displays returned images", async () => {
    mockedLoadProject.mockResolvedValue({
      id: "local-composition-studio",
      sources: [
        {
          id: "source-1",
          name: "portrait.png",
          dataUrl: "data:image/png;base64,cmVm",
          comment: "Strong diagonal light.",
        },
      ],
      studies: [],
      updatedAt: 1,
    });
    mockedGenerateAiStudies.mockResolvedValue([
      {
        id: "study-1",
        title: "Study 01",
        dataUrl: "data:image/jpeg;base64,b3V0",
        recipe: "AI-generated original reference.",
      },
    ]);

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Generate 5 Studies/ }));

    expect(await screen.findByRole("img", { name: "Study 01" })).toBeInTheDocument();
    expect(mockedGenerateAiStudies).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "source-1" })]),
      expect.objectContaining({
        quality: "medium",
        size: "1024x1536",
      }),
    );
  });

  it("shows generation errors and restores the button state", async () => {
    mockedGenerateAiStudies.mockRejectedValue(new Error("Add at least one reference image before generating studies."));

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Generate 5 Studies/ }));

    expect(await screen.findByText("Add at least one reference image before generating studies.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Generate 5 Studies/ })).toBeEnabled();
    });
  });
});
