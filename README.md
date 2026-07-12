# yuryo-note-kaizen-navi

A static React + TypeScript + Vite web app for reviewing and improving a paid note product page.
It helps users organize the title, free section, paid section, X / Threads lead flow, and a 7-day improvement plan.

## Public URLs
- Vercel production URL: `https://<your-vercel-domain>/`
- Feedback form URL: `https://<your-vercel-domain>/feedback.html`
- New tool request URL: `https://<your-vercel-domain>/new-tool-request.html`
- GitHub repository URL: `https://github.com/<GitHub-username>/yuryo-note-kaizen-navi`
- Legacy GitHub Pages URL: `https://<GitHub-username>.github.io/yuryo-note-kaizen-navi/`

Replace placeholders with the actual domain after deployment.

## Features
- Static frontend app built with React, TypeScript, and Vite
- Data is stored only in the browser `localStorage`
- No backend and no external server-side data storage
- JSON export / import for backup and restore
- Auto-save and resume from the last step
- Final design sheet output for copy / print
- Static companion pages: `feedback.html` and `new-tool-request.html`

## Important notes
- This site is published as a public URL. Anyone who knows the URL can access it.
- Login, purchase verification, and buyer authentication are not implemented.
- Do not include passwords, API keys, personal information, buyer lists, private URLs, or payment information in this repository.
- Do not add fake frontend-only access control and treat it as real protection.

## Local development
```bash
npm install
npm run dev
```

## Test
```bash
npm test
```

## Build
```bash
npm run build
```

Build output is generated in `dist/`.

## Vercel deployment
### 1. Import the repository into Vercel
1. Sign in to Vercel.
2. Click `Add New...`.
3. Choose `Project`.
4. Import `bkdsq192-dev/yuryo-note-kaizen-navi`.

### 2. Confirm the build settings
Use these values if Vercel does not auto-detect them:
- Framework Preset: `Vite`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

This repository also includes `vercel.json` with the same settings.

### 3. Deploy
Click `Deploy`.
After the first deploy, Vercel will automatically rebuild on pushes to `main` if the repository is connected.

### 4. Optional custom domain
After deployment:
1. Open the Vercel project.
2. Go to `Settings`.
3. Open `Domains`.
4. Add your preferred domain if needed.

## Environment and base path
- Default app base path is `/`, which works for Vercel production and preview deployments.
- If you need to serve the app under a subpath, set `APP_BASE_PATH` before running `npm run build`.
- Example: `APP_BASE_PATH=/yuryo-note-kaizen-navi/ npm run build`

## GitHub Pages compatibility
This repository still contains `.github/workflows/deploy.yml` for the existing GitHub Pages site.
If you keep using GitHub Pages, set:
- `APP_BASE_PATH=/<repository-name>/`

The existing Pages workflow in this repository already exports that variable for the current repository path.

## Storage behavior
- Input data is saved to browser `localStorage`
- Saved input is restored after reload
- If browser data is deleted, saved input is also deleted
- JSON backup is recommended for long-term retention

## JSON backup
1. Click `JSON export`
2. Save the `.json` file
3. Use `JSON import` to restore later

Invalid JSON or non-app JSON shows a readable error message.

## Privacy notice shown in the app
- Input data is saved only in the browser on this device and is not sent to an external server.
- This tool does not guarantee sales or revenue. It is a self-check tool for clarifying what is already defined and what still needs improvement in a paid note design.

## Manual checklist
Use [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) before and after publishing.
