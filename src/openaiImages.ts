import type { SourceImage, Study } from "./types";

type GenerateOptions = {
  apiKey: string;
  subjectPrompt: string;
  stylePrompt: string;
  quality: "low" | "medium" | "high";
  size: "1024x1024" | "1024x1536" | "1536x1024";
};

const OPENAI_IMAGE_EDIT_URL = "https://api.openai.com/v1/images/edits";

const variants = [
  "Study 01: balanced portrait, direct gaze, calm painterly structure.",
  "Study 02: three-quarter portrait, softer expression, atmospheric background.",
  "Study 03: dramatic light, refined facial planes, expressive brushwork.",
  "Study 04: contemplative pose, simplified background, strong color harmony.",
  "Study 05: intimate portrait crop, subtle asymmetry, gallery-quality finish.",
];

export async function generateAiStudies(sources: SourceImage[], options: GenerateOptions): Promise<Study[]> {
  if (sources.length === 0) {
    throw new Error("Add at least one reference image before generating studies.");
  }

  if (!options.apiKey.trim()) {
    throw new Error("Enter an OpenAI API key to generate AI image studies.");
  }

  const generated: Study[] = [];

  for (let index = 0; index < variants.length; index += 1) {
    const prompt = buildPrompt(sources, options, variants[index]);
    const dataUrl = await createImageEdit(sources, options, prompt);

    generated.push({
      id: crypto.randomUUID(),
      title: `Study 0${index + 1}`,
      dataUrl,
      recipe: `AI-generated original reference; ${variants[index].replace(/^Study \d+: /, "")}`,
    });
  }

  return generated;
}

function buildPrompt(sources: SourceImage[], options: GenerateOptions, variant: string) {
  const imageNotes = sources
    .map((source, index) => {
      const comment = source.comment.trim() || "Use high-level visual qualities from this reference.";
      return `Reference ${index + 1}: ${comment}`;
    })
    .join("\n");

  return `
Create a completely new, original artistic image.

Primary subject:
${options.subjectPrompt}

Style direction:
${options.stylePrompt}

Variant:
${variant}

Reference image notes:
${imageNotes}

Use the uploaded images only as references for high-level qualities such as age range, facial mood, lighting, pose language, color palette, materials, brushwork, atmosphere, and composition rhythm.

Do not copy, trace, collage, reproduce, preserve, or directly transform any exact face, identity, pose, clothing, background, image crop, camera angle, or composition from the uploaded images.

The final result must look like a newly imagined person and a never-before-seen painting reference, not an edit or blend of the source images.

Output only the finished image. No text, watermark, border, split screen, grid, or labels.
`.trim();
}

async function createImageEdit(sources: SourceImage[], options: GenerateOptions, prompt: string) {
  const formData = new FormData();
  formData.append("model", "gpt-image-2");
  formData.append("prompt", prompt);
  formData.append("size", options.size);
  formData.append("quality", options.quality);
  formData.append("output_format", "jpeg");

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    const file = await dataUrlToFile(source.dataUrl, source.name || `reference-${index + 1}.png`);
    formData.append("image[]", file);
  }

  const response = await fetch(OPENAI_IMAGE_EDIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey.trim()}`,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `OpenAI image request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const base64 = payload?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("The image API response did not include generated image data.");
  }

  return `data:image/jpeg;base64,${base64}`;
}

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extensionType = blob.type || "image/png";
  const safeName = filename.includes(".") ? filename : `${filename}.${extensionType.split("/")[1] ?? "png"}`;

  return new File([blob], safeName, { type: extensionType });
}
