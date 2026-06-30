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

## Unit Tests

Unit tests are kept in one unified location:

```text
tests/unit/
```

Run the full unit test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

The coverage gate is configured in `vite.config.ts` and requires at least 90% line coverage for the unit-scoped source modules. The current suite covers OpenAI image generation behavior, local IndexedDB persistence, and core App rendering/generation flows.

## Linting

Run ESLint locally:

```bash
npm run lint
```

Generate an ESLint SARIF report for GitHub code scanning:

```bash
npm run lint:sarif
```

The SARIF file is written to `reports/eslint.sarif`; `reports/` is ignored by Git.

## CI Pipeline

The GitHub Actions workflow lives at `.github/workflows/ci.yml` and runs on pull requests, pushes to `main`, and manual dispatch.

- `Unit Tests and Build`: installs with `npm ci`, runs ESLint, runs `npm run test:coverage`, builds the app, and uploads `coverage/lcov.info` as an artifact.
- `Code Scanning / Quality`: runs ESLint with SARIF output and uploads the results to GitHub code scanning.
- `Code Scanning / Security`: runs CodeQL for JavaScript/TypeScript with the `security-and-quality` query suite.
- `Dependency Security`: runs GitHub Dependency Review on pull requests and `npm audit --omit=dev --audit-level=moderate`.

GitHub code scanning and Dependency Review are free for public repositories on GitHub.com. For private or internal repositories, GitHub documents these features as requiring GitHub Code Security or Advanced Security to be enabled.

## Preview Production Build

```bash
npm run preview
```

PowerShell alternative:

```bash
npm.cmd run preview
```

## Notes

- The app does not include image download controls.
- The app calls `POST https://api.openai.com/v1/images/edits` with `gpt-image-2`.
- Web scraping arbitrary images from the browser is intentionally avoided because CORS, site policies, robots rules, and copyright constraints make direct scraping unreliable and risky in a no-backend app.
