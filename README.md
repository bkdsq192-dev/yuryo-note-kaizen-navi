# yuryo-note-kaizen-navi

A static React + TypeScript + Vite web app for reviewing and improving a paid note product page.
It helps users整理 the title, free section, paid section, X / Threads lead flow, and a 7-day improvement plan.

## Public URLs
- GitHub Pages URL: `https://<GitHub-username>.github.io/yuryo-note-kaizen-navi/`
- GitHub repository URL: `https://github.com/<GitHub-username>/yuryo-note-kaizen-navi`

Replace `<GitHub-username>` with your actual GitHub username after publishing.

## Features
- Static frontend app built with React, TypeScript, and Vite
- Data is stored only in the browser `localStorage`
- No backend and no external server-side data storage
- JSON export / import for backup and restore
- Auto-save and resume from the last step
- Final design sheet output for copy / print

## Important notes
- This site is published as a public GitHub Pages URL. Anyone who knows the URL can access it.
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

## GitHub Pages deployment
### 1. Create a repository
Create a public GitHub repository named `yuryo-note-kaizen-navi`.
Use `main` as the default branch.

### 2. Add remote and push
```bash
git remote add origin https://github.com/<GitHub-username>/yuryo-note-kaizen-navi.git
git push -u origin main
```

### 3. Enable GitHub Pages from GitHub Actions
Open:
- `Settings`
- `Pages`
- `Build and deployment`
- `Source`
- select `GitHub Actions`

### 4. Auto deploy
Push to `main` to trigger `.github/workflows/deploy.yml`.
The workflow runs:
- `npm ci`
- `npm test`
- `npm run build`
- GitHub Pages deploy

Future updates are automatically re-published when you push to `main`.

## Vite base path
GitHub Pages repository name is controlled in two places:
- `vite.config.ts`
- `.github/workflows/deploy.yml` via `GITHUB_PAGES_REPOSITORY`

If you rename the repository later, update both values to the new repository name.

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
