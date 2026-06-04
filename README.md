# Composition Studio

Composition Studio is a local, single-page web app for generating new AI painting-reference studies from up to five source images. Each source image can include an artist note, and those comments influence five generated study variations displayed in the app.

The app has no backend. Images are uploaded locally in the browser, stored in IndexedDB, and sent directly from the browser to OpenAI only when the user clicks Generate.

## Tech Stack

- Vite
- React
- TypeScript
- OpenAI Images API client
- Dexie / IndexedDB
- Lucide React icons

## What The App Does

- Add up to five source images.
- Add comments for each image.
- Generate five new AI artistic study images.
- Use comments to influence mood, lighting, focus, color treatment, and layout.
- Use uploaded images as references for a new image, such as a brand new portrait inspired by several portrait references.
- Click any study to view a larger modal preview.
- Persist source images, comments, and studies locally in the browser.
- Load the OpenAI API key from a local `.env` file.

Because this app intentionally has no backend, the OpenAI API key is loaded from Vite environment variables and used directly by browser `fetch` requests to the OpenAI Images API. This is appropriate for a private local tool, but it is not appropriate for a public deployed app because browser runtime credentials can be inspected.

The generation prompt instructs the image model to use uploaded images only as high-level references and to create a new original image rather than copying an exact face, identity, pose, clothing, background, or composition.

## Install

```bash
npm install
```

On Windows PowerShell, if `npm` is blocked by script execution policy, use:

```bash
npm.cmd install
```

## Configure API Key

Create a `.env` file in the repo root:

```text
VITE_OPENAI_API_KEY=sk-your-api-key-here
```

The `.env` file is ignored by Git. Vite reads this value when the dev server starts or when the app is built. Restart the dev server after changing `.env`.

## Run Locally

```bash
npm run dev
```

PowerShell alternative:

```bash
npm.cmd run dev
```

Then open the local URL Vite prints, usually:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

PowerShell alternative:

```bash
npm.cmd run build
```

The production build is written to `dist/`.

## Preview Production Build

```bash
npm run preview
```

PowerShell alternative:

```bash
npm.cmd run preview
```

## Notes

- There are no unit tests in this project by request.
- The app does not include image download controls.
- The app calls `POST https://api.openai.com/v1/images/edits` with `gpt-image-2`.
- Web scraping arbitrary images from the browser is intentionally avoided because CORS, site policies, robots rules, and copyright constraints make direct scraping unreliable and risky in a no-backend app.
