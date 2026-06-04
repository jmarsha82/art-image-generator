import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Maximize2, Palette, Sparkles, Trash2, X } from "lucide-react";
import { generateAiStudies } from "./openaiImages";
import { loadProject, saveProject } from "./storage";
import type { SourceImage, Study } from "./types";

const MAX_IMAGES = 5;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? "";

export function App() {
  const [sources, setSources] = useState<SourceImage[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const [subjectPrompt, setSubjectPrompt] = useState(
    "Create a brand new portrait of a woman for use as a painting reference.",
  );
  const [stylePrompt, setStylePrompt] = useState(
    "Painterly fine-art portrait, natural human anatomy, cohesive lighting, believable expression, rich but restrained color.",
  );
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [size, setSize] = useState<"1024x1024" | "1024x1536" | "1536x1024">("1024x1536");
  const [error, setError] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    loadProject().then((project) => {
      setSources(project.sources);
      setStudies(project.studies);
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveProject({ sources, studies });
  }, [sources, studies]);

  const filledSlots = useMemo(() => Array.from({ length: MAX_IMAGES }, (_, index) => sources[index] ?? null), [sources]);

  async function handleFile(index: number, file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;

    const dataUrl = await readFile(file);
    setSources((current) => {
      const next = [...current];
      next[index] = {
        id: current[index]?.id ?? crypto.randomUUID(),
        name: file.name,
        dataUrl,
        comment: current[index]?.comment ?? "",
      };
      return next.filter(Boolean);
    });
    setActiveSlot(index);
  }

  function updateComment(index: number, comment: string) {
    setSources((current) => {
      const next = [...current];
      const existing = next[index];
      if (!existing) return current;
      next[index] = { ...existing, comment };
      return next;
    });
  }

  function removeSource(index: number) {
    setSources((current) => current.filter((_, sourceIndex) => sourceIndex !== index));
    setActiveSlot(Math.max(0, index - 1));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");

    try {
      const generated = await generateAiStudies(sources, {
        apiKey: OPENAI_API_KEY,
        subjectPrompt,
        stylePrompt,
        quality,
        size,
      });
      setStudies(generated);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Unable to generate image studies.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="source-rail" aria-label="Source Images">
        <div className="brand-row">
          <div className="brand-mark">
            <Palette size={22} />
          </div>
          <div>
            <h1>Composition Studio</h1>
            <p>Local painting studies</p>
          </div>
        </div>

        <div className="rail-heading">
          <h2>Source Images</h2>
          <span>{sources.length}/{MAX_IMAGES}</span>
        </div>

        <div className="slot-stack">
          {filledSlots.map((source, index) => (
            <article className={`image-slot ${activeSlot === index ? "active" : ""}`} key={source?.id ?? index}>
              <button className="slot-button" onClick={() => setActiveSlot(index)} type="button">
                {source ? (
                  <img alt={`Source ${index + 1}`} src={source.dataUrl} />
                ) : (
                  <span>
                    <ImagePlus size={20} />
                    Add image
                  </span>
                )}
              </button>

              <label className="file-control">
                <input accept="image/*" onChange={(event) => handleFile(index, event.target.files?.[0] ?? null)} type="file" />
                Choose file
              </label>

              {source && (
                <button className="icon-button danger" onClick={() => removeSource(index)} title="Remove image" type="button">
                  <Trash2 size={16} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="workbench" aria-label="Composition controls">
        <header className="workbench-header">
          <div>
            <h2>Generate new painting studies from collected references.</h2>
            <p>Uploaded images and comments guide the AI model toward a new subject, style, lighting, movement, and mood.</p>
          </div>
          <button className="generate-button" disabled={isGenerating} onClick={handleGenerate} type="button">
            <Sparkles size={18} />
            {isGenerating ? "Generating..." : "Generate 5 Studies"}
          </button>
        </header>

        <div className="comment-panel">
          <div className="comment-preview">
            {sources[activeSlot] ? <img alt="" src={sources[activeSlot].dataUrl} /> : <ImagePlus size={38} />}
          </div>
          <div className="comment-fields">
            <label htmlFor="image-comment">Image Comment</label>
            <textarea
              disabled={!sources[activeSlot]}
              id="image-comment"
              onChange={(event) => updateComment(activeSlot, event.target.value)}
              placeholder="Describe what this image should contribute: soft sky, strong diagonal, warm foreground, quiet negative space..."
              value={sources[activeSlot]?.comment ?? ""}
            />
          </div>
        </div>

        <div className="provider-panel">
          <div className="field-stack wide">
            <label htmlFor="subject-prompt">Generation Prompt</label>
            <textarea
              id="subject-prompt"
              onChange={(event) => setSubjectPrompt(event.target.value)}
              value={subjectPrompt}
            />
          </div>

          <div className="field-stack wide">
            <label htmlFor="style-prompt">Style Direction</label>
            <textarea
              id="style-prompt"
              onChange={(event) => setStylePrompt(event.target.value)}
              value={stylePrompt}
            />
          </div>

          <div className="field-stack">
            <label htmlFor="quality">Quality</label>
            <select id="quality" onChange={(event) => setQuality(event.target.value as typeof quality)} value={quality}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="field-stack">
            <label htmlFor="size">Image Size</label>
            <select id="size" onChange={(event) => setSize(event.target.value as typeof size)} value={size}>
              <option value="1024x1024">Square</option>
              <option value="1024x1536">Portrait</option>
              <option value="1536x1024">Landscape</option>
            </select>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="brief-grid">
          <BriefItem label="Engine" value="OpenAI GPT Image 2" />
          <BriefItem label="Inputs" value={`${sources.length} source image${sources.length === 1 ? "" : "s"}`} />
          <BriefItem label="Output" value="5 AI-generated studies" />
          <BriefItem label="Key" value={OPENAI_API_KEY ? "Loaded from .env" : "Missing VITE_OPENAI_API_KEY"} />
        </div>

        <section className="gallery" aria-label="Example Studies">
          <div className="gallery-header">
            <h2>Example Studies</h2>
            <p>Click any study for a larger modal view.</p>
          </div>

          <div className="study-grid">
            {(studies.length ? studies : []).map((study) => (
              <button className="study-card" key={study.id} onClick={() => setSelectedStudy(study)} type="button">
                <img alt={study.title} src={study.dataUrl} />
                <span>
                  <strong>{study.title}</strong>
                  <Maximize2 size={15} />
                </span>
                <small>{study.recipe}</small>
              </button>
            ))}

            {studies.length === 0 &&
              Array.from({ length: 5 }, (_, index) => (
                <button className="study-card empty" key={index} onClick={handleGenerate} type="button">
                  <div className="empty-study">
                    <Sparkles size={24} />
                    <strong>Study 0{index + 1}</strong>
                  </div>
                  <small>Ready for AI image generation</small>
                </button>
              ))}
          </div>
        </section>
      </section>

      {selectedStudy && (
        <div className="modal-backdrop" onClick={() => setSelectedStudy(null)} role="presentation">
          <dialog aria-label={`${selectedStudy.title} preview`} className="preview-modal" onClick={(event) => event.stopPropagation()} open>
            <button className="modal-close" onClick={() => setSelectedStudy(null)} title="Close preview" type="button">
              <X size={18} />
            </button>
            <img alt={selectedStudy.title} src={selectedStudy.dataUrl} />
            <div>
              <h2>{selectedStudy.title}</h2>
              <p>{selectedStudy.recipe}</p>
            </div>
          </dialog>
        </div>
      )}
    </main>
  );
}

function BriefItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="brief-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
